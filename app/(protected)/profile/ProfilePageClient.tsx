'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Instagram, MapPin, Calendar, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface Profile {
  id: string
  full_name: string
  phone: string
  instagram: string | null
  address_cep: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

interface ProfilePageClientProps {
  initialProfile: Profile
  email: string
}

// Mascara de telefone: (99) 99999-9999
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

// Mascara de CEP: 99999-999
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

// Formatar data para exibicao
function formatMemberSince(dateString: string): string {
  const date = new Date(dateString)
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]
  return `${months[date.getMonth()]}/${date.getFullYear()}`
}

// Obter iniciais do nome
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function ProfilePageClient({ initialProfile, email }: ProfilePageClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || '',
    phone: formatPhone(initialProfile.phone || ''),
    instagram: initialProfile.instagram || '',
    address_cep: formatCep(initialProfile.address_cep || ''),
    address_street: initialProfile.address_street || '',
    address_number: initialProfile.address_number || '',
    address_complement: initialProfile.address_complement || '',
    address_neighborhood: initialProfile.address_neighborhood || '',
    address_city: initialProfile.address_city || '',
    address_state: initialProfile.address_state || '',
  })

  const [originalData] = useState({ ...formData })

  // Detectar mudancas no formulario
  useEffect(() => {
    const changed = Object.keys(formData).some(
      (key) => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
    )
    setHasChanges(changed)
  }, [formData, originalData])

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'phone') {
      formattedValue = formatPhone(value)
    } else if (field === 'address_cep') {
      formattedValue = formatCep(value)
    } else if (field === 'address_state') {
      formattedValue = value.toUpperCase().slice(0, 2)
    } else if (field === 'instagram') {
      // Remove @ se o usuario digitar
      formattedValue = value.replace(/^@/, '')
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleCepSearch = async () => {
    const cep = formData.address_cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      toast.error('CEP deve ter 8 digitos')
      return
    }

    setIsCepLoading(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP nao encontrado')
        return
      }

      setFormData((prev) => ({
        ...prev,
        address_street: data.logradouro || '',
        address_neighborhood: data.bairro || '',
        address_city: data.localidade || '',
        address_state: data.uf || '',
      }))

      toast.success('Endereco encontrado!')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setIsCepLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ ...originalData })
    toast.info('Alteracoes descartadas')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validacao
    if (!formData.full_name.trim()) {
      toast.error('Nome completo e obrigatorio')
      return
    }

    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      toast.error('Telefone deve ter pelo menos 10 digitos')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          instagram: formData.instagram,
          address_cep: formData.address_cep,
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_city: formData.address_city,
          address_state: formData.address_state,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar perfil')
        return
      }

      toast.success('Perfil atualizado com sucesso!')
      setHasChanges(false)

      // Atualizar dados originais apos salvar
      window.location.reload()
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informacoes pessoais</p>
      </div>

      {/* Card de Perfil */}
      <Card className="bg-gradient-to-r from-card to-card/80 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {getInitials(formData.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-semibold">{formData.full_name || 'Seu Nome'}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Membro desde {formatMemberSince(initialProfile.created_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        {/* Informacoes Pessoais */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Informacoes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="(99) 99999-9999"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    maxLength={16}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground">@</div>
                <Input
                  id="instagram"
                  placeholder="seu_usuario"
                  className="pl-16"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereco */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Endereco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="address_cep"
                    placeholder="00000-000"
                    value={formData.address_cep}
                    onChange={(e) => handleInputChange('address_cep', e.target.value)}
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCepSearch}
                    disabled={isCepLoading}
                    title="Buscar CEP"
                  >
                    {isCepLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Rua */}
            <div className="space-y-2">
              <Label htmlFor="address_street">Rua</Label>
              <Input
                id="address_street"
                placeholder="Nome da rua"
                value={formData.address_street}
                onChange={(e) => handleInputChange('address_street', e.target.value)}
              />
            </div>

            {/* Numero e Complemento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_number">Numero</Label>
                <Input
                  id="address_number"
                  placeholder="123"
                  value={formData.address_number}
                  onChange={(e) => handleInputChange('address_number', e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-3">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  placeholder="Apto, Bloco, etc."
                  value={formData.address_complement}
                  onChange={(e) => handleInputChange('address_complement', e.target.value)}
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="address_neighborhood">Bairro</Label>
              <Input
                id="address_neighborhood"
                placeholder="Nome do bairro"
                value={formData.address_neighborhood}
                onChange={(e) => handleInputChange('address_neighborhood', e.target.value)}
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  placeholder="Nome da cidade"
                  value={formData.address_city}
                  onChange={(e) => handleInputChange('address_city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Input
                  id="address_state"
                  placeholder="UF"
                  value={formData.address_state}
                  onChange={(e) => handleInputChange('address_state', e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Botoes de Acao */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!hasChanges || isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Alteracoes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

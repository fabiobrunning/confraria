'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Phone,
  Instagram,
  Building2,
  MapPin,
  Calendar,
  Crown,
  Pencil,
  Save,
  X,
  ExternalLink
} from 'lucide-react'

interface Company {
  id: string
  name: string
  cnpj?: string | null
  phone?: string | null
  instagram?: string | null
  description?: string | null
}

interface Member {
  id: string
  full_name: string
  phone: string
  instagram: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_cep: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
  companies: Company[]
}

interface MemberDetailsProps {
  member: Member
  isAdmin: boolean
  isOwnProfile: boolean
  canEdit: boolean
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

function getWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const fullNumber = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${fullNumber}`
}

function getInstagramLink(instagram: string): string {
  const handle = instagram.replace('@', '').trim()
  return `https://instagram.com/${handle}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function formatAddress(member: Member): string | null {
  const parts = [
    member.address_street,
    member.address_number,
    member.address_complement,
    member.address_neighborhood,
    member.address_city,
    member.address_state,
    member.address_cep
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

export function MemberDetails({ member, isAdmin, isOwnProfile, canEdit }: MemberDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: member.full_name,
    phone: member.phone,
    instagram: member.instagram || '',
    address_street: member.address_street || '',
    address_number: member.address_number || '',
    address_complement: member.address_complement || '',
    address_neighborhood: member.address_neighborhood || '',
    address_city: member.address_city || '',
    address_state: member.address_state || '',
    address_cep: member.address_cep || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso'
      })

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar dados',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: member.full_name,
      phone: member.phone,
      instagram: member.instagram || '',
      address_street: member.address_street || '',
      address_number: member.address_number || '',
      address_complement: member.address_complement || '',
      address_neighborhood: member.address_neighborhood || '',
      address_city: member.address_city || '',
      address_state: member.address_state || '',
      address_cep: member.address_cep || ''
    })
    setIsEditing(false)
  }

  const address = formatAddress(member)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>

        {canEdit && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}

        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  {getInitials(member.full_name)}
                </div>
                {member.role === 'admin' && (
                  <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="@usuario"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">
                      {member.full_name}
                    </h1>
                    {isOwnProfile && (
                      <Badge variant="secondary">Voce</Badge>
                    )}
                    {member.role === 'admin' && (
                      <Badge className="bg-amber-500 text-white">Admin</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {member.phone && (
                      <a
                        href={getWhatsAppLink(member.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(member.phone)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {member.instagram && (
                      <a
                        href={getInstagramLink(member.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-pink-500 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <span>@{member.instagram.replace('@', '')}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Membro desde {formatDate(member.created_at)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereco
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_street">Rua</Label>
                <Input
                  id="address_street"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_number">Numero</Label>
                <Input
                  id="address_number"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  name="address_complement"
                  value={formData.address_complement}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro</Label>
                <Input
                  id="address_neighborhood"
                  name="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Input
                  id="address_state"
                  name="address_state"
                  value={formData.address_state}
                  onChange={handleInputChange}
                  maxLength={2}
                  placeholder="SC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_cep">CEP</Label>
                <Input
                  id="address_cep"
                  name="address_cep"
                  value={formData.address_cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {address || 'Endereco nao informado'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Companies Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas Vinculadas
          </CardTitle>
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/companies?link_member=${member.id}`}>
                Vincular Empresa
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {member.companies && member.companies.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {member.companies.map((company) => (
                <Card key={company.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground">{company.name}</h4>
                    {company.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {company.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                      {company.phone && (
                        <a
                          href={getWhatsAppLink(company.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-muted-foreground hover:text-green-500"
                        >
                          <Phone className="h-3 w-3" />
                          {formatPhone(company.phone)}
                        </a>
                      )}
                      {company.instagram && (
                        <a
                          href={getInstagramLink(company.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-muted-foreground hover:text-pink-500"
                        >
                          <Instagram className="h-3 w-3" />
                          @{company.instagram.replace('@', '')}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma empresa vinculada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

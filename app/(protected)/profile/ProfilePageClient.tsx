'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Instagram, MapPin, Calendar, Loader2, Search, Lock, Eye, EyeOff, Building2, Plus, Pencil, Trash2, Globe, AlertTriangle, Coins } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  description: string | null
  phone: string | null
  instagram: string | null
  website: string | null
}

interface Quota {
  id: string
  quota_number: number
  status: string
  group: {
    id: string
    name: string
  } | null
}

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
  quotas?: Quota[]
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

export default function ProfilePageClient({ initialProfile, email, quotas = [] }: ProfilePageClientProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Estados para alteração de senha
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Estados para empresas
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    phone: '',
    instagram: '',
    website: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState(false)

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

  // Carregar empresas do membro
  useEffect(() => {
    async function loadCompanies() {
      try {
        const { data, error } = await supabase
          .from('member_companies')
          .select(`
            company_id,
            companies (
              id,
              name,
              description,
              phone,
              instagram,
              website
            )
          `)
          .eq('member_id', initialProfile.id)

        if (error) throw error

        const memberCompanies = (data || [])
          .map((mc: { companies: Company | null }) => mc.companies)
          .filter((c): c is Company => c !== null)

        setCompanies(memberCompanies)
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      } finally {
        setLoadingCompanies(false)
      }
    }

    loadCompanies()
  }, [supabase, initialProfile.id])

  // Funções para gerenciar empresas
  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company)
      setCompanyForm({
        name: company.name,
        description: company.description || '',
        phone: company.phone || '',
        instagram: company.instagram || '',
        website: company.website || '',
      })
    } else {
      setEditingCompany(null)
      setCompanyForm({ name: '', description: '', phone: '', instagram: '', website: '' })
    }
    setCompanyModalOpen(true)
  }

  const saveCompany = async () => {
    if (!companyForm.name.trim()) {
      toast.error('Nome da empresa é obrigatório')
      return
    }

    setSavingCompany(true)
    try {
      if (editingCompany) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            name: companyForm.name,
            description: companyForm.description || null,
            phone: companyForm.phone || null,
            instagram: companyForm.instagram || null,
            website: companyForm.website || null,
          } as never)
          .eq('id', editingCompany.id)

        if (error) throw error
        toast.success('Empresa atualizada!')
      } else {
        // Criar nova empresa
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyForm.name,
            description: companyForm.description || null,
            phone: companyForm.phone || null,
            instagram: companyForm.instagram || null,
            website: companyForm.website || null,
          } as never)
          .select()
          .single()

        if (companyError) throw companyError

        // Vincular ao membro
        const { error: linkError } = await supabase
          .from('member_companies')
          .insert({
            member_id: initialProfile.id,
            company_id: (newCompany as Company).id,
          } as never)

        if (linkError) throw linkError
        toast.success('Empresa cadastrada!')
      }

      setCompanyModalOpen(false)
      // Recarregar empresas
      const { data } = await supabase
        .from('member_companies')
        .select(`company_id, companies (id, name, description, phone, instagram, website)`)
        .eq('member_id', initialProfile.id)

      const memberCompanies = (data || [])
        .map((mc: { companies: Company | null }) => mc.companies)
        .filter((c): c is Company => c !== null)
      setCompanies(memberCompanies)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar empresa')
    } finally {
      setSavingCompany(false)
    }
  }

  const confirmDeleteCompany = (company: Company) => {
    setCompanyToDelete(company)
    setDeleteDialogOpen(true)
  }

  const deleteCompany = async () => {
    if (!companyToDelete) return

    setDeletingCompany(true)
    try {
      // Remover vínculo
      await supabase
        .from('member_companies')
        .delete()
        .eq('member_id', initialProfile.id)
        .eq('company_id', companyToDelete.id)

      // Verificar se outros membros usam essa empresa
      const { count } = await supabase
        .from('member_companies')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyToDelete.id)

      // Se ninguém mais usa, deletar a empresa
      if (count === 0) {
        await supabase
          .from('companies')
          .delete()
          .eq('id', companyToDelete.id)
      }

      toast.success('Empresa removida!')
      setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id))
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover empresa')
    } finally {
      setDeletingCompany(false)
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    }
  }

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

  // Função para alterar senha
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos de senha')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    setIsPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        toast.error(error.message || 'Erro ao alterar senha')
        return
      }

      toast.success('Senha alterada com sucesso!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsPasswordLoading(false)
    }
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

      {/* Minhas Cotas */}
      {quotas.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-amber-500" />
              Minhas Cotas
            </CardTitle>
            <CardDescription>Acompanhe seus investimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quotas.map((quota) => (
                <Card key={quota.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{quota.group?.name || 'Grupo'}</p>
                        <p className="text-sm text-muted-foreground">
                          Cota #{quota.quota_number}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quota.status === 'contemplated'
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}
                      >
                        {quota.status === 'contemplated' ? 'Contemplada' : 'Ativa'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mb-8">
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

      {/* Seção de Minhas Empresas */}
      <Card className="mt-8 border-green-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-green-500" />
              Minhas Empresas
            </CardTitle>
            <Button size="sm" onClick={() => openCompanyModal()}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Empresa
            </Button>
          </div>
          <CardDescription>Empresas vinculadas ao seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCompanies ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma empresa cadastrada</p>
              <p className="text-sm">Clique em &quot;Nova Empresa&quot; para adicionar</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {companies.map((company) => (
                <Card key={company.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{company.name}</h4>
                        {company.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {company.description}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          {company.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.instagram && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Instagram className="h-3 w-3" />
                              <span>@{company.instagram.replace('@', '')}</span>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span className="truncate">{company.website}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openCompanyModal(company)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDeleteCompany(company)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Alteração de Senha */}
      <Card className="mt-8 border-orange-500/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-orange-500" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite a nova senha"
                    className="pl-10 pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme a nova senha"
                    className="pl-10 pr-10"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                disabled={isPasswordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Empresa */}
      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa *</Label>
              <Input
                id="company-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">O que a empresa faz</Label>
              <Textarea
                id="company-description"
                value={companyForm.description}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva brevemente a atividade da empresa"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Telefone</Label>
                <Input
                  id="company-phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-instagram">Instagram</Label>
                <Input
                  id="company-instagram"
                  value={companyForm.instagram}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                  placeholder="@usuario"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Site</Label>
              <Input
                id="company-website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.exemplo.com.br"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCompany} disabled={savingCompany}>
              {savingCompany ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingCompany ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{companyToDelete?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingCompany}
            >
              {deletingCompany ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

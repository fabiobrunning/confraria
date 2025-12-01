'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
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
  ExternalLink,
  Plus,
  Trash2,
  Globe,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface Company {
  id: string
  name: string
  cnpj?: string | null
  phone?: string | null
  instagram?: string | null
  description?: string | null
  website?: string | null
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

export function MemberDetails({ member, isOwnProfile, canEdit }: MemberDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
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

  // Estados para gerenciamento de empresas
  const [companies, setCompanies] = useState<Company[]>(member.companies || [])
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
      toast({
        title: 'Erro',
        description: 'Nome da empresa e obrigatorio',
        variant: 'destructive',
      })
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

        // Atualiza estado local
        setCompanies(prev => prev.map(c =>
          c.id === editingCompany.id
            ? { ...c, ...companyForm }
            : c
        ))

        toast({ title: 'Empresa atualizada!' })
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
            member_id: member.id,
            company_id: (newCompany as Company).id,
          } as never)

        if (linkError) throw linkError

        // Adiciona ao estado local
        setCompanies(prev => [...prev, newCompany as Company])

        toast({ title: 'Empresa cadastrada!' })
      }

      setCompanyModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro ao salvar empresa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
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
        .eq('member_id', member.id)
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

      toast({ title: 'Empresa removida!' })
      setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id))
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro ao remover empresa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setDeletingCompany(false)
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    }
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
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresas Vinculadas
            </CardTitle>
            <CardDescription>Empresas onde o membro trabalha ou e proprietario</CardDescription>
          </div>
          {canEdit && (
            <Button onClick={() => openCompanyModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {companies.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {companies.map((company) => (
                <Card key={company.id} className="bg-muted/50 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-foreground">{company.name}</h4>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCompanyModal(company)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteCompany(company)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-muted-foreground hover:text-blue-500"
                        >
                          <Globe className="h-3 w-3" />
                          Site
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">Nenhuma empresa cadastrada</p>
              {canEdit && (
                <Button onClick={() => openCompanyModal()} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Empresa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Empresa */}
      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? 'Atualize as informacoes da empresa'
                : 'Cadastre uma nova empresa vinculada a este membro'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Ex: Empresa XYZ Ltda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_description">Descricao</Label>
              <Textarea
                id="company_description"
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Breve descricao da empresa..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefone</Label>
                <Input
                  id="company_phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_instagram">Instagram</Label>
                <Input
                  id="company_instagram"
                  value={companyForm.instagram}
                  onChange={(e) => setCompanyForm({ ...companyForm, instagram: e.target.value })}
                  placeholder="@empresa"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_website">Website</Label>
              <Input
                id="company_website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                placeholder="www.empresa.com.br"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyModalOpen(false)} disabled={savingCompany}>
              Cancelar
            </Button>
            <Button onClick={saveCompany} disabled={savingCompany}>
              {savingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCompany ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover Empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a empresa <strong>{companyToDelete?.name}</strong> deste membro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCompany}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCompany}
              disabled={deletingCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

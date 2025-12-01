'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users, Coins, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
  description: string | null
  asset_value: number
  total_quotas: number
  monthly_value: number
  is_active: boolean
  created_at: string
}

interface Quota {
  id: string
  group_id: string
  quota_number: number
  member_id: string | null
  status: 'active' | 'contemplated'
  created_at: string
  group?: { name: string }
  member?: { full_name: string }
}

interface Member {
  id: string
  full_name: string
}

export default function ConsortiumPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Groups state
  const [groups, setGroups] = useState<Group[]>([])
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    asset_value: '',
    total_quotas: '',
    monthly_value: '',
  })
  const [savingGroup, setSavingGroup] = useState(false)

  // Quotas state
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [quotaModalOpen, setQuotaModalOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null)
  const [quotaForm, setQuotaForm] = useState({
    group_id: '',
    quota_number: '',
    member_id: '',
    status: 'active' as 'active' | 'contemplated',
  })
  const [savingQuota, setSavingQuota] = useState(false)
  const [members, setMembers] = useState<Member[]>([])

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'group' | 'quota'; id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Check admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if ((profile as { role: string } | null)?.role !== 'admin') {
          toast.error('Acesso negado. Apenas administradores.')
          router.push('/members')
          return
        }

        setIsAdmin(true)
        loadData()
      } catch (error) {
        console.error('Erro:', error)
        router.push('/members')
      } finally {
        setIsLoading(false)
      }
    }
    checkAdmin()
  }, [supabase, router])

  const loadData = async () => {
    // Load groups
    const { data: groupsData } = await supabase
      .from('groups')
      .select('*')
      .order('name')

    if (groupsData) setGroups(groupsData as Group[])

    // Load quotas with related data
    const { data: quotasData } = await supabase
      .from('quotas')
      .select(`
        *,
        group:groups(name),
        member:profiles(full_name)
      `)
      .order('quota_number')

    if (quotasData) setQuotas(quotasData as unknown as Quota[])

    // Load members for dropdown
    const { data: membersData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')

    if (membersData) setMembers(membersData as Member[])
  }

  // Group functions
  const openGroupModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group)
      setGroupForm({
        name: group.name,
        description: group.description || '',
        asset_value: group.asset_value.toString(),
        total_quotas: group.total_quotas.toString(),
        monthly_value: group.monthly_value.toString(),
      })
    } else {
      setEditingGroup(null)
      setGroupForm({ name: '', description: '', asset_value: '', total_quotas: '', monthly_value: '' })
    }
    setGroupModalOpen(true)
  }

  const saveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Nome do grupo é obrigatório')
      return
    }

    setSavingGroup(true)
    try {
      const groupData = {
        name: groupForm.name,
        description: groupForm.description || null,
        asset_value: parseFloat(groupForm.asset_value) || 0,
        total_quotas: parseInt(groupForm.total_quotas) || 0,
        monthly_value: parseFloat(groupForm.monthly_value) || 0,
      }

      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update(groupData as never)
          .eq('id', editingGroup.id)

        if (error) throw error
        toast.success('Grupo atualizado!')
      } else {
        const { error } = await supabase
          .from('groups')
          .insert(groupData as never)

        if (error) throw error
        toast.success('Grupo criado!')
      }

      setGroupModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar grupo')
    } finally {
      setSavingGroup(false)
    }
  }

  // Quota functions
  const openQuotaModal = (quota?: Quota) => {
    if (quota) {
      setEditingQuota(quota)
      setQuotaForm({
        group_id: quota.group_id,
        quota_number: quota.quota_number.toString(),
        member_id: quota.member_id || '',
        status: quota.status,
      })
    } else {
      setEditingQuota(null)
      setQuotaForm({ group_id: '', quota_number: '', member_id: '', status: 'active' })
    }
    setQuotaModalOpen(true)
  }

  const saveQuota = async () => {
    if (!quotaForm.group_id || !quotaForm.quota_number) {
      toast.error('Grupo e número da cota são obrigatórios')
      return
    }

    setSavingQuota(true)
    try {
      const quotaData = {
        group_id: quotaForm.group_id,
        quota_number: parseInt(quotaForm.quota_number),
        member_id: quotaForm.member_id || null,
        status: quotaForm.status,
      }

      if (editingQuota) {
        const { error } = await supabase
          .from('quotas')
          .update(quotaData as never)
          .eq('id', editingQuota.id)

        if (error) throw error
        toast.success('Cota atualizada!')
      } else {
        const { error } = await supabase
          .from('quotas')
          .insert(quotaData as never)

        if (error) throw error
        toast.success('Cota criada!')
      }

      setQuotaModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar cota')
    } finally {
      setSavingQuota(false)
    }
  }

  // Delete functions
  const confirmDelete = (type: 'group' | 'quota', id: string, name: string) => {
    setItemToDelete({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from(itemToDelete.type === 'group' ? 'groups' : 'quotas')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      toast.success(`${itemToDelete.type === 'group' ? 'Grupo' : 'Cota'} excluído!`)
      loadData()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao excluir')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading || isAdmin === null) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Grupos e Cotas</h1>
        <p className="text-muted-foreground">Gerencie grupos de consórcio e cotas dos membros</p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            Grupos ({groups.length})
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-2">
            <Coins className="h-4 w-4" />
            Cotas ({quotas.length})
          </TabsTrigger>
        </TabsList>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openGroupModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant={group.is_active ? 'default' : 'secondary'}>
                      {group.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor do Bem:</span>
                      <p className="font-medium">{formatCurrency(group.asset_value)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mensalidade:</span>
                      <p className="font-medium">{formatCurrency(group.monthly_value)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total de Cotas:</span>
                      <p className="font-medium">{group.total_quotas}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGroupModal(group)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => confirmDelete('group', group.id, group.name)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {groups.length === 0 && (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-8 text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Nenhum grupo cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Quotas Tab */}
        <TabsContent value="quotas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openQuotaModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cota
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quotas.map((quota) => (
              <Card key={quota.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Cota #{quota.quota_number}</CardTitle>
                    <Badge variant={quota.status === 'active' ? 'default' : 'secondary'}>
                      {quota.status === 'active' ? 'Ativa' : 'Contemplada'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Grupo: {quota.group?.name || 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Membro:</span>
                    <p className="font-medium">
                      {quota.member?.full_name || <span className="text-muted-foreground">Não atribuída</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openQuotaModal(quota)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => confirmDelete('quota', quota.id, `Cota #${quota.quota_number}`)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {quotas.length === 0 && (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-8 text-center">
                  <Coins className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Nenhuma cota cadastrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Group Modal */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do grupo de consórcio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome *</Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Grupo A - Imóveis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição</Label>
              <Textarea
                id="group-description"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do grupo"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-value">Valor do Bem (R$)</Label>
                <Input
                  id="asset-value"
                  type="number"
                  step="0.01"
                  value={groupForm.asset_value}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, asset_value: e.target.value }))}
                  placeholder="100000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-value">Mensalidade (R$)</Label>
                <Input
                  id="monthly-value"
                  type="number"
                  step="0.01"
                  value={groupForm.monthly_value}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, monthly_value: e.target.value }))}
                  placeholder="1500.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-quotas">Total de Cotas</Label>
              <Input
                id="total-quotas"
                type="number"
                value={groupForm.total_quotas}
                onChange={(e) => setGroupForm(prev => ({ ...prev, total_quotas: e.target.value }))}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveGroup} disabled={savingGroup}>
              {savingGroup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingGroup ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota Modal */}
      <Dialog open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuota ? 'Editar Cota' : 'Nova Cota'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da cota
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Grupo *</Label>
              <Select
                value={quotaForm.group_id}
                onValueChange={(value) => setQuotaForm(prev => ({ ...prev, group_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota-number">Número da Cota *</Label>
              <Input
                id="quota-number"
                type="number"
                value={quotaForm.quota_number}
                onChange={(e) => setQuotaForm(prev => ({ ...prev, quota_number: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Membro (opcional)</Label>
              <Select
                value={quotaForm.member_id}
                onValueChange={(value) => setQuotaForm(prev => ({ ...prev, member_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={quotaForm.status}
                onValueChange={(value) => setQuotaForm(prev => ({ ...prev, status: value as 'active' | 'contemplated' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="contemplated">Contemplada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveQuota} disabled={savingQuota}>
              {savingQuota ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingQuota ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{itemToDelete?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

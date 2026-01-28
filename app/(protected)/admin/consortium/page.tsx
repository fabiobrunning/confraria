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
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

interface Quota {
  id: string
  name: string
  description: string | null
  value: number | null
  created_at: string
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
  const [groupForm, setGroupForm] = useState({ name: '', description: '', color: '#6366f1' })
  const [savingGroup, setSavingGroup] = useState(false)

  // Quotas state
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [quotaModalOpen, setQuotaModalOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null)
  const [quotaForm, setQuotaForm] = useState({ name: '', description: '', value: '' })
  const [savingQuota, setSavingQuota] = useState(false)

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

    // Load quotas
    const { data: quotasData } = await supabase
      .from('quotas')
      .select('*')
      .order('name')

    if (quotasData) setQuotas(quotasData as Quota[])
  }

  // Group functions
  const openGroupModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group)
      setGroupForm({ name: group.name, description: group.description || '', color: group.color })
    } else {
      setEditingGroup(null)
      setGroupForm({ name: '', description: '', color: '#6366f1' })
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
      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update({
            name: groupForm.name,
            description: groupForm.description || null,
            color: groupForm.color,
          } as never)
          .eq('id', editingGroup.id)

        if (error) throw error
        toast.success('Grupo atualizado!')
      } else {
        const { error } = await supabase
          .from('groups')
          .insert({
            name: groupForm.name,
            description: groupForm.description || null,
            color: groupForm.color,
          } as never)

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
        name: quota.name,
        description: quota.description || '',
        value: quota.value?.toString() || '',
      })
    } else {
      setEditingQuota(null)
      setQuotaForm({ name: '', description: '', value: '' })
    }
    setQuotaModalOpen(true)
  }

  const saveQuota = async () => {
    if (!quotaForm.name.trim()) {
      toast.error('Nome da cota é obrigatório')
      return
    }

    setSavingQuota(true)
    try {
      const quotaData = {
        name: quotaForm.name,
        description: quotaForm.description || null,
        value: quotaForm.value ? parseFloat(quotaForm.value) : null,
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
        <p className="text-muted-foreground">Gerencie grupos e cotas de consórcio</p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            Grupos
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-2">
            <Coins className="h-4 w-4" />
            Cotas
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
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
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
                  <CardTitle className="text-lg">{quota.name}</CardTitle>
                  {quota.description && (
                    <CardDescription>{quota.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {quota.value && (
                    <p className="text-lg font-semibold text-primary">
                      R$ {quota.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
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
                      onClick={() => confirmDelete('quota', quota.id, quota.name)}
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
              Preencha os dados do grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome *</Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Diretoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição</Label>
              <Textarea
                id="group-description"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do grupo"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-color">Cor</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="group-color"
                  type="color"
                  value={groupForm.color}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{groupForm.color}</span>
              </div>
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
              Preencha os dados da cota de investimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quota-name">Nome *</Label>
              <Input
                id="quota-name"
                value={quotaForm.name}
                onChange={(e) => setQuotaForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cota Premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota-description">Descrição</Label>
              <Textarea
                id="quota-description"
                value={quotaForm.description}
                onChange={(e) => setQuotaForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da cota"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota-value">Valor (R$)</Label>
              <Input
                id="quota-value"
                type="number"
                step="0.01"
                value={quotaForm.value}
                onChange={(e) => setQuotaForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="10000.00"
              />
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

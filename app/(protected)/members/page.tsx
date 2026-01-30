'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer, PageHeader, EmptyState } from '@/components/layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Edit, Trash2, Users, UserPlus, Phone, Instagram, MapPin, AlertTriangle } from 'lucide-react'
import { maskPhone } from '@/lib/utils/phone'
import type { Tables } from '@/lib/supabase/types'

type Profile = Tables<'profiles'>

export default function MembersPage() {
  const { isAdmin } = useAdmin()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Profile>>({})

  const { toast } = useToast()

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members')
      const data = await response.json()

      if (response.ok) {
        setMembers(data.profiles)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar membros',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (member: Profile) => {
    setSelectedMember(member)
    setEditFormData({
      full_name: member.full_name,
      phone: member.phone,
      role: member.role,
      instagram: member.instagram,
      address_street: member.address_street,
      address_number: member.address_number,
      address_complement: member.address_complement,
      address_neighborhood: member.address_neighborhood,
      address_city: member.address_city,
      address_state: member.address_state,
      address_cep: member.address_cep,
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Membro atualizado com sucesso!',
      })

      setEditDialogOpen(false)
      loadMembers()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (member: Profile) => {
    setSelectedMember(member)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedMember) return

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Membro excluído com sucesso!',
      })

      setDeleteDialogOpen(false)
      loadMembers()
    } catch (error) {
      toast({
        title: 'Erro ao excluir membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Membros"
        description="Gerencie os membros do sistema"
        action={
          isAdmin && (
            <Link href="/pre-register">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Membro
              </Button>
            </Link>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Membros
          </CardTitle>
          <CardDescription>{members.length} membro(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              message="Nenhum membro cadastrado"
              action={
                isAdmin && (
                  <Link href="/pre-register">
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar Primeiro Membro
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{member.full_name}</p>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                      {member.pre_registered && (
                        <Badge variant="warning">
                          Pré-Cadastro
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {member.phone}
                      </p>
                      {member.instagram && (
                        <p className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          {member.instagram}
                        </p>
                      )}
                      {member.address_city && member.address_state && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {member.address_city}, {member.address_state}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(member)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(member)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do membro
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Telefone *</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: maskPhone(e.target.value) })
                  }
                  required
                  maxLength={15}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_role">Tipo de Usuário *</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: 'admin' | 'member') =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger id="edit_role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_instagram">Instagram</Label>
                <Input
                  id="edit_instagram"
                  value={editFormData.instagram || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, instagram: e.target.value })
                  }
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Endereço</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit_street">Rua</Label>
                  <Input
                    id="edit_street"
                    value={editFormData.address_street || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_street: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_number">Número</Label>
                  <Input
                    id="edit_number"
                    value={editFormData.address_number || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_number: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_complement">Complemento</Label>
                  <Input
                    id="edit_complement"
                    value={editFormData.address_complement || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_complement: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_neighborhood">Bairro</Label>
                  <Input
                    id="edit_neighborhood"
                    value={editFormData.address_neighborhood || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_neighborhood: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit_city">Cidade</Label>
                  <Input
                    id="edit_city"
                    value={editFormData.address_city || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_state">Estado</Label>
                  <Input
                    id="edit_state"
                    value={editFormData.address_state || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_state: e.target.value })
                    }
                    maxLength={2}
                    placeholder="SC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_cep">CEP</Label>
                  <Input
                    id="edit_cep"
                    value={editFormData.address_cep || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address_cep: e.target.value })
                    }
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o membro{' '}
              <strong>{selectedMember?.full_name}</strong>? Esta ação não pode ser desfeita.
              {selectedMember?.pre_registered && (
                <span className="flex items-center gap-2 mt-2 text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4" />
                  Este é um pré-cadastro que ainda não foi completado.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}

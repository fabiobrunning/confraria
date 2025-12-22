'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Loader2, UserPlus, Trash2, Key, Copy, CheckCircle2, AlertTriangle, Phone, Lock } from 'lucide-react'
import { maskPhone } from '@/lib/utils/phone'
import type { Tables } from '@/lib/supabase/types'

type Profile = Tables<'profiles'>

export default function PreRegisterPage() {
  const { isAdmin, loading: adminLoading } = useAdmin(true, true)
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Profile | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'member' as 'admin' | 'member',
  })

  const { toast } = useToast()

  useEffect(() => {
    if (isAdmin) {
      loadMembers()
    }
  }, [isAdmin])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members')
      const data = await response.json()

      if (response.ok) {
        // Filter only pre-registered members
        setMembers(data.profiles.filter((p: Profile) => p.pre_registered))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Show password dialog
      setTempPassword(data.tempPassword)
      setNewMemberName(formData.full_name)
      setShowPasswordDialog(true)

      // Reset form
      setFormData({
        full_name: '',
        phone: '',
        role: 'member',
      })

      // Reload members list
      loadMembers()

      toast({
        title: 'Membro criado com sucesso!',
        description: 'Anote a senha temporária antes de fechar o diálogo',
      })
    } catch (error) {
      toast({
        title: 'Erro ao criar membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!memberToDelete) return

    try {
      const response = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Membro excluído com sucesso!',
      })

      loadMembers()
    } catch (error) {
      toast({
        title: 'Erro ao excluir membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setShowDeleteDialog(false)
      setMemberToDelete(null)
    }
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pré-Cadastro</h1>
        <p className="text-muted-foreground">Cadastre novos membros no sistema</p>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Membro
          </CardTitle>
          <CardDescription>
            Crie uma conta temporária para o novo membro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  placeholder="João da Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: maskPhone(e.target.value) })
                  }
                  required
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'member') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Pré-Cadastro
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pre-registered Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membros Pré-Cadastrados</CardTitle>
          <CardDescription>
            {members.length} membro(s) aguardando completar o cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum membro pré-cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.full_name}</p>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMemberToDelete(member)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Senha Temporária Gerada
            </DialogTitle>
            <DialogDescription>
              Anote ou copie a senha antes de fechar este diálogo. Ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Membro:</p>
              <p className="font-semibold text-lg">{newMemberName}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Senha Temporária:</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono font-bold text-3xl text-green-700 dark:text-green-400">
                  {tempPassword}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyPassword}
                  className={copiedPassword ? 'bg-green-100 dark:bg-green-900' : ''}
                >
                  {copiedPassword ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Esta senha deve ser informada ao membro
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone de login: {formData.phone}
              </p>
              <p className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                O membro deve alterar a senha no primeiro acesso
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pré-cadastro de{' '}
              <strong>{memberToDelete?.full_name}</strong>? Esta ação não pode ser desfeita.
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
    </div>
  )
}

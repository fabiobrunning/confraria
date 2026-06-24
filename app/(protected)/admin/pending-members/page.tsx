'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Search,
  Phone,
  Send,
  Copy,
  Check,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react'

interface PendingMember {
  id: string
  full_name: string
  phone: string
  created_at: string
  group_name: string | null
  has_pre_registration: boolean
  pre_reg_id: string | null
  pre_reg_expires: string | null
  pre_reg_send_count: number
  pre_reg_last_sent: string | null
}

interface CredentialsResult {
  credentials: { temporaryPassword: string; username: string }
  message: string
  whatsappLink?: string
}

export default function PendingMembersPage() {
  const { toast } = useToast()
  const [members, setMembers] = useState<PendingMember[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [credentialsModal, setCredentialsModal] = useState<{
    open: boolean
    result: CredentialsResult | null
    memberName: string
  }>({ open: false, result: null, memberName: '' })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pending-members?limit=100')
      if (!res.ok) throw new Error('Falha ao buscar membros')
      const data = await res.json()
      setMembers(data.data || [])
      setTotal(data.total || 0)
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar os membros', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filtered = members.filter((m) => {
    const q = searchTerm.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.group_name || '').toLowerCase().includes(q)
    )
  })

  const semGrupo = filtered.filter((m) => !m.group_name)
  const semPreReg = filtered.filter((m) => !m.has_pre_registration)

  async function handleSendCredentials(member: PendingMember) {
    setActionLoading(member.id)
    try {
      let result: any
      if (member.pre_reg_id) {
        // Já tem pré-cadastro — regenerar senha
        const res = await fetch(
          `/api/admin/pre-registrations/${member.pre_reg_id}/regenerate-password`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendMethod: 'whatsapp' }) }
        )
        result = await res.json()
      } else {
        // Sem pré-cadastro — criar novo
        const res = await fetch('/api/admin/pre-registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: member.id, send_method: 'whatsapp' }),
        })
        result = await res.json()
      }

      if (result?.credentials) {
        setCredentialsModal({
          open: true,
          result: {
            credentials: result.credentials,
            message: result.message || '',
            whatsappLink: result.whatsappLink,
          },
          memberName: member.full_name,
        })
        await fetchMembers()
      } else {
        toast({ title: 'Erro', description: result?.error || 'Falha ao gerar credenciais', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha na operação', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({ title: 'Copiado!' })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  return (
    <PageContainer>
      <PageHeader
        title="Membros Pendentes"
        description={`${total} membros aguardando primeiro acesso`}
      />

      {/* Alertas rápidos */}
      {(semPreReg.length > 0 || semGrupo.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {semPreReg.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-orange-300">
                <strong>{semPreReg.length}</strong> sem credenciais enviadas ainda
              </span>
            </div>
          )}
          {semGrupo.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 text-sm">
              <Users className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-yellow-300">
                <strong>{semGrupo.length}</strong> sem grupo associado
              </span>
            </div>
          )}
        </div>
      )}

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-medium text-muted-foreground">Nome</TableHead>
              <TableHead className="font-medium text-muted-foreground hidden md:table-cell">Telefone</TableHead>
              <TableHead className="font-medium text-muted-foreground">Grupo</TableHead>
              <TableHead className="font-medium text-muted-foreground">Credenciais</TableHead>
              <TableHead className="font-medium text-muted-foreground hidden lg:table-cell">Cadastrado em</TableHead>
              <TableHead className="font-medium text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={6}>
                    <div className="h-10 bg-muted/40 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum membro pendente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => (
                <TableRow
                  key={member.id}
                  className="border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{member.full_name}</span>
                      <span className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {member.phone}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      {member.phone}
                    </div>
                  </TableCell>

                  <TableCell>
                    {member.group_name ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span>{member.group_name}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
                        Sem grupo
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {member.has_pre_registration ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="text-xs w-fit text-blue-400 border-blue-400/30">
                          Enviado {member.pre_reg_send_count}x
                        </Badge>
                        {member.pre_reg_last_sent && (
                          <span className="text-xs text-muted-foreground">
                            Último: {formatDate(member.pre_reg_last_sent)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                        Não enviado
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(member.created_at)}
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === member.id}
                        >
                          {actionLoading === member.id ? (
                            <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <MoreHorizontal className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handleSendCredentials(member)}>
                          <Send className="w-4 h-4 mr-2" />
                          {member.has_pre_registration ? 'Regenerar e Enviar' : 'Gerar Credenciais'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(member.phone, member.id)}
                        >
                          {copiedField === member.id ? (
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copiar telefone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de credenciais */}
      {credentialsModal.open && credentialsModal.result && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-semibold">Credenciais Geradas</h2>
                <p className="text-sm text-muted-foreground">{credentialsModal.memberName}</p>
              </div>
              <button
                onClick={() => setCredentialsModal({ open: false, result: null, memberName: '' })}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Usuário (telefone)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={credentialsModal.result.credentials.username}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialsModal.result!.credentials.username, 'user')}
                  >
                    {copiedField === 'user' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Senha temporária (30 dias)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={credentialsModal.result.credentials.temporaryPassword}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-primary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialsModal.result!.credentials.temporaryPassword, 'pass')}
                  >
                    {copiedField === 'pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {credentialsModal.result.message && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Mensagem WhatsApp</label>
                <div className="bg-muted/30 rounded-lg p-3 max-h-36 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap font-mono text-foreground/80">
                    {credentialsModal.result.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {credentialsModal.result.whatsappLink && (
                <Button
                  onClick={() => window.open(credentialsModal.result!.whatsappLink, '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Abrir WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => copyToClipboard(credentialsModal.result!.message, 'msg')}
                className="w-full"
              >
                {copiedField === 'msg' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                Copiar Mensagem
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCredentialsModal({ open: false, result: null, memberName: '' })}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PreRegistrationModal } from '@/components/pre-registrations/PreRegistrationModal'
import { PreRegistrationsTable } from '@/components/pre-registrations/PreRegistrationsTable'
import { Input } from '@/components/ui/input'
import { Plus, Search, Copy, Check, Eye, EyeOff } from 'lucide-react'
import {
  usePreRegistrations,
  useCreatePreRegistration,
  useResendCredentials,
  useRegeneratePassword,
} from '@/hooks/usePreRegistrations'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  full_name: string
  phone: string
}

export default function PreRegistrationsPage() {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const { data: preRegsData, isLoading: loading } = usePreRegistrations({ page: currentPage })
  const createMutation = useCreatePreRegistration()
  const resendMutation = useResendCredentials()
  const regenerateMutation = useRegeneratePassword()

  const preRegistrations = preRegsData?.data ?? []
  const pagination = {
    page: preRegsData?.page ?? 1,
    limit: preRegsData?.limit ?? 20,
    total: preRegsData?.total ?? 0,
    totalPages: preRegsData?.totalPages ?? 0,
  }

  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPreReg, setSelectedPreReg] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [credentialsResult, setCredentialsResult] = useState<{
    credentials: { temporaryPassword: string; username: string }
    message: string
    whatsappLink?: string
  } | null>(null)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)

  // Busca membros disponíveis
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (response.ok) {
          const data = await response.json()
          setMembers(data.profiles || [])
        }
      } catch (error) {
        console.error('Erro ao buscar membros:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao buscar membros',
          variant: 'destructive',
        })
      } finally {
        setMembersLoading(false)
      }
    }

    fetchMembers()
  }, [toast])

  // Filtra resultados
  const filteredPreRegistrations = preRegistrations.filter((preReg) =>
    preReg.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    preReg.member_phone.includes(searchTerm)
  )

  const handleCreatePreRegistration = async (data: {
    member_id: string
    send_method: 'whatsapp' | 'sms'
    notes?: string
  }) => {
    try {
      const result = await createMutation.mutateAsync(data)
      setModalOpen(false)
      setCurrentPage(1)
      return result
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro' }
    }
  }

  const handleResendCredentials = async (preRegistrationId: string) => {
    try {
      const result = await resendMutation.mutateAsync({ preRegistrationId, sendMethod: 'whatsapp' })
      if (result?.credentials) {
        setCredentialsResult({
          credentials: result.credentials,
          message: result.message || '',
          whatsappLink: result.whatsappLink,
        })
        setCredentialsModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao reenviar:', error)
    }
  }

  const handleRegeneratePassword = async (preRegistrationId: string) => {
    try {
      const result = await regenerateMutation.mutateAsync({ preRegistrationId, sendMethod: 'whatsapp' })
      if (result?.credentials) {
        setCredentialsResult({
          credentials: result.credentials,
          message: result.message || '',
          whatsappLink: result.whatsappLink,
        })
        setCredentialsModalOpen(true)
      }
      setSelectedPreReg(null)
      setDetailsModalOpen(false)
      return result
    } catch (error) {
      console.error('Erro ao regenerar:', error)
    }
  }

  const handleViewDetails = async (preRegistrationId: string) => {
    try {
      const response = await fetch(`/api/admin/pre-registrations/${preRegistrationId}`)
      if (!response.ok) throw new Error('Falha ao buscar detalhes')
      const details = await response.json()
      setSelectedPreReg(details.data)
      setDetailsModalOpen(true)
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Pré-Cadastros de Membros"
        description="Gerencie e monitore os pré-cadastros de novos membros"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Pré-Cadastro
          </Button>
        }
      />

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Procure por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <PreRegistrationsTable
        preRegistrations={filteredPreRegistrations}
        onRowClick={(preReg) => handleViewDetails(preReg.id)}
        onResend={handleResendCredentials}
        onRegenerate={handleRegeneratePassword}
        onViewDetails={handleViewDetails}
        loading={loading}
      />

      {/* Paginação */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de criação */}
      <PreRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreatePreRegistration}
        members={members}
        loading={membersLoading}
        mode="create"
      />

      {/* Modal de detalhes */}
      {selectedPreReg && (
        <PreRegistrationDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          data={selectedPreReg}
          onRegenerate={() => handleRegeneratePassword(selectedPreReg.id)}
        />
      )}

      {/* Modal de credenciais (resultado de regenerar/reenviar) */}
      <CredentialsResultModal
        open={credentialsModalOpen}
        onOpenChange={(open) => {
          setCredentialsModalOpen(open)
          if (!open) setCredentialsResult(null)
        }}
        result={credentialsResult}
      />
    </PageContainer>
  )
}

/**
 * Modal de detalhes do pré-cadastro
 */
function PreRegistrationDetailsModal({
  open: _open,
  onOpenChange,
  data,
  onRegenerate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  onRegenerate: () => void
}) {

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-xl w-full p-6 space-y-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Detalhes do Pré-Cadastro</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Membro */}
          <div>
            <h3 className="font-semibold mb-2">Membro</h3>
            <p className="text-sm text-muted-foreground">{data.member?.full_name}</p>
            <p className="text-sm text-muted-foreground">{data.member?.phone}</p>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold mb-2">Status de Acesso</h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Primeiro acesso: </span>
                {data.accessStatus?.firstAccessedAt ? formatDate(data.accessStatus.firstAccessedAt) : 'Nunca'}
              </p>
              <p>
                <span className="text-muted-foreground">IP do acesso: </span>
                {data.accessStatus?.firstAccessFromIp || '-'}
              </p>
              <p>
                <span className="text-muted-foreground">Tentativas falhadas: </span>
                {data.accessStatus?.accessAttempts}/{data.accessStatus?.maxAccessAttempts}
              </p>
            </div>
          </div>

          {/* Envios */}
          <div>
            <h3 className="font-semibold mb-2">Histórico de Envios</h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Total de envios: </span>
                {data.sendHistory?.sendCount}
              </p>
              <p>
                <span className="text-muted-foreground">Último envio: </span>
                {data.sendHistory?.lastSentAt ? formatDate(data.sendHistory.lastSentAt) : '-'}
              </p>
            </div>
          </div>

          {/* Expiração */}
          <div>
            <h3 className="font-semibold mb-2">Expiração</h3>
            <p className="text-sm">
              <span className="text-muted-foreground">Data de expiração: </span>
              {data.credentials?.expirationDate ? formatDate(data.credentials.expirationDate) : '-'}
            </p>
            {data.credentials?.isExpired && (
              <p className="text-xs text-red-600 mt-1">Pré-registro expirado!</p>
            )}
          </div>

          {/* Admin */}
          <div>
            <h3 className="font-semibold mb-2">Criado por</h3>
            <p className="text-sm text-muted-foreground">{data.createdByAdmin?.full_name}</p>
          </div>

          {/* Notas */}
          {data.metadata?.notes && (
            <div>
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{data.metadata.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Fechar
          </Button>
          <Button
            onClick={() => {
              onRegenerate()
              onOpenChange(false)
            }}
            className="flex-1"
          >
            Regenerar Senha
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal para exibir credenciais após regenerar/reenviar senha
 */
function CredentialsResultModal({
  open,
  onOpenChange,
  result,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: {
    credentials: { temporaryPassword: string; username: string }
    message: string
    whatsappLink?: string
  } | null
}) {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setShowPassword(false)
      setCopiedField(null)
    }
  }, [open])

  if (!result) return null

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({ title: 'Copiado!' })
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${open ? '' : 'hidden'}`}>
      <div className="bg-card border border-border rounded-lg max-w-xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Credenciais Geradas</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 bg-muted/50 rounded-lg p-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Usuário</label>
            <div className="flex gap-2">
              <input
                value={result.credentials.username}
                readOnly
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.credentials.username, 'username')}
              >
                {copiedField === 'username' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Senha Temporária</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={result.credentials.temporaryPassword}
                readOnly
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
              />
              <Button variant="outline" size="sm" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.credentials.temporaryPassword, 'password')}
              >
                {copiedField === 'password' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Válido por 30 dias.</p>
          </div>
        </div>

        {/* Mensagem */}
        {result.message && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mensagem para Enviar</label>
            <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap font-mono">{result.message}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          {result.whatsappLink && (
            <Button
              onClick={() => window.open(result.whatsappLink, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Abrir WhatsApp
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => copyToClipboard(result.message, 'message')}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Mensagem
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

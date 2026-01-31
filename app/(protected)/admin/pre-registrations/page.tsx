'use client'

import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PreRegistrationModal } from '@/components/pre-registrations/PreRegistrationModal'
import { PreRegistrationsTable } from '@/components/pre-registrations/PreRegistrationsTable'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { usePreRegistrations } from '@/hooks/usePreRegistrations'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  full_name: string
  phone: string
}

export default function PreRegistrationsPage() {
  const { toast } = useToast()
  const {
    preRegistrations,
    loading,
    pagination,
    fetchPreRegistrations,
    createPreRegistration,
    resendCredentials,
    regeneratePassword,
    getPreRegistrationDetails,
  } = usePreRegistrations()

  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPreReg, setSelectedPreReg] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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

  // Busca pré-registros ao montar e quando página muda
  useEffect(() => {
    fetchPreRegistrations(currentPage, 20)
  }, [currentPage, fetchPreRegistrations])

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
      const result = await createPreRegistration(data)
      setModalOpen(false)
      await fetchPreRegistrations(1, 20) // Volta para primeira página
      return result
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro' }
    }
  }

  const handleResendCredentials = async (preRegistrationId: string) => {
    try {
      await resendCredentials(preRegistrationId, 'whatsapp')
      toast({
        title: 'Sucesso!',
        description: 'Credenciais reenviadas com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao reenviar:', error)
    }
  }

  const handleRegeneratePassword = async (preRegistrationId: string) => {
    try {
      const result = await regeneratePassword(preRegistrationId, 'whatsapp')
      setSelectedPreReg(null)
      return result
    } catch (error) {
      console.error('Erro ao regenerar:', error)
    }
  }

  const handleViewDetails = async (preRegistrationId: string) => {
    try {
      const details = await getPreRegistrationDetails(preRegistrationId)
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

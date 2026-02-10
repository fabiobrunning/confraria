'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useProspects, useUpdateProspect } from '@/hooks/use-prospects'
import { useAdmin } from '@/hooks/use-admin'
import { ProspectsTable } from './components/ProspectsTable'
import { ProspectModal } from './components/ProspectModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Prospect, ProspectStatus } from '@/lib/supabase/types'
import { Download, Search, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PageContainer, PageHeader } from '@/components/layout'

const statusOptions: { value: ProspectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'new', label: 'Novos' },
  { value: 'contacted', label: 'Contatados' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'rejected', label: 'Rejeitados' },
]

export default function ProspectsPage() {
  const { toast } = useToast()
  const { isAdmin, loading: adminLoading } = useAdmin(true, true)

  const [status, setStatus] = useState<ProspectStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: prospectsData, isLoading: loading, error: queryError } = useProspects({ status, search, page })
  const updateProspectMutation = useUpdateProspect()

  const prospects = prospectsData?.data ?? []
  const pagination = prospectsData?.pagination ?? null
  const error = queryError?.message ?? null

  const updateProspect = async (id: string, data: { status?: ProspectStatus; notes?: string }) => {
    try {
      const result = await updateProspectMutation.mutateAsync({ id, data })
      return result.data
    } catch {
      return null
    }
  }

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleRowClick = useCallback((prospect: Prospect) => {
    setSelectedProspect(prospect)
    setModalOpen(true)
  }, [])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }, [searchInput, setSearch])

  const handleExportCSV = useCallback(async () => {
    setExporting(true)
    try {
      // Buscar todos os prospects (sem paginacao) para exportar
      const params = new URLSearchParams({ limit: '1000' })
      if (status && status !== 'all') params.set('status', status)
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/prospects?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao exportar')
      }

      const prospectsData = data.data as Prospect[]

      // Criar CSV
      const headers = [
        'Nome',
        'E-mail',
        'Telefone',
        'Empresa',
        'Setor',
        'Como Conheceu',
        'Experiencia Networking',
        'Status',
        'Data Cadastro',
        'Observacoes'
      ]

      const howFoundUsLabels: Record<string, string> = {
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        referral: 'Indicacao',
        google: 'Google',
        event: 'Evento',
        other: 'Outro',
      }

      const statusLabels: Record<string, string> = {
        new: 'Novo',
        contacted: 'Contatado',
        in_progress: 'Em Andamento',
        converted: 'Convertido',
        rejected: 'Rejeitado',
      }

      const rows = prospectsData.map(p => [
        p.full_name,
        p.email,
        p.phone,
        p.company_name,
        p.business_sector,
        howFoundUsLabels[p.how_found_us] || p.how_found_us,
        p.has_networking_experience ? 'Sim' : 'Nao',
        statusLabels[p.status] || p.status,
        new Date(p.created_at).toLocaleDateString('pt-BR'),
        (p.notes || '').replace(/"/g, '""')
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n')

      // Adicionar BOM para UTF-8
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `prospects_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportado!',
        description: `${prospectsData.length} prospects exportados com sucesso`,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao exportar CSV',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }, [status, search, toast])

  // Loading state para verificacao de admin
  if (adminLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Nao autorizado
  if (!isAdmin) {
    return null // O hook useAdmin ja redireciona
  }

  return (
    <PageContainer>
      <PageHeader
        title="Interessados"
        description="Gerencie os prospects que demonstraram interesse na Confraria"
        icon={Users}
        action={
          <Button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            variant="outline"
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar CSV
          </Button>
        }
      />

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, empresa ou e-mail..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </form>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ProspectStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tabela */}
      <ProspectsTable
        prospects={prospects}
        onRowClick={handleRowClick}
        loading={loading}
      />

      {/* Paginacao */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Pagina {page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Proximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <ProspectModal
        prospect={selectedProspect}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={updateProspect}
      />
    </PageContainer>
  )
}

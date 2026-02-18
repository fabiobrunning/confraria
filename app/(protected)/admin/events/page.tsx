'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Calendar, Plus, Search, Eye, Pencil, XCircle, Loader2 } from 'lucide-react'
import { useEvents, useCancelEvent } from '@/hooks/useEvents'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

export default function EventsListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)

  const { data, isLoading } = useEvents({
    page,
    status: statusFilter || undefined,
  })
  const cancelMutation = useCancelEvent()

  const events = data?.events || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const filtered = search
    ? events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : events

  const handleCancel = async () => {
    if (!cancelId) return
    try {
      await cancelMutation.mutateAsync(cancelId)
      toast({ title: 'Evento cancelado' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
    setCancelId(null)
  }

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

  return (
    <PageContainer>
      <PageHeader
        title="Eventos"
        description="Gerencie os eventos da Confraria"
        icon={Calendar}
        action={
          <Link href="/admin/events/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Evento</Button>
          </Link>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum evento encontrado
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>{new Date(event.deadline).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'active' ? 'default' : 'destructive'}>
                        {event.status === 'active' ? 'Ativo' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.total_confirmed}/{event.confirmation_limit}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                        disabled={event.status === 'cancelled'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelId(event.id)}
                        disabled={event.status === 'cancelled'}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                Anterior
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} de {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será marcado como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancelar evento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}

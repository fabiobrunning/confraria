'use client'

import { use } from 'react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, Pencil, Users, Clock, Loader2, RefreshCw } from 'lucide-react'
import { useEvent, useEventConfirmations } from '@/hooks/useEvents'
import { EventActions } from '../components/EventActions'

export const dynamic = 'force-dynamic'

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: event, isLoading: eventLoading } = useEvent(id)
  const { data: confirmationsData, isLoading: confLoading, refetch: refetchConf } = useEventConfirmations(id)

  const confirmations = confirmationsData?.confirmations || []
  const totalConfirmed = confirmations.reduce((sum, c) => sum + c.confirmed_count, 0)

  if (eventLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  if (!event) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-muted-foreground">Evento não encontrado</div>
      </PageContainer>
    )
  }

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <PageContainer>
      <PageHeader
        title={event.name}
        description={event.description}
        icon={Calendar}
        action={
          event.status === 'active' ? (
            <Link href={`/admin/events/${id}/edit`}>
              <Button variant="outline"><Pencil className="h-4 w-4 mr-2" /> Editar</Button>
            </Link>
          ) : null
        }
      />

      {/* Event Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Data e Hora</p>
              <p className="font-medium">{formatDate(event.date)} às {event.time?.slice(0, 5)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Confirmações</p>
              <p className="font-medium text-lg">{totalConfirmed} / {event.confirmation_limit}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={event.status === 'active' ? 'default' : 'destructive'}>
                {event.status === 'active' ? 'Ativo' : 'Cancelado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <EventActions eventId={id} eventName={event.name} eventDate={event.date} />

      {/* Confirmations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Confirmações</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetchConf()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {confLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : confirmations.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">Nenhuma confirmação ainda</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data Confirmação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.user_phone}</TableCell>
                      <TableCell>{c.confirmed_count}</TableCell>
                      <TableCell>
                        {new Date(c.confirmed_at).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}

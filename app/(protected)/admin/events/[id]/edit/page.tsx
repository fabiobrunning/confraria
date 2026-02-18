'use client'

import { use } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Calendar, Loader2 } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { EventForm } from '../../components/EventForm'

export const dynamic = 'force-dynamic'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: event, isLoading } = useEvent(id)

  if (isLoading) {
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

  return (
    <PageContainer>
      <PageHeader
        title="Editar Evento"
        description={event.name}
        icon={Calendar}
      />
      <EventForm event={event} />
    </PageContainer>
  )
}

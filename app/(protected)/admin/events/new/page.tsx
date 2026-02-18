'use client'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Calendar } from 'lucide-react'
import { EventForm } from '../components/EventForm'

export const dynamic = 'force-dynamic'

export default function NewEventPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Novo Evento"
        description="Crie um novo evento para a Confraria"
        icon={Calendar}
      />
      <EventForm />
    </PageContainer>
  )
}

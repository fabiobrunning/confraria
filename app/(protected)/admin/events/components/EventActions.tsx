'use client'

import { Button } from '@/components/ui/button'
import { Copy, Share2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EventActionsProps {
  eventId: string
  eventName: string
  eventDate: string
}

export function EventActions({ eventId, eventName, eventDate }: EventActionsProps) {
  const { toast } = useToast()

  const rsvpUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/rsvp/${eventId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(rsvpUrl)
      toast({ title: 'Link copiado!' })
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' })
    }
  }

  const handleShareWhatsApp = () => {
    const message = `Evento: ${eventName}\nConfirme presença aqui: ${rsvpUrl}\nData: ${new Date(eventDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleExportCSV = () => {
    window.open(`/api/events/${eventId}/export`, '_blank')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Copy className="h-4 w-4 mr-2" /> Copiar link RSVP
      </Button>
      <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
        <Share2 className="h-4 w-4 mr-2" /> Compartilhar WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="h-4 w-4 mr-2" /> Exportar CSV
      </Button>
    </div>
  )
}

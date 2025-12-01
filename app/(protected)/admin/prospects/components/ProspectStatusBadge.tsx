'use client'

import { Badge } from '@/components/ui/badge'
import type { ProspectStatus } from '@/lib/supabase/types'

interface ProspectStatusBadgeProps {
  status: ProspectStatus
  className?: string
}

const statusConfig: Record<ProspectStatus, { label: string; className: string; icon: string }> = {
  new: {
    label: 'Novo',
    className: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    icon: ''
  },
  contacted: {
    label: 'Contatado',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    icon: ''
  },
  in_progress: {
    label: 'Em Andamento',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
    icon: ''
  },
  converted: {
    label: 'Convertido',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
    icon: ''
  },
  rejected: {
    label: 'Rejeitado',
    className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    icon: ''
  },
}

export function ProspectStatusBadge({ status, className = '' }: ProspectStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className}`}
    >
      {config.icon} {config.label}
    </Badge>
  )
}

export function getStatusLabel(status: ProspectStatus): string {
  return statusConfig[status]?.label || status
}

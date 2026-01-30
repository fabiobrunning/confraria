'use client'

import { Badge } from '@/components/ui/badge'
import type { ProspectStatus } from '@/lib/supabase/types'

interface ProspectStatusBadgeProps {
  status: ProspectStatus
  className?: string
}

const statusConfig: Record<ProspectStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }> = {
  new: {
    label: 'Novo',
    variant: 'success'
  },
  contacted: {
    label: 'Contatado',
    variant: 'warning'
  },
  in_progress: {
    label: 'Em Andamento',
    variant: 'default'
  },
  converted: {
    label: 'Convertido',
    variant: 'success'
  },
  rejected: {
    label: 'Rejeitado',
    variant: 'destructive'
  },
}

export function ProspectStatusBadge({ status, className = '' }: ProspectStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new

  return (
    <Badge
      variant={config.variant}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

export function getStatusLabel(status: ProspectStatus): string {
  return statusConfig[status]?.label || status
}

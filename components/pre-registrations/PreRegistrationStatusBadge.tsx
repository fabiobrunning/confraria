'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'

type PreRegistrationStatus = 'pending' | 'accessed' | 'expired' | 'locked'

interface PreRegistrationStatusBadgeProps {
  status: PreRegistrationStatus
  className?: string
}

const statusConfig: Record<PreRegistrationStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ReactNode
  description: string
}> = {
  pending: {
    label: 'Pendente',
    variant: 'secondary',
    icon: <Clock className="w-3 h-3" />,
    description: 'Aguardando primeiro acesso'
  },
  accessed: {
    label: 'Acessado',
    variant: 'default',
    icon: <CheckCircle2 className="w-3 h-3" />,
    description: 'Primeiro acesso realizado'
  },
  expired: {
    label: 'Expirado',
    variant: 'destructive',
    icon: <AlertCircle className="w-3 h-3" />,
    description: 'Pré-registro expirou'
  },
  locked: {
    label: 'Bloqueado',
    variant: 'destructive',
    icon: <Zap className="w-3 h-3" />,
    description: 'Bloqueado por muitas tentativas'
  }
}

export function PreRegistrationStatusBadge({
  status,
  className = ''
}: PreRegistrationStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
        {config.icon}
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {config.description}
      </span>
    </div>
  )
}

/**
 * Determina o status atual baseado nos dados do pré-registro
 */
export function getPreRegistrationStatus(data: {
  first_accessed_at: string | null
  locked_until: string | null
  expiration_date: string
}): PreRegistrationStatus {
  // Verifica se está bloqueado
  if (data.locked_until && new Date(data.locked_until) > new Date()) {
    return 'locked'
  }

  // Verifica se expirou
  if (new Date(data.expiration_date) < new Date()) {
    return 'expired'
  }

  // Verifica se já acessou
  if (data.first_accessed_at) {
    return 'accessed'
  }

  // Default: pendente
  return 'pending'
}

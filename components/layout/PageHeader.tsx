import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

/**
 * PageHeader - Atomic Design System Component
 *
 * Cabeçalho padrão para todas as páginas da aplicação.
 * Suporta título, descrição, ícone opcional e ação (botão) opcional.
 *
 * @example
 * // Sem ícone, com botão
 * <PageHeader
 *   title="Membros"
 *   description="Gerencie os membros do sistema"
 *   action={<Button>Novo Membro</Button>}
 * />
 *
 * @example
 * // Com ícone, sem botão
 * <PageHeader
 *   title="Dashboard"
 *   description="Visão geral do sistema"
 *   icon={LayoutDashboard}
 * />
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        {description && (
          <p className="font-brand text-label uppercase tracking-[0.2em] text-muted-foreground text-xs mb-1 flex items-center gap-2">
            {Icon && <Icon className="h-3 w-3" />}
            {description}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  )
}

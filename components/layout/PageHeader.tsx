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
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

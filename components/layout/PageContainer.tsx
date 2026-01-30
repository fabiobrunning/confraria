import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * PageContainer - Atomic Design System Component
 *
 * Padrão de container para todas as páginas da aplicação.
 * Garante padding e spacing consistentes em mobile e desktop.
 *
 * @example
 * <PageContainer>
 *   <PageHeader title="Membros" description="Gerencie membros" />
 *   <Card>...</Card>
 * </PageContainer>
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('p-4 sm:p-6 space-y-6', className)}>
      {children}
    </div>
  )
}

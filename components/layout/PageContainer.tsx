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
 * Garante padding, spacing e centralização consistentes em mobile e desktop.
 * Conteúdo centralizado com max-width de 6xl para melhor legibilidade.
 *
 * @example
 * <PageContainer>
 *   <PageHeader title="Membros" description="Gerencie membros" />
 *   <Card>...</Card>
 * </PageContainer>
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('w-full p-4 sm:p-6 space-y-6 max-w-6xl mx-auto', className)}>
      {children}
    </div>
  )
}

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message: string
  action?: ReactNode
  className?: string
}

/**
 * EmptyState - Atomic Design System Component
 *
 * Estado vazio padrão para listas/tabelas sem dados.
 * Garante consistência visual em todas as páginas.
 *
 * @example
 * <EmptyState
 *   message="Nenhum membro cadastrado"
 *   action={<Button>Cadastrar Primeiro Membro</Button>}
 * />
 */
export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="py-10 text-center">
        <p className="text-muted-foreground mb-4">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}

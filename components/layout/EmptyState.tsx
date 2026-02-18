import { ReactNode } from 'react'
import { LucideIcon, Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({
  message,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="py-12 text-center flex flex-col items-center gap-3">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">{message}</p>
        {description && (
          <p className="text-sm text-muted-foreground/70 max-w-md">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}

import { cn } from '@/lib/utils'

interface GlassCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  className?: string
}

export function GlassCard({ label, value, sub, accent = false, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-glass border rounded-xl p-6 space-y-1',
        accent
          ? 'border-primary/20 bg-primary/[0.04]'
          : 'border-white/8',
        className
      )}
    >
      <p className="font-brand text-label uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl uppercase text-foreground">
        {value}
      </p>
      {sub && (
        <p className="font-brand text-xs text-white/40">
          {sub}
        </p>
      )}
    </div>
  )
}

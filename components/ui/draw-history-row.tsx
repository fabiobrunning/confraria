import { cn } from '@/lib/utils'

interface DrawHistoryRowProps {
  referenceMonth: string
  winningNumber: number
  winnerName: string
  contemplationType?: 'normal' | 'transfer'
  className?: string
}

export function DrawHistoryRow({
  referenceMonth,
  winningNumber,
  winnerName,
  contemplationType,
  className,
}: DrawHistoryRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-4 border-b border-white/8 last:border-0',
        'hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded',
        className
      )}
    >
      <span className="font-brand text-sm text-muted-foreground w-24">
        {referenceMonth}
      </span>
      <span className="font-display text-lg uppercase text-white/80 w-20 text-center">
        #{winningNumber}
      </span>
      <span className="font-brand text-sm text-white/70 flex-1 text-center">
        {winnerName}
      </span>
      {contemplationType === 'transfer' && (
        <span className="font-brand text-label text-primary/60 uppercase tracking-wide">
          transferido
        </span>
      )}
    </div>
  )
}

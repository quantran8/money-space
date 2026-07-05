import { cn } from '@/lib/utils'

type ProgressProps = {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div
      className={cn('h-2.5 overflow-hidden rounded-full bg-[hsl(var(--secondary))]', className)}
    >
      <div
        className="h-full rounded-full bg-[hsl(var(--accent))] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

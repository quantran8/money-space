import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Status chip (v5 02-components §9): a 6px dot plus text.
 *
 * A colored PILL is only for a state that genuinely needs attention or action —
 * never a green pill for "normal", "synced" or "active". The dot NEVER carries
 * the meaning by itself: the text always states the status too, so the chip
 * survives colour-blindness and greyscale (§11).
 */
export type ChipTone = 'neutral' | 'accent' | 'attention' | 'alert'

const DOT: Record<ChipTone, string> = {
  neutral: 'var(--ink3)',
  accent: 'var(--positive)',
  attention: 'var(--attention)',
  alert: 'var(--alert)',
}

const TEXT: Record<ChipTone, string> = {
  neutral: 'text-ink2',
  accent: 'text-ink2',
  attention: 'font-medium text-attention-ink',
  alert: 'font-medium text-alert-ink',
}

export function StatusChip({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: ChipTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('flex items-center gap-2 t-body-sm', TEXT[tone], className)}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: DOT[tone] }}
      />
      {children}
    </p>
  )
}

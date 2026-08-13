import { cn } from '@/shared/lib/utils'

/**
 * Status chip (§11.6): a 6px dot plus text. Never a filled pill, never an icon.
 *
 * The dot NEVER carries the meaning by itself — the text always states the
 * status too, so the chip survives colour-blindness and greyscale (§24).
 */
export type ChipTone = 'neutral' | 'accent' | 'attention' | 'alert'

const DOT: Record<ChipTone, string> = {
  neutral: 'var(--ink3)',
  accent: 'var(--accent)',
  attention: 'var(--attention)',
  alert: 'var(--alert)',
}

const TEXT: Record<ChipTone, string> = {
  neutral: 'text-ink2',
  accent: 'text-ink',
  attention: 'font-medium text-attention',
  alert: 'font-medium text-alert',
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
    <p className={cn('flex items-center gap-2 text-[13px]', TEXT[tone], className)}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: DOT[tone] }}
      />
      {children}
    </p>
  )
}

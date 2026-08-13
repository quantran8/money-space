import { cn } from '@/shared/lib/utils'

/**
 * Money composition bar + legend (§11.4).
 *
 * The three parts are distinguished by WEIGHT, not by hue (§5.4): committed is
 * the palest, protected sits in the middle as a NEUTRAL (amber is reserved
 * entirely for `attention`), and flexible carries the accent because it is the
 * part the household reads first.
 *
 * Not a pie chart — the same data as a pie loses the ordering that makes
 * "committed → protected → flexible" legible as a sequence.
 */
export type CompositionSegment = {
  key: string
  label: string
  amount: number
  /** 0–100, already rounded by the caller. */
  percent: number
  tone: 'committed' | 'protect' | 'flexible'
}

const FILL: Record<CompositionSegment['tone'], string> = {
  committed: 'var(--committed)',
  protect: 'var(--protect)',
  flexible: 'var(--accent)',
}

export function MoneyCompositionBar({
  segments,
  ariaLabel,
  formatAmount,
  className,
}: {
  segments: CompositionSegment[]
  /** Must read out all three values as words (§24). */
  ariaLabel: string
  formatAmount: (value: number) => string
  className?: string
}) {
  // Flex weights must be non-negative, and a segment that rounds to nothing
  // still needs to be visible — flexible money is closest to zero exactly when
  // seeing it matters most (§11.4).
  const weights = segments.map((segment) => Math.max(segment.amount, 0))
  const total = weights.reduce((sum, weight) => sum + weight, 0)

  return (
    <div className={className}>
      <div className="flex h-2.5 gap-1" role="img" aria-label={ariaLabel}>
        {segments.map((segment, index) => (
          <div
            key={segment.key}
            className={cn(
              'seg min-w-[3px]',
              index === 0 && 'rounded-l-full',
              index === segments.length - 1 && 'rounded-r-full',
            )}
            style={{
              // Fall back to equal weights when everything is zero, so the bar
              // never collapses into nothing.
              flex: total > 0 ? weights[index] : 1,
              background: FILL[segment.tone],
              animationDelay: `${index * 0.07}s`,
            }}
          />
        ))}
      </div>

      <dl className="mt-7 space-y-5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-baseline gap-3.5">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: FILL[segment.tone] }}
            />
            <dt
              className={cn(
                'flex-1 text-[14px]',
                segment.tone === 'flexible' ? 'text-ink' : 'text-ink2',
              )}
            >
              {segment.label}
            </dt>
            <span className="num w-10 text-right font-mono text-[11px] text-ink3">
              {segment.percent}%
            </span>
            <dd
              className={cn(
                'num w-24 text-right text-[15px]',
                segment.tone === 'flexible' && 'font-medium text-accent',
              )}
            >
              {formatAmount(segment.amount)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

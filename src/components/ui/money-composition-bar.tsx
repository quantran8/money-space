import { cn } from '@/shared/lib/utils'

/**
 * Money composition bar + legend (§11.4).
 *
 * The parts are distinguished by WEIGHT, not by hue (§5.4): committed is the
 * palest, and flexible carries the accent because it is the part the household
 * reads first. Amber stays reserved entirely for `attention`.
 *
 * Not a pie chart — the same data as a pie loses the ordering that makes
 * "committed → flexible" legible as a sequence.
 */
export type CompositionSegment = {
  key: string
  label: string
  amount: number
  /** 0–100, already rounded by the caller. Used for the spoken label. */
  percent: number
  /** How the share is WRITTEN, e.g. "<1%" — rounding must not read as none or all. */
  percentLabel?: string
  tone: 'committed' | 'flexible'
}

const FILL: Record<CompositionSegment['tone'], string> = {
  committed: 'var(--committed)',
  flexible: 'var(--accent)',
}

export function MoneyCompositionBar({
  segments,
  ariaLabel,
  formatAmount,
  className,
}: {
  segments: CompositionSegment[]
  /** Must read out every value as words (§24). */
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

      {/* A grid, not a flex row: the percent and the amount columns must line up
          down the legend, and the label column absorbs the slack. */}
      <dl className="mt-5 space-y-4">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-[13px]"
          >
            <dt
              className={cn(
                'flex items-center gap-2',
                segment.tone === 'flexible' ? 'font-medium text-ink' : 'text-ink2',
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: FILL[segment.tone] }}
              />
              {segment.label}
            </dt>
            <span className="num font-mono text-[11px] text-ink3">
              {segment.percentLabel ?? `${segment.percent}%`}
            </span>
            <dd
              className={cn(
                'num min-w-[76px] text-right',
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

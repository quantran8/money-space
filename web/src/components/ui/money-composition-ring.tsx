import { Pie, PieChart, ResponsiveContainer } from 'recharts'

import { cn } from '@money-space/core/shared/lib/utils'

import type { CompositionSegment } from '@money-space/core/shared/presentation.types'

/**
 * Money composition ring + legend (v5 02-components §15).
 *
 * Replaces the horizontal segmented strip. A strip spent full section width to
 * say one ratio; the ring says the same thing in a fixed square and gives the
 * headline share a centre to sit in, so the number the block exists to deliver
 * is read before the legend rather than after it.
 *
 * Committed is the neutral grey; flexible carries `--data-primary`, NOT the
 * action colour — composition is data, and v5 §4 keeps the action colour out of
 * data state entirely. Amber stays reserved for `attention`.
 *
 * The legend may repeat the values because it serves the visualisation — that
 * is the one exception to "một dữ kiện, một chỗ" (03-patterns §9).
 *
 * Not a pie: the hole is what keeps this a ratio gauge rather than a slice
 * chart, and it is where the flexible share is stated in words and figures.
 */
export type { CompositionSegment } from '@money-space/core/shared/presentation.types'

const FILL: Record<CompositionSegment['tone'], string> = {
  committed: 'var(--committed)',
  flexible: 'var(--data-primary)',
}

/**
 * The smallest share that still draws as a visible arc (~1.4°).
 *
 * With `paddingAngle` eating 2° on each side, a segment below roughly this size
 * is consumed by its own gaps and vanishes. Seeing that a share is nearly
 * nothing is the point; seeing nothing at all is a bug (§11.4). The distortion
 * is bounded and never changes which segment is larger — the legend beside the
 * ring carries the exact figures either way.
 */
const MIN_SHARE = 0.004

export function MoneyCompositionRing({
  segments,
  ariaLabel,
  formatAmount,
  centerLabel,
  className,
}: {
  segments: CompositionSegment[]
  /** Must read out every value as words (§24). */
  ariaLabel: string
  formatAmount: (value: number) => string
  /** The word under the centre figure, e.g. "linh hoạt". Caller-translated. */
  centerLabel: string
  className?: string
}) {
  // Weights must be non-negative, and a segment that rounds to nothing still
  // needs to be visible — flexible money is closest to zero exactly when seeing
  // it matters most (§11.4).
  const weights = segments.map((segment) => Math.max(segment.amount, 0))
  const total = weights.reduce((sum, weight) => sum + weight, 0)

  /**
   * Falls back to equal shares when everything is zero, so the ring never
   * renders as an empty disc.
   *
   * `minPointSize` has no Pie equivalent, so a share too small to draw is
   * floored here instead: below this the arc collapses to nothing and the
   * segment disappears, and a household whose flexible money has run down to
   * almost nothing is exactly who needs to see that it is still there (§11.4).
   */
  const data = segments.map((segment, index) => ({
    ...segment,
    value:
      total > 0 ? Math.max(weights[index] / total, MIN_SHARE) : 1 / segments.length,
    // Per-datum fill rather than <Cell>, which recharts 3 deprecates.
    fill: FILL[segment.tone],
  }))

  const headline = segments.find((segment) => segment.tone === 'flexible') ?? segments[0]

  return (
    <div
      className={cn(
        'grid gap-6 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center sm:gap-10',
        className,
      )}
    >
      <div
        className="relative aspect-square w-[170px] shrink-0 justify-self-center sm:justify-self-start"
        role="img"
        aria-label={ariaLabel}
      >
        <ResponsiveContainer width="100%" height="100%">
          {/* Zeroed: PieChart defaults to a 5px margin on every side, which
              would shrink the ring inside the 170px box and leave the centre
              figure sitting in a hole that no longer matches the arc. */}
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              /* 90 → −270 sweeps CLOCKWISE from 12 o'clock. Recharts measures
                 angles counter-clockwise from 3 o'clock, so the naive
                 `startAngle={90}` alone would run the ring backwards and put
                 the first segment where the reader expects the last. */
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="100%"
              /* The gap and the rounded caps: each share reads as its own
                 token rather than as a slice of a divided disc, which is what
                 keeps this a composition and not a pie. */
              paddingAngle={2}
              cornerRadius={6}
              stroke="none"
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* The centre figure sits OUTSIDE the svg: as a recharts `Label` it
            would inherit svg text metrics and lose `.num`'s tabular figures,
            so the percentage would shift width as it changes. `pointer-events-none`
            keeps it from swallowing hover on the arcs beneath it. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[36px] leading-none font-normal tracking-[-.04em]">
            {headline.percentLabel ?? `${headline.percent}%`}
          </span>
          <span className="mt-1 text-[12px] text-ink3">{centerLabel}</span>
        </div>
      </div>

      {/* A grid, not a flex row: the percent and the amount columns must line up
          down the legend, and the label column absorbs the slack. */}
      <dl className="w-full min-w-0 space-y-0">
        {segments.map((segment, index) => (
          <div
            key={segment.key}
            className={cn(
              'grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3.5 text-[13px]',
              index < segments.length - 1 && 'border-b border-divider',
            )}
          >
            <dt
              className={cn(
                'flex min-w-0 items-center gap-2.5',
                segment.tone === 'flexible' ? 'font-medium text-ink' : 'text-ink2',
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: FILL[segment.tone] }}
              />
              <span className="truncate">{segment.label}</span>
            </dt>
            <span className="num text-[12px] text-ink3">
              {segment.percentLabel ?? `${segment.percent}%`}
            </span>
            <dd
              className={cn(
                'num min-w-[76px] text-right',
                segment.tone === 'flexible' && 'font-medium text-ink',
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

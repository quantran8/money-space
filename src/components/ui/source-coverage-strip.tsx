import { Sunk } from '@/components/ui/panel'
import { cn } from '@/shared/lib/utils'

/**
 * SourceCoverageStrip (§11.5, §2.15).
 *
 * One segment per money source feeding the picture. This is the second thing a
 * household needs to read on Home (§1.1) — the hero number, the low point and
 * the state are all outputs of the same inputs, so if the inputs are stale all
 * three are wrong and nothing else on the page would say so.
 *
 * It renders even when every source is fresh: the strip is CONTEXT for the
 * number above it, not a warning (§25 — hiding it when all-fresh was tried and
 * rejected). It never shows a confidence percentage; that would be a made-up
 * number (§2.15).
 */
export type CoverageState = 'fresh' | 'stale' | 'never'

const FILL: Record<CoverageState, string> = {
  fresh: 'var(--ink)',
  stale: 'var(--attention)',
  never: 'var(--committed)',
}

export type CoverageSource = {
  id: string
  state: CoverageState
}

export function SourceCoverageStrip({
  sources,
  ariaLabel,
  summary,
  caveat,
  action,
  className,
}: {
  /** Fixed order — the order sources appear on the money page, never sorted by state. */
  sources: CoverageSource[]
  ariaLabel: string
  /** "Tính từ 5 nguồn · 3 mới trong tuần · 2 cần cập nhật" */
  summary: React.ReactNode
  /** Only when something IS stale: which numbers are missing which source. */
  caveat?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  // Past 8 sources the gaps stop reading as separate segments, so the strip
  // becomes one continuous band instead (§11.5).
  const dense = sources.length > 8

  return (
    <Sunk className={cn('mt-6 p-4', className)}>
      <div
        className={cn('flex items-center', dense ? 'gap-0' : 'gap-1.5')}
        role="img"
        aria-label={ariaLabel}
      >
        {sources.map((source, index) => (
          <span
            key={source.id}
            className={cn(
              'seg h-1.5 flex-1',
              dense
                ? cn(
                    index === 0 && 'rounded-l-full',
                    index === sources.length - 1 && 'rounded-r-full',
                  )
                : 'rounded-full',
            )}
            style={{
              background: FILL[source.state],
              animationDelay: `${index * 0.05}s`,
            }}
          />
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink2">{summary}</p>
        {action}
      </div>

      {caveat ? <p className="mt-2 text-[13px] text-ink2">{caveat}</p> : null}
    </Sunk>
  )
}

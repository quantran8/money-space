import { cn } from '@/shared/lib/utils'

/**
 * The SPEND, split across where the money comes from.
 *
 * The earlier version drew the WALLET with the spend marked off inside it. That
 * answered "how big is this next to the balance", which is a real question but
 * not the one being asked here — and at small amounts it answered it as a sliver
 * nobody could read. The question this block exists for is *where does this
 * money come from*, so the bar is now the spend itself at full width, divided
 * into the parts that pay for it.
 *
 * Two parts, in the order the money gives way:
 *
 *  1. **fromPace** — this month's contribution, given up first. Accent: a month
 *     of saving paused is the ordinary case, not a wound.
 *  2. **fromSetAside** — money already behind a goal, only once the pace is
 *     gone. Attention, never alert: the goal moving backwards is worth marking,
 *     but the household is scheduling a bill, not making a mistake (§16).
 *
 * The segments are labelled in place when they are wide enough to hold a figure,
 * which is what lets the bar replace a legend rather than need one.
 *
 * `aria-hidden`: every figure here is stated in words beside it (§24), and a
 * screen reader should not hear them twice.
 */
export function SpendImpactBar({
  fromPace,
  fromSetAside,
  formatAmount,
  className,
}: {
  fromPace: number
  fromSetAside: number
  /** Renders a slice's own figure, for the in-bar label. */
  formatAmount: (value: number) => string
  className?: string
}) {
  const parts = [
    { key: 'pace', amount: fromPace, fill: 'var(--accent)' },
    { key: 'setAside', amount: fromSetAside, fill: 'var(--attention)' },
  ].filter((part) => part.amount > 0)

  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  if (total <= 0) return null

  return (
    <div
      className={cn('flex h-10 overflow-hidden rounded-control bg-panel', className)}
      aria-hidden="true"
    >
      {parts.map((part) => {
        const share = (part.amount / total) * 100
        return (
          <div
            key={part.key}
            className="flex min-w-[3px] items-center justify-center px-2 text-[12px] font-medium text-white"
            style={{ flexGrow: part.amount, flexBasis: 0, background: part.fill }}
          >
            {/* A sliver cannot hold a figure legibly, and a clipped number is
                worse than none — the lines below carry it either way. */}
            {share >= 14 ? formatAmount(part.amount) : null}
          </div>
        )
      })}
    </div>
  )
}

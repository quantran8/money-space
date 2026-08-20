import { cn } from '@/shared/lib/utils'

/**
 * The wallet as a bar, with the part this spend takes marked off.
 *
 * The text alone made the household do arithmetic to picture it: which slice of
 * the wallet is moving, and how big is it next to what stays. A bar answers both
 * at a glance, and the proportion is the whole point — 4tr out of 52tr and 4tr
 * out of 5tr are very different situations that read identically as words.
 *
 * Four parts, left to right, in the order the money gives way:
 *
 *  1. **spendFromPace** — this month's contribution, given up first.
 *  2. **spendFromSetAside** — money already behind a goal, only once the pace is
 *     gone. Marked in the alert colour because this is the goal moving
 *     backwards, not a month of saving paused.
 *  3. **goalRemaining** — what the goals still hold afterwards.
 *  4. **unassigned** — the part of the wallet no goal has claimed.
 *
 * Purely decorative: `aria-hidden`, because the sentences beside it already say
 * every figure in words (§24) and a screen reader should not hear them twice.
 */
export function SpendImpactBar({
  spendFromPace,
  spendFromSetAside,
  goalRemaining,
  unassigned,
  className,
}: {
  spendFromPace: number
  spendFromSetAside: number
  goalRemaining: number
  unassigned: number
  className?: string
}) {
  const parts = [
    { key: 'pace', amount: spendFromPace, fill: 'var(--ink3)' },
    { key: 'setAside', amount: spendFromSetAside, fill: 'var(--alert)' },
    { key: 'goal', amount: goalRemaining, fill: 'var(--committed)' },
    { key: 'unassigned', amount: unassigned, fill: 'var(--accent)' },
  ].filter((part) => part.amount > 0)

  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  if (total <= 0) return null

  return (
    <div
      className={cn('flex h-2 gap-0.5 overflow-hidden', className)}
      aria-hidden="true"
    >
      {parts.map((part, index) => (
        <div
          key={part.key}
          className={cn(
            // A slice that rounds to nothing still has to be visible: a small
            // spend against a large wallet is exactly when seeing how small it
            // is carries the meaning.
            'min-w-[3px]',
            index === 0 && 'rounded-l-full',
            index === parts.length - 1 && 'rounded-r-full',
          )}
          style={{
            flexGrow: part.amount,
            flexBasis: 0,
            background: part.fill,
          }}
        />
      ))}
    </div>
  )
}

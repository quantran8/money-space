import { formatMoney } from '@/shared/lib/format-money'

/**
 * The §22.7 consequence sentence for a money event.
 *
 * §22.7 asks an expense form to answer two things: "thấp nhất trong kỳ đổi thế
 * nào" and "quỹ an toàn có bị chạm không". Both are derivable from the forecast
 * the app already holds, so this is computed locally rather than through a
 * what-if round-trip per keystroke — a network call on every character would
 * also re-run the events prefill effect and wipe what the user is typing.
 *
 * It is an ESTIMATE of what saving would produce: the real number comes back
 * from the backend after the save. That is the honest register for a "what
 * happens if I do this" block, and it must never be phrased as a
 * recommendation (§16.1) — it states a consequence, nothing more.
 *
 * Returns null when there is no forecast yet or no amount typed: §23 says show
 * nothing rather than a fabricated zero.
 */
export function buildEventEffect({
  amount,
  direction,
  lowestProjectedBalance,
  reserveAmount,
  horizonDays,
  t,
}: {
  amount: number
  direction: 'inflow' | 'outflow' | 'neutral'
  lowestProjectedBalance: number | undefined
  reserveAmount: number
  horizonDays: number
  t: (key: string, params?: Record<string, unknown>) => string
}): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (lowestProjectedBalance === undefined) return null
  // A transfer moves money between the household's own wallets, so the total
  // low point does not shift — claiming otherwise would be a false consequence.
  if (direction === 'neutral') return null

  // MAY BE NEGATIVE on either side — never clamp (forecast.types.ts).
  const nextLowest =
    direction === 'inflow' ? lowestProjectedBalance + amount : lowestProjectedBalance - amount

  if (direction === 'inflow') {
    return t('events.form.effectIncome', {
      days: horizonDays,
      lowest: formatMoney(nextLowest),
    })
  }

  if (reserveAmount <= 0) {
    return t('events.form.effectLowest', {
      days: horizonDays,
      lowest: formatMoney(nextLowest),
    })
  }

  // Same comparison the dashboard already uses for the reserve line.
  const breaches = nextLowest < reserveAmount
  return t(breaches ? 'events.form.effectLowestBreach' : 'events.form.effectLowestSafe', {
    days: horizonDays,
    lowest: formatMoney(nextLowest),
    reserve: formatMoney(reserveAmount),
  })
}

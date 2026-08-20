import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { ScheduledOutflowImpact } from '@/features/goals/api/goals.repository'
import { formatAmount } from '@/features/goals/model/goals-form'

/**
 * What money already scheduled to leave this goal's wallets will cost it.
 *
 * ## Why one section instead of a note on every figure
 *
 * A scheduled outflow moves several numbers on this screen at once — the total
 * held, this month's pace, the wallet each card reports. The first attempt hung
 * a projected figure off each of them, and it read badly: the same fact restated
 * three times, never explained once, with the cause — a named bill, on a date —
 * having nowhere to live. The household was left assembling the story from
 * fragments.
 *
 * So every figure elsewhere stays ACTUAL (the wallet as it stands; money that
 * has not moved has not been spent), and this is the single place that says what
 * is coming and why.
 *
 * ## What it deliberately does NOT touch
 *
 * The long-range projection — the finish date and the "20,0 tr/tháng" line on
 * the chart — keeps using the DECLARED pace. A squeezed month is this month
 * only: the wallet refills, and projecting a one-month dip across years would
 * report a pessimistic finish date the household never chose. This section says
 * the month is short; it does not re-forecast the goal.
 *
 * Renders nothing when nothing is scheduled — the server sends `null`, so a
 * household with no bills never sees a speculative block.
 */
export function GoalScheduledOutflowsSection({
  impact,
}: {
  impact: ScheduledOutflowImpact | null
}) {
  const { t } = useTranslation()

  if (!impact || impact.events.length === 0) return null

  // Only the parts that actually move. A bill smaller than the wallet's free
  // room leaves the total untouched and only squeezes the pace; saying "total:
  // unchanged" would be a line that carries nothing.
  const totalChanged = impact.projectedAmount !== impact.currentAmount
  const paceChanged = impact.projectedPace !== impact.currentPace

  return (
    <Panel>
      <PanelHeader
        title={t('goals.scheduledOutflows.title', {
          amount: formatAmount(impact.outflowAmount),
        })}
      />

      <p className="mt-1 text-[13px] leading-5 text-ink2">
        {t('goals.scheduledOutflows.description')}
      </p>

      {/* The consequences, each stated as before → after so the change is
          readable without arithmetic. */}
      {totalChanged || paceChanged ? (
        <dl className="mt-4 space-y-3">
          {totalChanged ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[13px] text-ink2">
                {t('goals.scheduledOutflows.totalLabel')}
              </dt>
              <dd className="num text-[13px] text-ink">
                <span className="text-ink3 line-through">
                  {formatAmount(impact.currentAmount)}
                </span>{' '}
                <span className="font-medium">{formatAmount(impact.projectedAmount)}</span>
              </dd>
            </div>
          ) : null}

          {paceChanged ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[13px] text-ink2">
                {t('goals.scheduledOutflows.paceLabel')}
              </dt>
              <dd className="num text-[13px] text-ink">
                <span className="text-ink3 line-through">
                  {formatAmount(impact.currentPace)}
                </span>{' '}
                <span className="font-medium">{formatAmount(impact.projectedPace)}</span>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* The bills themselves. Naming them is what makes the block explain
          rather than merely assert — the household can recognise the spend and
          go change it if the trade is not one they want. */}
      <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
        {impact.events.map((event) => (
          <li
            key={event.id}
            className="flex items-baseline justify-between gap-4 text-[12px] leading-5"
          >
            <span className="min-w-0 truncate text-ink2">
              {event.name}
              <span className="text-ink3">
                {' · '}
                {t('goals.scheduledOutflows.fromWallet', { wallet: event.assetName })}
              </span>
            </span>
            <span className="num shrink-0 text-ink2">{formatAmount(event.amount)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[12px] leading-5 text-ink3">
        {t('goals.scheduledOutflows.paceNote')}
      </p>
    </Panel>
  )
}

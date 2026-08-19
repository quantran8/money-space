import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader, TotalRow } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { useGoalMonthlyProgress } from '@/features/goals/hooks/use-goal-monthly-progress'
import { formatAmount } from '@/features/goals/model/goals-form'
import { cn } from '@/shared/lib/utils'

/**
 * Month by month: how much actually went into this goal, against the pace the
 * household declared.
 *
 * The goal's headline figure answers *how much is behind this now*. This answers
 * the question a household actually asks month to month — "we meant to set aside
 * 10tr; did we?" — and because each month is the difference between two frozen
 * snapshots, it already accounts for everything: money added, money spent back
 * out of the backing assets, and the assets repricing.
 *
 * The month still running gets a row too, measured to right now. Without it a
 * household mid-month sees its 10tr target and nothing else, and has to wait
 * for the month to close to learn where it stands — feedback the "contribute"
 * button used to give before goals stopped holding money of their own. That row
 * says what is LEFT to go rather than what is missing: an unfinished month is
 * not a shortfall.
 *
 * A short month is shown with `--attention`, never `--alert`: falling short of
 * a savings pace is information, not an error, and the product does not deliver
 * verdicts on how a household spent its own money (design.md §16).
 */
export function GoalMonthlyProgressSection({ goalId }: { goalId: string }) {
  const { t } = useTranslation()
  const { months, isLoading } = useGoalMonthlyProgress(goalId)

  // The first month on record has no previous month to compare against, so it
  // carries no delta — showing it as a row of dashes says nothing. The running
  // month stays even without one: "this month, so far" is the question being
  // asked, and an honest blank answers it better than hiding the row.
  const rows = months.filter((month) => month.delta !== null || month.inProgress)

  // A goal backed only by gold has no pace to keep. The server withholds
  // `planned` for it, and showing "0 / 10tr · thiếu 10tr" every month would pass
  // judgement on a plan nobody made — so those two columns come off entirely and
  // what is left is what the goal actually is: value being held.
  const hasPace = months.some((month) => month.planned !== null)
  const latest = months.at(-1)

  return (
    <Panel>
      <PanelHeader title={t('goals.monthly.title')} />

      {isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-control" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-sunk bg-sunk px-4 py-10 text-center text-[13px] text-ink2">
          {t('goals.monthly.empty')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-dense w-full min-w-[420px] text-[14px]">
            <thead>
              <tr className="label">
                <th className="pb-3 text-left font-normal">
                  {t('goals.monthly.columns.month')}
                </th>
                <th className="pb-3 text-right font-normal">
                  {t('goals.monthly.columns.actual')}
                </th>
                {hasPace ? (
                  <>
                    <th className="pb-3 text-right font-normal">
                      {t('goals.monthly.columns.planned')}
                    </th>
                    <th className="pb-3 text-right font-normal">
                      {t('goals.monthly.columns.gap')}
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((month) => {
                const short = month.gap !== null && month.gap < 0
                return (
                  <tr key={month.month}>
                    <td className="py-3 font-mono text-[12px] text-ink3">
                      {month.month}
                      {month.inProgress ? (
                        <span className="ml-2 font-sans text-[11px] text-ink3">
                          {t('goals.monthly.inProgress')}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={cn(
                        'num py-3 text-right font-medium',
                        // A negative month means more went out of the backing
                        // assets than came in — the signal, shown as it is.
                        (month.delta ?? 0) < 0 && 'text-attention',
                      )}
                    >
                      {month.delta === null ? '—' : formatAmount(month.delta)}
                    </td>
                    {hasPace ? (
                      <>
                        <td className="num py-3 text-right text-ink2">
                          {month.planned === null
                            ? '—'
                            : formatAmount(month.planned)}
                        </td>
                        <td
                          className={cn(
                            'num py-3 text-right',
                            // A running month is not behind — it is unfinished.
                            // Only a closed month can fall short, so the live row
                            // states what is left to go and stays neutral.
                            short && !month.inProgress
                              ? 'text-attention'
                              : 'text-ink2',
                          )}
                        >
                          {month.gap === null
                            ? '—'
                            : month.inProgress
                              ? short
                                ? t('goals.monthly.remaining', {
                                    amount: formatAmount(Math.abs(month.gap)),
                                  })
                                : t('goals.monthly.paceMet')
                              : short
                                ? t('goals.monthly.short', {
                                    amount: formatAmount(Math.abs(month.gap)),
                                  })
                                : t('goals.monthly.onPace')}
                        </td>
                      </>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Held value, apart from the pace above. The pace measures what the
          household DID; this is what the market is doing with what they hold,
          and the two must never be read as one number — that conflation is why
          a month nobody contributed to could read "đủ nhịp". */}
      {!isLoading && latest && latest.holdingsAmount > 0 ? (
        <TotalRow
          label={t('goals.monthly.holdings')}
          value={formatAmount(latest.holdingsAmount)}
        />
      ) : null}
    </Panel>
  )
}

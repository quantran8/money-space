import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { MoneyCompositionBar } from '@/components/ui/money-composition-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssetGoalUsage } from '@/features/goals/hooks/use-asset-goal-usage'
import { formatVndShort } from '@/shared/lib/format-money'

/**
 * What this asset is already promised to, and how much of it is still free.
 *
 * The relationship used to be visible only from the goal's side: opening an
 * account showed a balance with no hint that most of it was spoken for, and the
 * household had to open every goal in turn to work out what was actually theirs
 * to use. This is the question people bring TO the asset page — "can I use
 * this?" — so it is answered here.
 *
 * Every role is listed, not just wallets: gold behind a goal is promised just as
 * much as cash is.
 *
 * `freeAmount` is the same subtraction the server enforces when a new claim is
 * written, so what this reports as free is exactly what a new goal would be
 * allowed to take.
 */
export function AssetGoalUsageSection({ assetId }: { assetId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, assetValue, committedAmount, unassignedAmount, isLoading } =
    useAssetGoalUsage(assetId)

  if (isLoading) {
    return (
      <div>
        <p className="text-[13px] font-medium">{t('assets.detail.goals.title')}</p>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-control" />
          ))}
        </div>
      </div>
    )
  }

  // Nothing claims it. Said plainly rather than hidden: "all of it is yours to
  // use" is an answer worth giving, and an absent panel would leave the question
  // open.
  if (items.length === 0) {
    return (
      <div>
        <p className="text-[13px] font-medium">{t('assets.detail.goals.title')}</p>
        <p className="mt-4 rounded-sunk bg-sunk px-4 py-10 text-center text-[13px] text-ink2">
          {t('assets.detail.goals.empty')}
        </p>
      </div>
    )
  }

  const percent = (value: number) =>
    assetValue > 0 ? Math.round((Math.max(value, 0) / assetValue) * 100) : 0

  /**
   * A share that rounds to 0% or 100% must not READ as none or all — an asset
   * that is 99,6% spoken for still has something free, and rounding it away is
   * the one direction this figure must not err in.
   */
  const percentLabel = (value: number) => {
    const share = assetValue > 0 ? (Math.max(value, 0) / assetValue) * 100 : 0
    if (share > 0 && share < 1) return '<1%'
    if (share > 99 && share < 100) return '>99%'
    return `${Math.round(share)}%`
  }

  return (
    <div>
      <p className="text-[13px] font-medium">{t('assets.detail.goals.title')}</p>

      <div className="mt-4">
        <MoneyCompositionBar
          /* `committedAmount` / `unassignedAmount`, NOT `claimed` / `free`.
             The labels here say "đã dành cho mục tiêu" and "chưa dành cho mục
             tiêu nào", which is the all-in question — money set aside AND what
             this month's paces will draw. `freeAmount` answers a different one
             (what a NEW allocation may still take), and showing it under this
             label contradicted the dashboard: a 52tr wallet with 20tr set aside
             and two goals each promising 20tr/month read "32tr chưa dành cho
             mục tiêu nào" while Home counted all 52tr as committed. */
          segments={[
            {
              key: 'claimed',
              label: t('assets.detail.goals.claimed'),
              amount: committedAmount,
              percent: percent(committedAmount),
              percentLabel: percentLabel(committedAmount),
              tone: 'committed',
            },
            {
              key: 'free',
              label: t('assets.detail.goals.free'),
              amount: unassignedAmount,
              percent: percent(unassignedAmount),
              percentLabel: percentLabel(unassignedAmount),
              tone: 'flexible',
            },
          ]}
          ariaLabel={t('assets.detail.goals.aria', {
            claimed: formatVndShort(committedAmount),
            free: formatVndShort(unassignedAmount),
          })}
          formatAmount={formatVndShort}
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="table-dense w-full min-w-[360px] text-[14px]">
          <thead>
            <tr className="label">
              <th className="pb-3 text-left font-normal">
                {t('assets.detail.goals.columns.goal')}
              </th>
              <th className="pb-3 text-right font-normal">
                {t('assets.detail.goals.columns.counted')}
              </th>
              <th className="pb-3 text-right font-normal">
                {t('assets.detail.goals.columns.monthly')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.allocationId}
                className="cursor-pointer border-t border-hairline transition-colors hover:bg-sunk"
                onClick={() => navigate(`/goals/${item.goalId}`)}
              >
                <td className="py-3">
                  <span className="text-ink">{item.goalName}</span>
                  {/* A percent claim tracks the asset, so it is worth saying
                      which kind this is — "25% of it" and "25tr of it" behave
                      differently the next time the price moves. */}
                  <span className="mt-0.5 block text-[12px] text-ink2">
                    {item.kind === 'percent'
                      ? t('assets.detail.goals.sharePercent', { percent: item.percent ?? 0 })
                      : t(`options.priority.${item.priority}`)}
                  </span>
                </td>
                <td className="py-3 text-right num text-ink">
                  {/* `countedValue`, not `currentValue`: the column says "đang
                      tính", which is everything this goal is counted as holding
                      — set aside plus its share of the month's pace. Showing the
                      set-aside half alone put "0đ" next to a goal the dashboard
                      counts 16tr behind. */}
                  {formatVndShort(item.countedValue)}
                </td>
                <td className="py-3 text-right num text-ink2">
                  {item.monthlyContribution
                    ? formatVndShort(item.monthlyContribution)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

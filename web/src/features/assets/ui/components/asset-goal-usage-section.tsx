import { Target } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { MoneyCompositionRing } from '@/components/ui/money-composition-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

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
 *
 * The goals used to be a three-column table. They are a LIST now: at one or two
 * goals a table header cost more rows than the data it labelled, and the two
 * columns it added ("đang tính", "góp mỗi tháng") answer the goal's question,
 * not the asset's. What the asset page is asked is how much of it is free — so
 * the ring and the free row lead, and each goal states only its own claim.
 */
export function AssetGoalUsageSection({ assetId }: { assetId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, assetValue, committedAmount, unassignedAmount, isLoading } =
    useAssetGoalUsage(assetId)

  if (isLoading) {
    return (
      <div>
        <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>
        <div className="mt-5 flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-control" />
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
        <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>
        <EmptyState icon={Target} className="mt-5">
          {t('assets.detail.goals.empty')}
        </EmptyState>
      </div>
    )
  }

  const share = (value: number) =>
    assetValue > 0 ? (Math.max(value, 0) / assetValue) * 100 : 0
  const percent = (value: number) => Math.round(share(value))

  /**
   * A share that rounds to 0% or 100% must not READ as none or all — an asset
   * that is 99,6% spoken for still has something free, and rounding it away is
   * the one direction this figure must not err in.
   */
  const percentLabel = (value: number) => {
    const value_ = share(value)
    if (value_ > 0 && value_ < 1) return '<1%'
    if (value_ > 99 && value_ < 100) return '>99%'
    return `${Math.round(value_)}%`
  }

  return (
    <div>
      <p className="t-body-sm text-ink2">{t('assets.detail.goals.sectionTitle')}</p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* `committedAmount` / `unassignedAmount`, NOT `claimed` / `free`.
            The labels here say "đã dành cho mục tiêu" and "còn tự do", which is
            the all-in question — money set aside AND what this month's paces
            will draw. `freeAmount` answers a different one (what a NEW
            allocation may still take), and showing it under this label
            contradicted the dashboard: a 52tr wallet with 20tr set aside and two
            goals each promising 20tr/month read "32tr chưa dành cho mục tiêu
            nào" while Home counted all 52tr as committed. */}
        <MoneyCompositionRing
          className="shrink-0 sm:w-[170px] sm:grid-cols-1"
          segments={[
            {
              key: 'free',
              label: t('assets.detail.goals.freeTitle'),
              amount: unassignedAmount,
              percent: percent(unassignedAmount),
              percentLabel: percentLabel(unassignedAmount),
              tone: 'flexible',
            },
            {
              key: 'claimed',
              label: t('assets.detail.goals.claimed'),
              amount: committedAmount,
              percent: percent(committedAmount),
              percentLabel: percentLabel(committedAmount),
              tone: 'committed',
            },
          ]}
          ariaLabel={t('assets.detail.goals.aria', {
            claimed: formatVndShort(committedAmount),
            free: formatVndShort(unassignedAmount),
          })}
          centerLabel={t('assets.detail.goals.ringCenter')}
          formatAmount={formatVndShort}
          legend={false}
        />

        <div className="min-w-0 flex-1">
          {/* Free leads, at body size: it is the answer, and the committed half
              is the context that explains it. */}
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-3 shrink-0 rounded-full bg-data-primary" />
              <div className="min-w-0">
                <p className="t-body-sm font-medium">{t('assets.detail.goals.freeTitle')}</p>
                <p className="mt-0.5 t-caption text-ink3">{t('assets.detail.goals.freeNote')}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="num t-body font-medium">{formatVndShort(unassignedAmount)}</p>
              <p className="num mt-0.5 t-caption text-ink3">{percentLabel(unassignedAmount)}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-3 shrink-0 rounded-full bg-committed" />
                <p className="truncate t-caption text-ink3">{t('assets.detail.goals.claimed')}</p>
              </div>
              <p className="num shrink-0 t-caption text-ink3">
                {formatVndShort(committedAmount)} · {percentLabel(committedAmount)}
              </p>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.allocationId}>
                  {/* A button, not a row with an onClick: this is the one link
                      out of the panel and it has to be reachable by keyboard. */}
                  <button
                    type="button"
                    onClick={() => navigate(`/goals/${item.goalId}`)}
                    className="flex min-h-11 w-full items-center justify-between gap-5 rounded-control text-left outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-action"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Target className="size-[17px] shrink-0 text-ink3" strokeWidth={1.75} aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate t-body-sm font-medium">{item.goalName}</span>
                        {/* A percent claim tracks the asset, so it is worth
                            saying which kind this is — "25% of it" and "25tr of
                            it" behave differently the next time the price
                            moves. */}
                        {item.kind === 'percent' ? (
                          <span className="mt-0.5 block truncate t-caption text-ink3">
                            {t('assets.detail.goals.sharePercent', { percent: item.percent ?? 0 })}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {/* `countedValue`, not `currentValue`: this is everything
                          the goal is counted as holding — set aside plus its
                          share of the month's pace. The set-aside half alone put
                          "0đ" next to a goal the dashboard counts 16tr behind. */}
                      <span className="num block t-body-sm font-medium">
                        {formatVndShort(item.countedValue)}
                      </span>
                      <span className="num mt-0.5 block t-caption text-ink3">
                        {percentLabel(item.countedValue)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import {
  EmptyState,
  GroupedRow,
  MoneyCompositionBar,
  Panel,
  PanelHeader,
  RowMeta,
  Skeleton,
} from '@/components/ui'

/**
 * What this asset is already promised to, and how much of it is still free.
 *
 * "Can I actually use this?" is the question people bring TO an asset, so it is
 * answered here rather than only from each goal's side — which used to mean
 * opening every goal in turn to work out what was theirs.
 *
 * Every role counts, not just wallets: gold behind a goal is promised just as
 * much as cash is.
 */
export function AssetGoalUsage({
  assetId,
  onOpenGoal,
}: {
  assetId: string
  onOpenGoal: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const { items, assetValue, committedAmount, unassignedAmount, isLoading } =
    useAssetGoalUsage(assetId)

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('assets.detail.goals.title')} />
        <View className="mt-4 gap-2">
          <Skeleton height={40} />
          <Skeleton height={40} />
        </View>
      </Panel>
    )
  }

  // Nothing claims it. Said plainly rather than hidden — "all of it is yours to
  // use" is an answer worth giving, and an absent panel leaves the question open.
  if (items.length === 0) {
    return (
      <Panel>
        <PanelHeader title={t('assets.detail.goals.title')} />
        <EmptyState className="mt-4" message={t('assets.detail.goals.empty')} />
      </Panel>
    )
  }

  const percent = (value: number) =>
    assetValue > 0 ? Math.round((Math.max(value, 0) / assetValue) * 100) : 0

  /**
   * A share that rounds to 0% or 100% must not READ as none or all — an asset
   * 99,6% spoken for still has something free, and rounding that away is the
   * one direction this figure must not err in.
   */
  const percentLabel = (value: number) => {
    const share = assetValue > 0 ? (Math.max(value, 0) / assetValue) * 100 : 0
    if (share > 0 && share < 1) return '<1%'
    if (share > 99 && share < 100) return '>99%'
    return `${Math.round(share)}%`
  }

  return (
    <Panel>
      <PanelHeader title={t('assets.detail.goals.title')} />

      <MoneyCompositionBar
        className="mt-5"
        /* `committedAmount` / `unassignedAmount`, NOT `claimed` / `free`. These
           labels say "đã dành cho mục tiêu" and "chưa dành cho mục tiêu nào" —
           the all-in question, money set aside AND what this month's paces will
           draw. `freeAmount` answers a different one (what a NEW allocation may
           still take) and showing it here contradicted the dashboard. */
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
        formatValue={formatVndShort}
      />

      <View className="mt-4">
        {items.map((item) => (
          <GroupedRow
            key={item.allocationId}
            title={item.goalName}
            meta={
              <RowMeta>
                {/* A percent claim tracks the asset, so it is worth saying which
                    kind this is — "25% of it" and "25tr of it" behave
                    differently the next time the price moves. */}
                {item.kind === 'percent'
                  ? t('assets.detail.goals.sharePercent', { percent: item.percent ?? 0 })
                  : t(`options.priority.${item.priority}`)}
              </RowMeta>
            }
            // `countedValue`, not the set-aside half: the column says "đang
            // tính", everything this goal is counted as holding.
            value={formatVndShort(item.countedValue)}
            valueMeta={
              item.monthlyContribution ? formatVndShort(item.monthlyContribution) : undefined
            }
            onPress={() => onOpenGoal(item.goalId)}
          />
        ))}
      </View>
    </Panel>
  )
}

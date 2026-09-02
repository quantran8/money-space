import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import {
  EmptyState,
  GroupedRow,
  Label,
  MoneyCompositionRing,
  Money,
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

  // A negative asset has no ratio to show — a ring drawn from it would be a
  // shape with no meaning, so the figures stand alone and a line says why.
  const isOverdrawn = assetValue < 0
  const freePercent = percent(unassignedAmount)

  return (
    <Panel>
      <PanelHeader
        title={t('assets.detail.goals.sectionTitle')}
        right={
          <Text className="t-caption text-ink3">
            {t('assets.detail.goals.goalCount', { count: items.length })}
          </Text>
        }
      />

      {isOverdrawn ? null : (
        <MoneyCompositionRing
          className="mt-6"
          /* Free FIRST: the question people bring to an asset is what they can
             still use, so that is what the ring centres and the legend leads
             with. `committedAmount` / `unassignedAmount`, NOT `claimed` /
             `free` — these labels say "đã có nhiệm vụ" and "tiền tự do", the
             all-in question. `freeAmount` answers a different one (what a NEW
             allocation may still take) and showing it here contradicted the
             dashboard. */
          segments={[
            {
              key: 'free',
              label: t('assets.detail.goals.allocationFree'),
              amount: unassignedAmount,
              percent: freePercent,
              percentLabel: percentLabel(unassignedAmount),
              tone: 'flexible',
            },
            {
              key: 'committed',
              label: t('assets.detail.goals.allocationCommitted'),
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
      )}

      {/* The two figures the ring is a picture OF. They carry the panel on
          their own when the asset is overdrawn and the ring cannot draw. */}
      <View className="mt-6 gap-5">
        <View>
          <Label>{t('assets.detail.goals.allocationFree')}</Label>
          <Money className="mt-1 text-data-ink">{formatVndShort(unassignedAmount)}</Money>
        </View>
        <View className="border-t border-divider pt-4">
          <Label>{t('assets.detail.goals.allocationCommitted')}</Label>
          <Money className="mt-1">{formatVndShort(committedAmount)}</Money>
        </View>
      </View>

      {isOverdrawn ? (
        <View className="mt-6 border-t border-divider pt-4">
          <Text className="t-body-sm text-attention-ink">
            {t('assets.detail.goals.overdrawnWarning', {
              value: formatVndShort(Math.abs(assetValue)),
            })}
          </Text>
        </View>
      ) : null}

      <View className="mt-6 border-t border-divider pt-6">
        <Text className="t-subtitle text-ink">{t('assets.detail.goals.panelTitle')}</Text>
      </View>

      {/* Nothing claims it. Said plainly rather than hidden — "all of it is
          yours to use" is an answer worth giving, and an absent list leaves the
          question open. */}
      {items.length === 0 ? (
        <EmptyState className="mt-5" message={t('assets.detail.goals.empty')} />
      ) : (
        <View className="mt-5">
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
      )}
    </Panel>
  )
}

import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalAllocationRecord } from '@money-space/core/features/goals/api/goals.repository'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

import {
  ActionSheet,
  Button,
  EmptyState,
  Label,
  Panel,
  PanelHeader,
  Sunk,
} from '@/components/ui'

import type { ActionSheetItem } from '@/components/ui'
import type { AllocationAssetOption } from '@/features/goals/ui/types'

/**
 * "Nguồn tạo tiến độ" — which assets move this goal, and how each one does it.
 *
 * A goal stores no figure of its own: its progress IS these shares, valued at
 * live asset prices. This panel is where they are added, changed and removed —
 * the screen `protected_reserves` never had, where a figure declared once could
 * quietly outlive the intention behind it.
 *
 * ## Why two groups rather than one list
 *
 * The two kinds of source do not answer the same question. A **holding**
 * answers *how much is behind this right now* — a stock of value the market
 * moves. A **contribution** answers *how much goes in each month* — a rate the
 * household sets. Interleaved, a reader has to check each row's badge before
 * they know which question its number answers, and a "162,0 tr" ends up
 * directly above a "20,0 tr" that means something else entirely.
 *
 * Grouped, each heading carries a total of its own and every figure under it is
 * the same kind of thing — so the rows can stay quiet: a name and one number.
 *
 * The web lays the two groups as columns. On a phone they stack, which is the
 * same idea with the reading order made explicit.
 */
export function GoalAllocationsSection({
  allocations,
  assetOptions,
  isBusy,
  canAdd,
  onAdd,
  onEdit,
  onRemove,
}: {
  allocations: GoalAllocationRecord[]
  assetOptions: AllocationAssetOption[]
  isBusy: boolean
  canAdd: boolean
  onAdd: () => void
  onEdit: (allocation: GoalAllocationRecord) => void
  onRemove: (allocationId: string) => void
}) {
  const { t } = useTranslation()

  const holdings = allocations.filter((row) => row.role !== 'contribution')
  const contributions = allocations.filter((row) => row.role === 'contribution')

  const holdingsTotal = holdings.reduce((sum, row) => sum + row.currentValue, 0)
  // A wallet with no declared rate contributes nothing to the pace. Summing it
  // as zero is right; the row itself says the rate is unset.
  const monthlyTotal = contributions.reduce(
    (sum, row) => sum + (row.monthlyContribution ?? 0),
    0,
  )

  const nameFor = (row: GoalAllocationRecord) =>
    assetOptions.find((option) => option.value === row.assetId)?.name ?? row.assetId

  return (
    <Panel>
      <PanelHeader title={t('goals.allocations.title')} />

      {/* Assets behind the goal, but nothing to pay into it month to month —
          usually because the asset that was its last wallet got deleted. The
          goal survives that now instead of blocking the delete, so this is
          where the household finds out. Above the groups, because it explains
          why the contribution group is missing entirely. */}
      {allocations.length > 0 && contributions.length === 0 ? (
        <Sunk className="mt-5">
          <Text className="text-[13px] leading-5 text-ink2">
            {t('goals.allocations.noWalletTitle')}
          </Text>
          <Button
            className="mt-3 self-start"
            variant="secondary"
            onPress={canAdd && !isBusy ? onAdd : undefined}
          >
            {t('goals.allocations.addWallet')}
          </Button>
        </Sunk>
      ) : null}

      {allocations.length === 0 ? (
        // A statement with no button leaves a brand-new goal reading as 0% with
        // nothing to do about it. The invitation belongs where the household is
        // already looking.
        <EmptyState
          className="mt-5"
          message={t('goals.allocations.empty')}
          action={canAdd ? t('goals.allocations.addSource') : undefined}
          onAction={canAdd && !isBusy ? onAdd : undefined}
        />
      ) : (
        <View className="mt-5 gap-6">
          {/* Held value. Its total is the stock of money behind the goal. */}
          {holdings.length > 0 ? (
            <SourceGroup
              label={t('goals.allocations.holdingsLabel')}
              total={formatAmount(holdingsTotal)}
              count={t('goals.allocations.sourceCount', { count: holdings.length })}
            >
              {holdings.map((row) => (
                <SourceRow
                  key={row.id}
                  name={nameFor(row)}
                  // What the household declared, in the words they declared it:
                  // a percentage stays a percentage, a whole asset says so.
                  note={
                    row.kind === 'percent'
                      ? t('goals.allocations.percentOfValue', { percent: row.percent ?? 0 })
                      : row.currentValue >= row.assetValue
                        ? t('goals.allocations.wholeAsset')
                        : t('goals.allocations.partOfAsset')
                  }
                  value={formatAmount(row.currentValue)}
                  // The declared claim outruns what the asset now holds. The row
                  // reports the real figure and says why it moved — the
                  // household did nothing wrong, and the gap is the point.
                  warning={
                    row.kind === 'fixed' &&
                    row.allocatedAmount !== null &&
                    row.currentValue < row.allocatedAmount
                      ? t('goals.allocations.capped')
                      : null
                  }
                  onEdit={() => onEdit(row)}
                  onRemove={() => onRemove(row.id)}
                />
              ))}
            </SourceGroup>
          ) : null}

          {/* Monthly rate. Its total is the pace, which is what drives the
              projected finish date in the section above. */}
          {contributions.length > 0 ? (
            <SourceGroup
              label={t('goals.allocations.recurringLabel')}
              total={t('goals.allocations.perMonth', { amount: formatAmount(monthlyTotal) })}
              count={t('goals.allocations.sourceCount', { count: contributions.length })}
            >
              {contributions.map((row) => (
                <SourceRow
                  key={row.id}
                  name={nameFor(row)}
                  note={t('goals.allocations.monthlySource')}
                  value={
                    row.monthlyContribution != null && row.monthlyContribution > 0
                      ? formatAmount(row.monthlyContribution)
                      : t('goals.allocations.noMonthly')
                  }
                  // Money already sitting in the wallet for this goal counts
                  // toward progress too — it just is not part of the rate.
                  sub={
                    row.currentValue > 0
                      ? t('goals.allocations.setAside', {
                          amount: formatAmount(row.currentValue),
                        })
                      : null
                  }
                  warning={null}
                  onEdit={() => onEdit(row)}
                  onRemove={() => onRemove(row.id)}
                />
              ))}
            </SourceGroup>
          ) : null}
        </View>
      )}

      {/* A holding's figure moves without the household touching it. Saying so
          once, under the group it applies to, is what stops the goal's progress
          looking arbitrary. */}
      {holdings.length > 0 ? (
        <Text className="mt-5 text-[11px] leading-4 text-ink3">
          {t('goals.allocations.marketNote')}
        </Text>
      ) : null}

      {/* The invitation sits at the end, where the household finishes reading —
          a header action on a phone competes with the panel title for a row
          that is already narrow. */}
      {allocations.length > 0 ? (
        <Button
          className="mt-4"
          variant="secondary"
          onPress={canAdd && !isBusy ? onAdd : undefined}
        >
          {t('goals.allocations.addSource')}
        </Button>
      ) : null}
    </Panel>
  )
}

/** One kind of source: a heading, the total for that kind, and its rows. */
function SourceGroup({
  label,
  total,
  count,
  children,
}: {
  label: string
  total: string
  count: string
  children: React.ReactNode
}) {
  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-3">
        <View className="flex-1">
          <Label>{label}</Label>
          <Text
            className="mt-1.5 text-[22px] font-medium text-ink"
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.66 }}
          >
            {total}
          </Text>
        </View>
        <Text className="shrink-0 text-[11px] text-ink3">{count}</Text>
      </View>

      <View className="mt-3">{children}</View>
    </View>
  )
}

/**
 * One source. Quiet by design — the group heading above already said what kind
 * of number this is, so the row only has to name the asset and state it.
 */
function SourceRow({
  name,
  note,
  value,
  sub,
  warning,
  onEdit,
  onRemove,
}: {
  name: string
  note: string
  value: string
  sub?: string | null
  warning: string | null
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  const actions: ActionSheetItem[] = [
    { key: 'edit', label: t('common.edit'), onPress: onEdit },
    { key: 'remove', label: t('goals.allocations.remove'), onPress: onRemove, destructive: true },
  ]

  return (
    <View className="flex-row items-center gap-2 py-2">
      <View className="flex-1">
        <Text className="text-[14px] text-ink" numberOfLines={1}>
          {name}
        </Text>
        <Text className="mt-0.5 text-[11px] text-ink3" numberOfLines={1}>
          {note}
        </Text>
        {warning ? (
          <View className="mt-1 flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" />
            <Text className="text-[11px] text-attention">{warning}</Text>
          </View>
        ) : null}
      </View>

      <View className="items-end">
        <Text
          className="text-[14px] font-medium text-ink"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {value}
        </Text>
        {sub ? (
          <Text className="mt-0.5 text-[11px] text-ink3" style={{ fontVariant: ['tabular-nums'] }}>
            {sub}
          </Text>
        ) : null}
      </View>

      <ActionSheet
        title={name}
        accessibilityLabel={t('goals.allocations.menuFor', { name })}
        items={actions}
      />
    </View>
  )
}

import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react-native'

import type { GoalAllocationDraft } from '@money-space/core/features/goals/model/goals-form'
import {
  defaultAllocationRole,
  formatAmount,
  isWalletAssetType,
} from '@money-space/core/features/goals/model/goals-form'

import {
  CaveatNote,
  MoneyInput,
  PercentInput,
  Segmented,
  Sunk,
} from '@/components/ui'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

import type { AllocationAssetOption } from '@/features/goals/ui/types'

/**
 * The create-step editor for the real assets a goal is made of.
 *
 * A goal is **a set of shares of real assets** — it stores no figure of its
 * own — so this is not an optional extra step: without at least one share the
 * goal has no progress and no way to gain any, which is why the schema in core
 * requires it on create.
 *
 * Two rows of the same asset type answer different questions, and the field
 * says which:
 *
 *  - a **wallet** can be the account money is contributed THROUGH (a rate the
 *    household sets), or value it already holds;
 *  - anything else can only be a holding — nothing is ever paid INTO gold on a
 *    schedule, so the role control does not appear for it.
 *
 * Every figure here is a draft string; core's `useGoalsPage` turns them into
 * the payload and core's schema validates them. Nothing is computed here.
 */
export function GoalAllocationsField({
  value,
  onChange,
  assetOptions,
  error,
  contestedWalletIds,
  walletGoalNames,
}: {
  value: GoalAllocationDraft[]
  onChange: (next: GoalAllocationDraft[]) => void
  assetOptions: AllocationAssetOption[]
  error?: string
  contestedWalletIds?: ReadonlySet<string>
  walletGoalNames?: ReadonlyMap<string, string[]>
}) {
  const { t } = useTranslation()

  const taken = new Set(value.map((row) => row.assetId))
  const available = assetOptions.filter((option) => !taken.has(option.value))

  /**
   * Assets behind the goal, but none of them a wallet.
   *
   * A NOTICE, never an error. The server stopped refusing this — deleting an
   * asset can leave a goal in exactly this state — so a form-only rule would
   * just block editing the goal back into legality. The consequence is stated
   * instead: nothing is paid into gold on a schedule, so the pace panel stays
   * empty until a cash or bank account joins it.
   */
  const missingWallet =
    value.length > 0 &&
    !value.some((row) =>
      isWalletAssetType(assetOptions.find((option) => option.value === row.assetId)?.type),
    )

  function update(index: number, patch: Partial<GoalAllocationDraft>) {
    onChange(value.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }

  return (
    <View>
      {error ? (
        <View className="mb-3 rounded-sunk bg-sunk p-3.5">
          <Text className="text-[12px] leading-5 text-alert">{error}</Text>
        </View>
      ) : null}

      {missingWallet ? (
        <CaveatNote className="mb-3">{t('goals.form.walletMissingNotice')}</CaveatNote>
      ) : null}

      <View className="gap-3">
        {value.map((row, index) => {
          const asset = assetOptions.find((option) => option.value === row.assetId)
          const wallet = isWalletAssetType(asset?.type)
          const contested = contestedWalletIds?.has(row.assetId) ?? false
          // A contribution share is always a plain amount: a wallet has no
          // market price, so "a share of whatever it is worth" says nothing.
          const kind = row.role === 'contribution' ? 'fixed' : row.kind

          return (
            <Sunk key={row.assetId}>
              <View className="flex-row items-start gap-2">
                <View className="flex-1">
                  <Text className="text-[14px] font-medium text-ink" numberOfLines={1}>
                    {asset?.name ?? row.assetId}
                  </Text>
                  <Text
                    className="mt-0.5 text-[11px] text-ink3"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {t('goals.allocations.assetHolds', {
                      value: formatAmount(asset?.balance ?? 0),
                    })}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onChange(value.filter((_, rowIndex) => rowIndex !== index))}
                  accessibilityRole="button"
                  accessibilityLabel={t('goals.allocations.remove')}
                  style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
                  className="-mr-2 -mt-2 items-end justify-center"
                >
                  <X size={16} color={colors.ink3} strokeWidth={1.75} />
                </Pressable>
              </View>

              {wallet ? (
                <Segmented
                  className="mt-4"
                  label={t('goals.builder.useAssetFor')}
                  value={row.role}
                  onChange={(role) =>
                    update(index, {
                      role,
                      kind: role === 'contribution' ? 'fixed' : row.kind,
                      percent: role === 'contribution' ? '' : row.percent || '25',
                      monthlyContribution:
                        role === 'contribution' ? row.monthlyContribution || '5000000' : '',
                      sharePercent: role === 'contribution' ? row.sharePercent || '50' : '',
                    })
                  }
                  options={[
                    { value: 'contribution', label: t('goals.builder.contributeMonthly') },
                    { value: 'holding', label: t('goals.builder.countCurrent') },
                  ]}
                />
              ) : (
                <Text className="mt-3 text-[11px] leading-4 text-ink3">
                  {t('goals.builder.marketHoldingOnly')}
                </Text>
              )}

              {row.role === 'contribution' ? (
                <>
                  {/* Two numbers, two questions — which is why both carry a
                      label here and nowhere else. Stacked unlabelled they read
                      as the same question asked twice. */}
                  <MoneyInput
                    className="mt-4"
                    label={t('goals.builder.monthlyShort')}
                    value={row.monthlyContribution}
                    onChange={(monthlyContribution) => update(index, { monthlyContribution })}
                  />
                  <MoneyInput
                    className="mt-3"
                    label={t('goals.builder.alreadySetAside')}
                    value={row.amount}
                    onChange={(amount) => update(index, { amount })}
                  />

                  {/* This wallet already feeds another goal at the SAME
                      priority — the tie `priority` cannot break. Asked now
                      rather than when the money runs out: by then the split has
                      been guessed at, and the guess is what they would be
                      correcting. */}
                  {contested ? (
                    <View className="mt-3 rounded-sunk bg-attention-soft p-3.5">
                      <Text className="text-[12px] font-medium text-attention">
                        {t('goals.builder.sharedWallet')}
                      </Text>
                      <Text className="mt-1 text-[11px] leading-4 text-attention">
                        {t('goals.builder.samePriorityWith', {
                          goals: (walletGoalNames?.get(row.assetId) ?? []).join(', '),
                        })}
                      </Text>
                      <PercentInput
                        className="mt-3"
                        label={t('goals.allocations.shareLabel')}
                        value={row.sharePercent}
                        onChange={(sharePercent) => update(index, { sharePercent })}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <Segmented
                    className="mt-4"
                    value={kind}
                    onChange={(next) => update(index, { kind: next })}
                    options={[
                      { value: 'fixed', label: t('goals.allocations.kindFixed') },
                      { value: 'percent', label: t('goals.allocations.kindPercent') },
                    ]}
                  />
                  {kind === 'fixed' ? (
                    <MoneyInput
                      className="mt-3"
                      label={t('goals.builder.countTowardGoal')}
                      value={row.amount}
                      onChange={(amount) => update(index, { amount })}
                    />
                  ) : (
                    <PercentInput
                      className="mt-3"
                      label={t('goals.builder.assetValuePercent')}
                      value={row.percent}
                      onChange={(percent) => update(index, { percent })}
                    />
                  )}
                  {!wallet ? (
                    <Text className="mt-2 text-[11px] leading-4 text-ink3">
                      {t('goals.allocations.holdingNote')}
                    </Text>
                  ) : null}
                </>
              )}
            </Sunk>
          )
        })}

        {/* The picker. Each asset is one 44pt row rather than a grid of cards:
            the household is choosing from a short list, and a card layout on a
            375pt screen buys nothing a row does not. */}
        <View>
          <Text className="text-[14px] font-medium text-ink">{t('goals.builder.addSource')}</Text>
          <Text className="mt-0.5 text-[11px] text-ink3">
            {available.length > 0
              ? t('goals.builder.availableSources', { count: available.length })
              : t('goals.builder.allSourcesUsed')}
          </Text>

          {available.length === 0 ? (
            <Text className="mt-3 text-[12px] text-ink3">{t('goals.builder.noMoreSources')}</Text>
          ) : (
            <View className="mt-2 gap-1">
              {available.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => onChange([...value, emptyAllocation(option)])}
                  accessibilityRole="button"
                  accessibilityLabel={option.name}
                  style={{ minHeight: TOUCH_TARGET }}
                  className="flex-row items-center gap-3 rounded-sunk bg-sunk px-3.5 active:opacity-80"
                >
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-ink" numberOfLines={1}>
                      {option.name}
                    </Text>
                    <Text
                      className="mt-0.5 text-[11px] text-ink3"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatAmount(option.balance)}
                    </Text>
                  </View>
                  <Plus size={16} color={colors.interactive} strokeWidth={1.75} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

/**
 * A fresh draft row for a chosen asset.
 *
 * The role is seeded from the asset type — a wallet is what money is
 * contributed through — but it is only a default: a household with a spending
 * wallet and a savings wallet must be able to say only the second feeds this
 * goal, which is what the role control above is for.
 */
function emptyAllocation(option: AllocationAssetOption): GoalAllocationDraft {
  const role = defaultAllocationRole(option.type)
  return {
    assetId: option.value,
    role,
    kind: role === 'contribution' ? 'fixed' : 'percent',
    amount: '',
    percent: role === 'holding' ? '25' : '',
    monthlyContribution: role === 'contribution' ? '5000000' : '',
    sharePercent: '50',
  }
}

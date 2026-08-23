import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react-native'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { computeSpendImpact } from '@money-space/core/features/goals/model/spend-impact'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { Sunk } from '@/components/ui'
import { SpendImpactBar } from '@/features/cashflow/ui/spend-impact-bar'
import { colors } from '@/theme/tokens'

/**
 * What this outflow takes from the goals saving into the chosen wallet.
 *
 * An outflow OUTRANKS the goals sharing its wallet: the money does not vanish
 * from the household's picture, it stops being goal money. That trade is real
 * and it used to happen silently — the goal screen simply read lower afterwards
 * with nothing connecting it to the bill someone had scheduled.
 *
 * **This form is the only place that explains it**, so the explanation must not
 * wait on a request. Every figure comes from core's `computeSpendImpact`, which
 * mirrors the server and runs LOCALLY off the goal-usage data the wallet picker
 * already loaded — so the notice appears as the amount is typed. Nothing here
 * is re-derived; whatever `computeSpendImpact` returns is what is rendered.
 *
 * ## The shape on a phone
 *
 * The web block runs headline → bar → two before/after rows → per-goal list →
 * two explanation lines. On a 375pt screen that is a scroll of its own between
 * the amount field and the save button, and a block long enough to skim past
 * has warned nobody. So this keeps the three parts that carry the mechanism —
 * the spend, the bar that shows which half pays, and the one sentence that says
 * why — and folds the before/after into a single row for the figure that
 * actually moved.
 *
 * Deliberately NOT a warning, NOT a block, and it never gates the submit button
 * (§22.10). The household may well go ahead; a bill is a bill. This states a
 * consequence and never a recommendation (Voice: never "you should not spend").
 * Set-aside money is `--attention`, never `--alert` — scheduling a bill is not
 * an error (§16).
 */
export function GoalImpactNotice({
  assetId,
  amount,
  className,
}: {
  assetId?: string
  amount?: number
  className?: string
}) {
  const { t } = useTranslation()
  const { items, assetValue, claimedAmount, unassignedAmount } = useAssetGoalUsage(assetId)
  const { assets } = useAssets()

  // Nothing to say when no goal saves into this wallet: spending from it costs
  // no goal anything, at any amount.
  if (!assetId || claimedAmount <= 0) return null

  const impact = computeSpendImpact(items, assetValue, amount ?? 0)

  // A wallet backing a goal, before an amount exists. State the mechanism in
  // words so the household knows what the wallet does before choosing a number.
  if (impact.totalReduction <= 0) {
    return (
      <Sunk className={className}>
        <Text className="text-[14px] leading-5 text-ink2">
          {t('upcoming.complete.goalImpact.pending')}
        </Text>
      </Sunk>
    )
  }

  const reachesSetAside = impact.totalSetAsideReduction > 0
  const walletName = assets.find((asset) => asset.id === assetId)?.name ?? ''
  // One goal is the common case, so the per-goal breakdown only earns its lines
  // when the wallet feeds several.
  const showPerGoal = impact.goals.length > 1

  return (
    <Sunk className={className}>
      {/* The spend, and the one-phrase answer to where it comes from. */}
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[11px] text-ink3">
            {t('upcoming.complete.goalImpact.spendLabel')}
          </Text>
          <Text
            className="mt-1 text-[22px] font-medium text-ink"
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.66 }}
          >
            {formatVndShort(impact.totalReduction)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-ink3">
            {t('upcoming.complete.goalImpact.takenFrom')}
          </Text>
          <Text
            className={`mt-1 text-[14px] font-medium ${
              reachesSetAside ? 'text-attention' : 'text-interactive'
            }`}
          >
            {reachesSetAside
              ? t('upcoming.complete.goalImpact.twoSources')
              : t('upcoming.complete.goalImpact.paceOnly')}
          </Text>
        </View>
      </View>

      {/* The spend divided across its sources — the mechanism, drawn. */}
      <SpendImpactBar
        className="mt-4"
        fromPace={impact.totalPaceReduction}
        fromSetAside={impact.totalSetAsideReduction}
        formatAmount={formatVndShort}
      />

      {/* A legend only when there are two slices to tell apart. */}
      {reachesSetAside && impact.totalPaceReduction > 0 ? (
        <View className="mt-2 gap-1">
          <LegendItem
            fill={colors.interactive}
            label={t('upcoming.complete.goalImpact.legendPace')}
          />
          <LegendItem
            fill={colors.attention}
            label={t('upcoming.complete.goalImpact.legendSetAside')}
          />
        </View>
      ) : null}

      {/* Only what actually moved. A spend inside this month's contribution
          leaves the goal's own total untouched, and "303,6 → 303,6" would
          manufacture a consequence. */}
      <View className="mt-4 gap-3">
        <ChangeRow
          label={t('upcoming.complete.goalImpact.paceRemainingLabel')}
          before={formatVndShort(impact.totalPaceBefore)}
          after={formatVndShort(Math.max(0, impact.totalPaceBefore - impact.totalPaceReduction))}
        />
        {reachesSetAside ? (
          <ChangeRow
            label={t('upcoming.complete.goalImpact.goalTotalLabel')}
            before={formatVndShort(impact.totalSetAsideBefore)}
            after={formatVndShort(
              Math.max(0, impact.totalSetAsideBefore - impact.totalSetAsideReduction),
            )}
            delta={`−${formatVndShort(impact.totalSetAsideReduction)}`}
          />
        ) : null}
      </View>

      {/* Which goal pays what, when the wallet feeds more than one. Never
          `before → after` per goal: the same pair appears whether the monthly
          contribution moved or money was taken back out, and only the second is
          the goal going backwards. Name the part that shrank instead. */}
      {showPerGoal ? (
        <View className="mt-4 gap-1">
          {impact.goals.map((goal) => (
            <View key={goal.goalId} className="flex-row items-baseline justify-between gap-3">
              <Text className="flex-1 text-[12px] text-ink2" numberOfLines={1}>
                {goal.goalName}
              </Text>
              <Text
                className="shrink-0 text-[12px] text-ink2"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {goal.setAsideReduction > 0 && goal.paceReduction > 0
                  ? t('upcoming.complete.goalImpact.goalBoth', {
                      pace: formatVndShort(goal.paceReduction),
                      setAside: formatVndShort(goal.setAsideReduction),
                    })
                  : t(
                      goal.setAsideReduction > 0
                        ? 'upcoming.complete.goalImpact.goalSetAsideShort'
                        : 'upcoming.complete.goalImpact.goalPaceShort',
                      { amount: formatVndShort(goal.reduction) },
                    )}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* The sentence that explains the whole thing. */}
      <Text className="mt-3 text-[12px] leading-5 text-ink2">
        {reachesSetAside
          ? t('upcoming.complete.goalImpact.explainSetAside', {
              pace: formatVndShort(impact.totalPaceReduction),
              setAside: formatVndShort(impact.totalSetAsideReduction),
            })
          : t('upcoming.complete.goalImpact.explainPace')}
      </Text>

      {/* Why a wallet with money in it still costs a goal. `unassignedAmount`,
          not `freeAmount`: the latter only subtracts what is set aside, so it
          would claim money is free directly above lines showing that same money
          coming out of the goals. */}
      <Text className="mt-2 text-[12px] leading-5 text-ink3">
        {t(
          unassignedAmount > 0
            ? 'upcoming.complete.goalImpact.subtitleSomeFree'
            : 'upcoming.complete.goalImpact.subtitle',
          {
            wallet: walletName,
            value: formatVndShort(assetValue),
            free: formatVndShort(unassignedAmount),
          },
        )}
      </Text>

      {/* A shortfall is a different fact from "your goal shrinks", so it gets
          its own line rather than being folded into anything above. */}
      {impact.exceedsWallet ? (
        <Text className="mt-2 text-[12px] leading-5 text-alert">
          {t('upcoming.complete.goalImpact.exceedsWallet', {
            value: formatVndShort(impact.assetValue),
          })}
        </Text>
      ) : null}
    </Sunk>
  )
}

/** One before → after pair. The arrow carries the direction, so no word has to. */
function ChangeRow({
  label,
  before,
  after,
  delta,
}: {
  label: string
  before: string
  after: string
  delta?: string
}) {
  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="flex-1 text-[11px] text-ink3">{label}</Text>
        {delta ? (
          <Text
            className="text-[12px] font-medium text-attention"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {delta}
          </Text>
        ) : null}
      </View>
      {/* Money never truncates, so the pair wraps rather than ellipsing. */}
      <View className="mt-1 flex-row flex-wrap items-center gap-2">
        <Text className="text-[14px] text-ink3" style={{ fontVariant: ['tabular-nums'] }}>
          {before}
        </Text>
        <ArrowRight size={14} color={colors.ink3} strokeWidth={1.5} />
        <Text
          className="text-[16px] font-medium text-ink"
          style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.48 }}
        >
          {after}
        </Text>
      </View>
    </View>
  )
}

function LegendItem({ fill, label }: { fill: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: fill }} />
      <Text className="flex-1 text-[11px] text-ink2">{label}</Text>
    </View>
  )
}

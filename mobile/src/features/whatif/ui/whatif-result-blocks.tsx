import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react-native'

import type {
  AssumptionCode,
  CalculationAssumption,
} from '@money-space/core/features/forecast/model/forecast.types'
import type {
  WhatIfResult,
  WhatIfResultType,
} from '@money-space/core/features/whatif/model/whatif.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

import { SubSection } from '@/components/ui'
import { SpendImpactBar } from '@/features/cashflow/ui/spend-impact-bar'
import { AssumptionsNote, formatFullDate } from '@/features/forecast'
import { colors } from '@/theme/tokens'

/**
 * The result, in the **mandated order** (memory/what-if.md):
 *   Upcoming Safety → Goal consequence → Assumptions.
 *
 * Every block reports CONSEQUENCE and nothing else. None of them says whether
 * to buy — no "bạn nên / không nên mua", no recommendation, no verdict.
 * `resultType` only picks a colour, and that is the whole of its job here.
 *
 * The web renders the same three blocks; the differences are the phone's:
 * before → after stacks into a wrapping row rather than a single line, because
 * money must never truncate and two figures plus an arrow do not fit at 335pt
 * beside a label. Dates go through `formatFullDate` — the web prints the raw
 * ISO string, which reads as machine output next to Vietnamese copy.
 */
export function WhatIfResultBlocks({ result }: { result: WhatIfResult }) {
  const { t } = useTranslation()
  const { before, after, delta } = result

  return (
    <View className="gap-3">
      {/* 1 — Upcoming Safety. NEVER labelled a spending allowance. */}
      <SubSection label={t('whatif.blocks.upcomingSafety')}>
        {/* Negative is never hidden and never clamped — it is the answer. */}
        <ChangeRow
          label={t('whatif.lowestBalance')}
          before={formatMoney(before.lowestProjectedBalance)}
          after={formatMoney(after.lowestProjectedBalance)}
          afterColor={RESULT_TYPE_COLOR[result.resultType]}
        />

        <Text className="mt-2 font-mono text-[12px] leading-5 text-ink3">
          {t('whatif.lowestBalanceOn', {
            date: formatFullDate(after.lowestProjectedBalanceDate),
          })}
        </Text>
        <Text className="mt-1 text-[12px] leading-5 text-ink2">
          {t('whatif.flexibleDelta', {
            amount: formatMoney(Math.abs(delta.lowestProjectedBalance)),
          })}
        </Text>

        {/* WHICH items stop being payable, not just that something does.
            "Some fixed items would not be fully covered" is enough to worry
            someone and not enough to act on: they cannot move a bill or top up
            an account without knowing which bill and when. Only items this
            spend actually breaks are listed — one already going unpaid is not
            this purchase's doing. */}
        {result.newlyAtRisk.length > 0 ? (
          <View className="mt-3">
            <Text className="text-[13px] font-medium text-attention">
              {t('whatif.blocks.atRisk')}
            </Text>
            <View className="mt-1.5 gap-1">
              {result.newlyAtRisk.map((item) => (
                <Text key={item.occurrenceKey} className="text-[12px] leading-5 text-ink2">
                  {t('whatif.blocks.atRiskRow', {
                    date: formatFullDate(item.date),
                    name: item.name,
                    amount: formatMoney(item.shortfall),
                  })}
                </Text>
              ))}
            </View>
          </View>
        ) : !after.obligationsCovered ? (
          // Something is short, but this spend did not cause it — say so
          // without attaching a list that would misattribute the blame.
          <Text className="mt-3 text-[13px] leading-5 text-attention">
            {t('whatif.obligations.notCovered')}
          </Text>
        ) : null}
      </SubSection>

      {/* 2 — What the goals give up: money AND time, per goal.
          Measured across every flexible wallet — what-if names no single one,
          so the spend takes genuinely free money first and only then reaches
          the least-promised wallet's goals. */}
      {result.goalImpact.totalReduction > 0 ? (
        <SubSection label={t('whatif.blocks.goalCost')}>
          {/* The money simply not being there is a different fact from a goal
              giving way, so it gets its own line rather than being folded into
              the per-goal list. */}
          {result.goalImpact.uncovered > 0 ? (
            <Text className="mb-2.5 text-[13px] leading-5 text-alert">
              {t('whatif.blocks.uncovered', {
                amount: formatMoney(result.goalImpact.uncovered),
              })}
            </Text>
          ) : null}

          {/* The same bar the cashflow form uses: what this spend costs the
              goals, split across where it comes from — this month's
              contribution first, money already set aside only once that is
              gone. The order IS the rule, and the bar states it without a
              sentence. */}
          <SpendImpactBar
            fromPace={result.goalImpact.totalPaceReduction}
            fromSetAside={result.goalImpact.totalSetAsideReduction}
            formatAmount={formatMoney}
          />

          {/* A legend only when there are two slices to tell apart. */}
          {result.goalImpact.totalPaceReduction > 0 &&
          result.goalImpact.totalSetAsideReduction > 0 ? (
            <View className="mt-2 gap-1">
              <LegendItem
                fill={colors.interactive}
                label={t('whatif.blocks.goalCostFromPace')}
              />
              <LegendItem
                fill={colors.attention}
                label={t('whatif.blocks.goalCostFromSetAside')}
              />
            </View>
          ) : null}

          <View className="mt-3 gap-2">
            {result.goalImpact.goals.map((goal) => (
              <View key={goal.goalId}>
                <Text className="text-[13px] leading-5 text-ink">
                  {t('whatif.blocks.goalCostRow', {
                    name: goal.goalName ?? '—',
                    amount: formatMoney(goal.reduction),
                  })}
                </Text>
                {/* The time cost is the half that decides anything: "giảm 3tr"
                    says what leaves, "chậm 2 tháng" says what it costs. `null`
                    months means the goal declared no pace — there is no honest
                    way to turn money into time without a rate, so the line is
                    simply absent rather than guessed at. */}
                {goal.delayMonths !== null && goal.delayMonths > 0 ? (
                  <Text className="mt-0.5 text-[12px] leading-5 text-ink2">
                    {goal.delayMonths >= 1
                      ? t('whatif.blocks.goalDelayRow', {
                          name: goal.goalName ?? '—',
                          months: Math.round(goal.delayMonths * 10) / 10,
                        })
                      : t('whatif.blocks.goalDelayDays', {
                          name: goal.goalName ?? '—',
                          days: goal.delayDays ?? 0,
                        })}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </SubSection>
      ) : null}

      {/* 3 — Goal consequence for the ONE goal the household picked, when they
          picked one. Distinct from the block above, which covers every goal the
          settling wallet backs. */}
      {after.goal ? (
        <SubSection label={t('whatif.blocks.goal')}>
          <Text className="text-[13px] leading-5 text-ink">
            {delta.goalDelayMonths !== null && delta.goalDelayMonths !== 0
              ? t('whatif.goal.delay', { count: Math.abs(delta.goalDelayMonths) })
              : t('whatif.goal.noChange')}
          </Text>
          {after.goal.projectedCompletionDate ? (
            <Text className="mt-1.5 text-[12px] leading-5 text-ink2">
              {t('whatif.goal.projectedDate', {
                date: formatFullDate(after.goal.projectedCompletionDate),
              })}
            </Text>
          ) : null}
        </SubSection>
      ) : null}

      {/* 4 — Assumptions. Every derived number must be explainable. */}
      <AssumptionsNote assumptions={whatIfAssumptions(result.assumptions)} />
    </View>
  )
}

/**
 * STYLING ONLY (invariant 3). Core's `RESULT_TYPE_CLASS` is web Tailwind and
 * names `text-accent`, a class v4.2 renamed to `interactive` and which does not
 * exist in the mobile config — so the same three tones are resolved here to
 * theme colours. The mapping is a palette lookup and decides nothing.
 */
const RESULT_TYPE_COLOR: Record<WhatIfResultType, string> = {
  comfortable: colors.interactive,
  tight: colors.attention,
  not_covered: colors.alert,
}

/**
 * Assumptions that describe how the FORECAST is built rather than what this
 * particular purchase changes.
 *
 * The horizon, the same-day ordering of outflows and the fact that planned
 * outflows are still subtracted are all true of every number the app shows —
 * they belong on `Sắp tới`, where the forecast itself is the subject. Here the
 * reader asked one question about one purchase, and repeating the standing
 * rules of the engine buries the two or three lines that actually answer it.
 *
 * What survives is anything CONDITIONAL — stale sources, no confirmed inflow,
 * estimated income held back — because those qualify this answer.
 */
// Typed as `AssumptionCode` so renaming a code upstream breaks the build here
// rather than silently leaving the line on screen.
const FORECAST_WIDE_ASSUMPTIONS = new Set<AssumptionCode>([
  'horizon_days',
  'same_day_outflows_ordered_first',
  'planned_outflows_included',
])

function whatIfAssumptions(assumptions: CalculationAssumption[]): CalculationAssumption[] {
  return assumptions.filter((assumption) => !FORECAST_WIDE_ASSUMPTIONS.has(assumption.code))
}

/**
 * One before → after pair. The arrow carries the direction, so no word has to.
 *
 * The pair WRAPS rather than shrinking or ellipsing: money never truncates, and
 * "-12.400.000đ" beside "48.200.000đ" does not fit one 335pt line.
 */
function ChangeRow({
  label,
  before,
  after,
  afterColor,
}: {
  label: string
  before: string
  after: string
  afterColor: string
}) {
  return (
    <View>
      <Text className="text-[12px] text-ink3">{label}</Text>
      <View className="mt-1 flex-row flex-wrap items-center gap-2">
        <Text className="text-[14px] text-ink3" style={{ fontVariant: ['tabular-nums'] }}>
          {before}
        </Text>
        <ArrowRight size={14} color={colors.ink3} strokeWidth={1.5} />
        <Text
          className="text-[20px] font-medium"
          style={{
            color: afterColor,
            fontVariant: ['tabular-nums'],
            letterSpacing: -0.6,
          }}
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

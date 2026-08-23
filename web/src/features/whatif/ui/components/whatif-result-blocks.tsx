import { useTranslation } from 'react-i18next'

import { SubSection } from '@/components/ui/sub-section'
import { AssumptionsNote } from '@/features/forecast/ui/components/assumptions-note'
import { SpendImpactBar } from '@/features/cashflow/ui/components/spend-impact-bar'
import { RESULT_TYPE_CLASS, type WhatIfResult } from '@money-space/core/features/whatif/model/whatif.types'
import type {
  AssumptionCode,
  CalculationAssumption,
} from '@money-space/core/features/forecast/model/forecast.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The result blocks, in the **mandated order** (§26D):
 *   Upcoming Safety → Goal consequence → Assumptions.
 *
 * §26D used to mandate five. Two went with the protected reserve: "Reserve
 * impact" had nothing left to report, and "Flexible before/after" was showing
 * `lowestProjectedBalance` under a second name — the same two numbers as the
 * block above it. So the first block absorbed what survived: the delta sentence
 * and the "obligations not covered" line, which is about coverage, not the
 * reserve, and would otherwise have been deleted along with its container.
 *
 * Every block reports CONSEQUENCE. None of them says whether to buy — no
 * "bạn nên / không nên mua", no recommendation, no verdict. `resultType` only
 * picks a colour.
 */
export function WhatIfResultBlocks({ result }: { result: WhatIfResult }) {
  const { t } = useTranslation()
  const { before, after, delta } = result

  return (
    <div className="space-y-3">
      {/* 1 — Upcoming Safety. NEVER labelled a spending allowance. */}
      <SubSection title={t('whatif.blocks.upcomingSafety')}>
        <Row
          label={t('whatif.lowestBalance')}
          before={formatVndShort(before.lowestProjectedBalance)}
          after={formatVndShort(after.lowestProjectedBalance)}
          // Negative is never hidden — it is the answer.
          afterClassName={RESULT_TYPE_CLASS[result.resultType]}
        />
        <p className="mt-2 text-xs text-ink2">
          {t('whatif.lowestBalanceOn', { date: after.lowestProjectedBalanceDate })}
        </p>
        <p className="mt-2 text-xs text-ink2">
          {t('whatif.flexibleDelta', {
            amount: formatVndShort(Math.abs(delta.lowestProjectedBalance)),
          })}
        </p>
        {/* WHICH items stop being payable, not just that something does.
            "Some fixed items would not be fully covered" is enough to worry
            someone and not enough to act on: they cannot move a bill or top up
            an account without knowing which bill and when. Only items this
            spend actually breaks are listed — one already going unpaid is not
            this purchase's doing. */}
        {result.newlyAtRisk.length > 0 ? (
          <div className="mt-2">
            <p className="text-sm text-attention">
              {t('whatif.blocks.atRisk')}
            </p>
            <ul className="mt-1 space-y-0.5">
              {result.newlyAtRisk.map((item) => (
                <li
                  key={item.occurrenceKey}
                  className="text-xs leading-5 text-ink2"
                >
                  {t('whatif.blocks.atRiskRow', {
                    date: item.date,
                    name: item.name,
                    amount: formatVndShort(item.shortfall),
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : !after.obligationsCovered ? (
          // Something is short, but this spend did not cause it — say so
          // without attaching a list that would misattribute the blame.
          <p className="mt-2 text-sm text-attention">
            {t('whatif.obligations.notCovered')}
          </p>
        ) : null}
      </SubSection>

      {/* 2 — What the goals give up: money AND time, per goal.
          Measured across every flexible wallet — what-if names no single one,
          so the spend takes genuinely free money first and only then reaches
          the least-promised wallet's goals. */}
      {result.goalImpact.totalReduction > 0 ? (
        <SubSection title={t('whatif.blocks.goalCost')}>
          {/* The money simply not being there is a different fact from a goal
              giving way, so it gets its own line rather than being folded into
              the per-goal list. */}
          {result.goalImpact.uncovered > 0 ? (
            <p className="mb-2 text-sm text-alert">
              {t('whatif.blocks.uncovered', {
                amount: formatVndShort(result.goalImpact.uncovered),
              })}
            </p>
          ) : null}

          {/* The same bar the cashflow form uses: what this spend costs the
              goals, split across where it comes from — this month's
              contribution first, money already set aside only once that is
              gone. The order IS the rule, and the bar states it without a
              sentence. */}
          <SpendImpactBar
            className="mb-2.5"
            fromPace={result.goalImpact.totalPaceReduction}
            fromSetAside={result.goalImpact.totalSetAsideReduction}
            formatAmount={formatVndShort}
          />

          <ul className="space-y-1.5">
            {result.goalImpact.goals.map((goal) => (
              <li key={goal.goalId}>
                <p className="text-sm">
                  {t('whatif.blocks.goalCostRow', {
                    name: goal.goalName ?? '—',
                    amount: formatVndShort(goal.reduction),
                  })}
                </p>
                {/* The time cost is the half that decides anything: "giảm 3tr"
                    says what leaves, "chậm 2 tháng" says what it costs. */}
                {goal.delayMonths !== null && goal.delayMonths > 0 ? (
                  <p className="text-xs leading-5 text-ink2">
                    {goal.delayMonths >= 1
                      ? t('whatif.blocks.goalDelayRow', {
                          name: goal.goalName ?? '—',
                          months: Math.round(goal.delayMonths * 10) / 10,
                        })
                      : t('whatif.blocks.goalDelayDays', {
                          name: goal.goalName ?? '—',
                          days: goal.delayDays ?? 0,
                        })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SubSection>
      ) : null}

      {/* 3 — Goal consequence for the ONE goal the household picked, when they
          picked one. Distinct from the block above, which covers every goal the
          settling wallet backs. */}
      {after.goal ? (
        <SubSection title={t('whatif.blocks.goal')}>
          {delta.goalDelayMonths !== null && delta.goalDelayMonths !== 0 ? (
            <p className="text-sm">
              {t('whatif.goal.delay', { count: Math.abs(delta.goalDelayMonths) })}
            </p>
          ) : (
            <p className="text-sm">{t('whatif.goal.noChange')}</p>
          )}
          {after.goal.projectedCompletionDate ? (
            <p className="mt-2 text-xs text-ink2">
              {t('whatif.goal.projectedDate', {
                date: after.goal.projectedCompletionDate,
              })}
            </p>
          ) : null}
        </SubSection>
      ) : null}

      {/* 4 — Assumptions */}
      <AssumptionsNote assumptions={whatIfAssumptions(result.assumptions)} />
    </div>
  )
}

/**
 * Assumptions that describe how the FORECAST is built rather than what this
 * particular purchase changes.
 *
 * The horizon, the same-day ordering of outflows and the fact that planned
 * outflows are still subtracted are all true of every number the app shows —
 * they belong on `/upcoming`, where the forecast itself is the subject. Here
 * the reader asked one question about one purchase, and repeating the standing
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

function whatIfAssumptions(
  assumptions: CalculationAssumption[],
): CalculationAssumption[] {
  return assumptions.filter(
    (assumption) => !FORECAST_WIDE_ASSUMPTIONS.has(assumption.code),
  )
}

function Row({
  label,
  before,
  after,
  afterClassName,
}: {
  label: string
  before: string
  after: string
  afterClassName?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm text-ink2">{label}</p>
      <p className="money-number text-sm font-semibold">
        <span className="text-ink2">{before}</span>
        <span className="mx-2 text-ink2">
          {t('whatif.arrow')}
        </span>
        <span className={cn(afterClassName)}>{after}</span>
      </p>
    </div>
  )
}

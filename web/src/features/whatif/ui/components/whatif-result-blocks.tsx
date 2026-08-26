import { useTranslation } from 'react-i18next'

import { MetricCell } from '@/components/ui/metric-cell'
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
 * The result, ANSWER-FIRST.
 *
 * The blocks used to open with a before → after row: two figures the same size,
 * which made the reader do the subtraction before they could learn anything.
 * The one number they asked for — where the balance bottoms out if they spend
 * this — now leads at `t-hero`, with the date it happens directly beneath it and
 * the change from today set alongside as the secondary figure. Everything after
 * that qualifies the headline rather than competing with it.
 *
 * The order is still §26D's: Upcoming Safety → Goal consequence → Assumptions.
 * What changed is the WEIGHT inside the first block, not the sequence.
 *
 * Every block reports CONSEQUENCE. None of them says whether to buy — no
 * "bạn nên / không nên mua", no recommendation, no verdict. `resultType` only
 * picks a colour.
 */
export function WhatIfResultBlocks({ result }: { result: WhatIfResult }) {
  const { t } = useTranslation()
  const { before, after, delta } = result

  /**
   * The spend is the same figure on both sides of the question, so it is read
   * off the input rather than differenced out of two balances — a subtraction
   * that would drift the moment the engine's rounding did.
   */
  const spend = result.input.amount

  return (
    <div className="space-y-6">
      {/* 1 — Upcoming Safety. NEVER labelled a spending allowance. */}
      <section>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="t-body-sm text-ink2">{t('whatif.lowestBalance')}</p>
            {/* Negative is never hidden — it is the answer. */}
            <p
              className={cn(
                'money-number mt-1 whitespace-nowrap t-hero',
                RESULT_TYPE_CLASS[result.resultType],
              )}
            >
              {formatVndShort(after.lowestProjectedBalance)}
            </p>
            <p className="mt-2 t-caption leading-5 text-ink3">
              {t('whatif.lowestBalanceOn', {
                date: after.lowestProjectedBalanceDate,
              })}
            </p>
          </div>

          {/*
            The comparison the before → after row used to carry, kept as ONE
            figure. "Where it was" is only ever read as a distance from where it
            lands, so the distance is what gets stated.
          */}
          <div className="shrink-0 text-right">
            <p className="t-caption text-ink3">{t('whatif.delta.label')}</p>
            <p className="money-number mt-1 whitespace-nowrap t-subhead">
              {formatVndShort(delta.lowestProjectedBalance)}
            </p>
            <p className="mt-1 t-caption leading-5 text-ink3">
              {t('whatif.delta.from', {
                amount: formatVndShort(before.lowestProjectedBalance),
              })}
            </p>
          </div>
        </div>

        {/*
          Three facts that qualify the headline, at equal weight because none of
          them outranks the others (02-components §4 — metric cells at the same
          level share a treatment).
        */}
        <div className="mt-5 grid grid-cols-1 divide-y divide-divider border-y border-divider sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricCell
            className="py-4 sm:pr-4"
            label={t('whatif.metrics.spend')}
            value={formatVndShort(spend)}
            hint={t('whatif.metrics.spendHint', { date: result.input.plannedDate })}
          />
          <MetricCell
            className="py-4 sm:px-4"
            label={t('whatif.metrics.atRisk')}
            value={String(result.newlyAtRisk.length)}
            hint={t('whatif.metrics.atRiskHint')}
          />
          <MetricCell
            className="py-4 sm:pl-4"
            label={t('whatif.metrics.flexible')}
            value={formatVndShort(after.flexibleMoneyToday)}
            hint={t('whatif.metrics.flexibleHint')}
          />
        </div>

        {/* WHICH items stop being payable, not just that something does.
            "Some fixed items would not be fully covered" is enough to worry
            someone and not enough to act on: they cannot move a bill or top up
            an account without knowing which bill and when. Only items this
            spend actually breaks are listed — one already going unpaid is not
            this purchase's doing. */}
        {result.newlyAtRisk.length > 0 ? (
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="t-body-sm font-medium">{t('whatif.blocks.atRisk')}</p>
              <p className="t-caption text-ink3">
                {t('whatif.blocks.atRiskCount', {
                  count: result.newlyAtRisk.length,
                })}
              </p>
            </div>
            <ul className="mt-1">
              {result.newlyAtRisk.map((item) => (
                <li
                  key={item.occurrenceKey}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2"
                >
                  <span className="money-number t-caption text-ink2">{item.date}</span>
                  <span className="truncate t-body-sm">{item.name}</span>
                  <span className="money-number t-caption text-ink2">
                    {formatVndShort(item.shortfall)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-1 flex items-center gap-2 t-caption leading-5 text-ink2">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-attention"
              />
              {t('whatif.blocks.atRiskNote')}
            </p>
          </div>
        ) : !after.obligationsCovered ? (
          // Something is short, but this spend did not cause it — say so
          // without attaching a list that would misattribute the blame.
          <p className="mt-5 t-body-sm text-attention">
            {t('whatif.obligations.notCovered')}
          </p>
        ) : null}
      </section>

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
            <p className="mb-2 t-body-sm text-alert">
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
                <p className="t-body-sm">
                  {t('whatif.blocks.goalCostRow', {
                    name: goal.goalName ?? '—',
                    amount: formatVndShort(goal.reduction),
                  })}
                </p>
                {/* The time cost is the half that decides anything: "giảm 3tr"
                    says what leaves, "chậm 2 tháng" says what it costs. */}
                {goal.delayMonths !== null && goal.delayMonths > 0 ? (
                  <p className="t-caption leading-5 text-ink2">
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
            <p className="t-body-sm">
              {t('whatif.goal.delay', { count: Math.abs(delta.goalDelayMonths) })}
            </p>
          ) : (
            <p className="t-body-sm">{t('whatif.goal.noChange')}</p>
          )}
          {after.goal.projectedCompletionDate ? (
            <p className="mt-2 t-caption text-ink2">
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

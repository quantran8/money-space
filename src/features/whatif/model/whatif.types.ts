/**
 * What-if (spec §26D, 05 §5) — the feature people pay for.
 *
 * Three invariants the UI must respect:
 *
 * 1. **Nothing is persisted.** There is no scenarios table and there must not
 *    be one (§2.12). So: no "Save scenario" action, ever.
 * 2. **It is a READ.** A `view_summary` partner can run one even though it is a
 *    POST. Never gate it behind an `edit` capability.
 * 3. **It reports consequence, never a verdict.** The result says what changes;
 *    it never says whether to buy. `resultType` is for STYLING only — never
 *    render it as "bạn nên / không nên mua".
 */
import type { CalculationAssumption } from '@/features/forecast/model/forecast.types'
import type { GoalProjection } from '@/features/goals/model/goal-projection.types'

/**
 * `watch` is gone with the protected reserve: it fired only when the low point
 * stayed positive but dipped under the reserve, and that condition no longer
 * exists. Reviving it would mean inventing a threshold the household never gave
 * us.
 */
export type WhatIfResultType = 'comfortable' | 'tight' | 'not_covered'

export type WhatIfRequest = {
  /** Must be positive. */
  amount: number
  /** Must fall inside the forecast horizon. */
  plannedDate: string
  /** Optional: show the time cost against a specific goal. */
  goalId?: string
  label?: string
  /**
   * `true` when the money comes straight out of what is saved for the goal (so
   * `currentAmount` drops); `false` when it displaces future contributions.
   */
  takeFromGoal?: boolean
  horizonDays?: number
}

export type WhatIfSideResult = {
  flexibleMoneyToday: number
  /** The horizon figure — what the household can spend without going negative. */
  lowestProjectedBalance: number
  lowestProjectedBalanceDate: string
  obligationsCovered: boolean
  goal: GoalProjection | null
}

export type WhatIfResult = {
  householdId: string
  asOfDate: string
  horizonDays: number
  input: WhatIfRequest
  obligationsCovered: boolean
  before: WhatIfSideResult
  after: WhatIfSideResult
  delta: {
    flexibleMoneyToday: number
    lowestProjectedBalance: number
    goalDelayMonths: number | null
    goalDelayDays: number | null
  }
  /** STYLING ONLY. Never rendered as advice. */
  resultType: WhatIfResultType
  assumptions: CalculationAssumption[]
}

/** Calm tone mapping. `not_covered` is the only one that earns red. */
export const RESULT_TYPE_CLASS: Record<WhatIfResultType, string> = {
  comfortable: 'text-accent',
  tight: 'text-attention',
  not_covered: 'text-alert',
}

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
import type { CalculationAssumption } from '#/features/forecast/model/forecast.types'
import type { GoalProjection } from '#/features/goals/model/goal-projection.types'

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

/** One goal's cost, in money AND in time. */
export type WhatIfGoalCost = {
  goalId: string
  goalName: string | null
  before: number
  after: number
  reduction: number
  /** Which half gave way: this month's contribution, or money set aside. */
  paceReduction: number
  setAsideReduction: number
  /**
   * How much later the goal lands. `null` when it declared no monthly pace —
   * without a rate there is no honest way to turn money into time.
   */
  delayMonths: number | null
  delayDays: number | null
  completionDateBefore: string | null
  completionDateAfter: string | null
}

export type WhatIfGoalImpact = {
  totalReduction: number
  totalPaceReduction: number
  totalSetAsideReduction: number
  goals: WhatIfGoalCost[]
  /**
   * The part of the spend no wallet could cover — the money simply is not
   * there. Distinct from an obligation going unpaid because of it.
   */
  uncovered: number
}

/** One wallet's part in paying for the spend. */
export type WhatIfWalletDraw = {
  assetId: string
  name: string
  /** What the wallet held before the spend. */
  before: number
  /** Taken from this wallet. Always > 0 — untouched wallets are not listed. */
  taken: number
}

/**
 * Where the money comes from, in two vocabularies.
 *
 * The semantic split (`free` / `fromPace` / `fromSetAside`) leads: it answers
 * "did this cost me anything that was promised", which is what decides whether
 * a purchase feels affordable. The wallet list is literal and secondary — the
 * household named no wallet, the simulation chose — so it belongs behind a
 * disclosure, never in the headline.
 *
 * The three amounts sum to the COVERED part of the spend. A shortfall stays in
 * `goalImpact.uncovered`, which is a different fact with its own line.
 */
export type WhatIfFundingSource = {
  /** Money no goal had claimed. Spent first, everywhere. */
  free: number
  fromPace: number
  fromSetAside: number
  /** Wallets that gave money up, most-drained first. */
  wallets: WhatIfWalletDraw[]
}

/** An obligation the spend would leave uncovered. */
export type WhatIfAtRisk = {
  occurrenceKey: string
  sourceEventId: string
  name: string
  date: string
  amount: number
  balanceAfter: number
  /** How much is missing for THIS item. */
  shortfall: number
}

export type WhatIfResult = {
  householdId: string
  asOfDate: string
  horizonDays: number
  input: WhatIfRequest
  obligationsCovered: boolean
  before: WhatIfSideResult
  after: WhatIfSideResult
  /**
   * What every goal gives up, in money AND in time.
   *
   * Measured across all flexible wallets: what-if asks a household-level
   * question and names no wallet, so the spend is taken from genuinely free
   * money first, then from the least-promised wallet onwards.
   */
  goalImpact: WhatIfGoalImpact
  /**
   * Where the spend comes from. Derived from the same drain as `goalImpact`,
   * so the two can never disagree about what one spend costs.
   */
  fundingSource: WhatIfFundingSource
  /**
   * Obligations this spend breaks, named. Only the ones it actually breaks —
   * an item already going unpaid is not this purchase's doing.
   */
  newlyAtRisk: WhatIfAtRisk[]
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

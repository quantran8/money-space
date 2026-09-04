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

/**
 * The wallet a household without one names as the destination.
 *
 * A household that tracks gold and stocks but no bank account has no
 * `usable_now` asset to receive proceeds — and used to hit a form it could not
 * complete. This sentinel says "the cash exists but sits in no account yet",
 * which is the truth of a sale that has only been imagined: it raises usable
 * money that no goal is standing in front of.
 */
export const UNASSIGNED_WALLET_ID = '__unassigned__'

/**
 * One line of the optional second step: selling part of an asset.
 *
 * A hypothesis, never a transaction — no `asset_sale` money event is created.
 * A market asset is sold in its own unit (6 chỉ, not "86,4tr of gold").
 */
export type WhatIfAssetSaleLine = {
  assetId: string
  /** Gross proceeds. A hypothetical carries no fee. */
  amount: number
}

/**
 * The funding step: sell parts of one or more assets to cover the spend.
 *
 * Several lines, because one holding often is not enough: short 500tr with
 * 300tr of gold and 250tr of stocks, a single-asset step is a form with no
 * completable answer. The proceeds share ONE destination — a household selling
 * two things to pay for one thing banks the cash together — so `toAssetId`
 * sits at this level rather than on each line.
 */
export type WhatIfAssetSale = {
  lines: WhatIfAssetSaleLine[]
  /**
   * The wallet the proceeds land in. Must be `usable_now`, or
   * `UNASSIGNED_WALLET_ID` when the household holds no such wallet.
   */
  toAssetId: string
}

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
  /** Optional step 2. Absent = the simulation behaves exactly as before. */
  assetSale?: WhatIfAssetSale
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
  /**
   * What the wallet held on its OWN before the spend — sale proceeds excluded,
   * so a 13tr wallet never reads as having paid 100tr.
   */
  before: number
  /** Taken from this wallet. Always > 0 — untouched wallets are not listed. */
  taken: number
  /** How much of `taken` was money the simulated sale put here. */
  fromSale?: number
}

/**
 * Where the money comes from, in two vocabularies.
 *
 * The semantic split (`free` / `fromPace` / `fromSetAside`) leads: it answers
 * "did this cost me anything that was promised", which is what decides whether
 * a purchase feels affordable. The wallet list is literal and secondary — the
 * household names no wallet for the SPEND, the simulation chooses — so it
 * belongs behind a disclosure, never in the headline.
 *
 * The three amounts sum to the COVERED part of the spend. A shortfall stays in
 * `goalImpact.uncovered`, which is a different fact with its own line.
 */
export type WhatIfFundingSource = {
  /**
   * Proceeds of the simulated sale. Its own category: folding it into `free`
   * would report a wallet as covering a spend it could not have.
   */
  fromSale?: number
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

/**
 * What the spend needs, against money usable TODAY.
 *
 * `shortfall` is not `goalImpact.uncovered` rephrased, even though the two
 * carry the same figure: this one is the trigger for the funding step ("the
 * money is not there yet"), while `uncovered` is a statement about the spend
 * having outrun every wallet. Both render, side by side, in the safety block.
 */
export type WhatIfLiquidity = {
  /** Immediately-usable money, after the horizon's outflows. */
  liquidAvailable: number
  /** What the spend needs beyond that. 0 when it fits. */
  shortfall: number
}

/** An asset that could be sold to close a shortfall. Offered, never advised. */
export type WhatIfFundingOption = {
  assetId: string
  name: string
  type: string
  value: number
  liquidity: 'not_immediately_usable' | 'long_term'
  /** What the goals hold of it — the cost of selling, before committing. */
  goalClaimedAmount: number
}

/** One sold holding, as applied. */
export type WhatIfAppliedSaleLine = {
  assetId: string
  name: string
  amount: number
  assetValueBefore: number
  assetValueAfter: number
}

/** The sale as applied, echoing the choices the engine made. */
export type WhatIfAppliedSale = {
  /** Every holding sold, in the order the household listed them. */
  lines: WhatIfAppliedSaleLine[]
  /** Gross proceeds across all lines. */
  amount: number
  /** What lands in the wallet. Equal to `amount` — a hypothetical has no fee. */
  netProceeds: number
  /** The wallet the household chose to receive the proceeds. */
  receivingAssetId: string
  /**
   * The receiving wallet's name, or the label for money that sits in no
   * account yet when `receivingAssetId` is `UNASSIGNED_WALLET_ID`.
   */
  receivingName: string
}

export type WhatIfResult = {
  householdId: string
  asOfDate: string
  horizonDays: number
  input: WhatIfRequest
  obligationsCovered: boolean
  before: WhatIfSideResult
  after: WhatIfSideResult
  /** Optional so a client on an older backend degrades to "no funding step". */
  liquidity?: WhatIfLiquidity
  fundingOptions?: WhatIfFundingOption[]
  assetSale?: WhatIfAppliedSale | null
  /** After the sale AND the spend. `null` when no sale was applied. */
  afterSale?: WhatIfSideResult | null
  deltaWithSale?: {
    flexibleMoneyToday: number
    lowestProjectedBalance: number
  } | null
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

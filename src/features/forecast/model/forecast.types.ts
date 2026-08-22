/**
 * Forecast core (spec §26A–D). Mirrors the backend's `forecast.types.ts`.
 *
 * Two invariants the UI must never break:
 *  - `lowestProjectedBalance` and flexible money MAY BE NEGATIVE. Never clamp,
 *    never `Math.max(0, …)`. Negative is the signal the product exists to show.
 *  - The backend never sends prose. Every reason/assumption is a machine code;
 *    the client renders all copy.
 */
import type {
  CashflowCertainty,
  CashflowDirection,
  CashflowEventStatus,
  CashflowRequirement,
} from '@/features/cashflow/model/cashflow.types'

export const ALLOWED_HORIZONS = [7, 30, 60, 90] as const
export type HorizonDays = (typeof ALLOWED_HORIZONS)[number]
export const DEFAULT_HORIZON: HorizonDays = 30

export type AssumptionCode =
  | 'horizon_days'
  | 'estimated_incoming_excluded'
  | 'planned_outflows_included'
  | 'no_confirmed_inflow_in_horizon'
  | 'overdue_events_clamped_to_today'
  | 'stale_asset_values'
  | 'same_day_outflows_ordered_first'

export type CalculationAssumption = {
  code: AssumptionCode
  /** Numeric or enum payload — never localized text. */
  value?: number | string
  relatedIds?: string[]
}

/** Why an occurrence is shown but not counted in the running balance. */
export type OccurrenceExclusionReason =
  | 'estimated_incoming'
  | 'planned_outgoing'
  | 'postponed'

export type ForecastOccurrence = {
  /** Stable synthetic key `${sourceEventId}@${date}` — NOT a database id. */
  occurrenceKey: string
  sourceEventId: string
  occurrenceIndex: number
  isVirtual: boolean
  isSynthetic: boolean
  date: string
  name: string
  direction: CashflowDirection
  amount: number
  requirement: CashflowRequirement
  certainty: CashflowCertainty
  status: CashflowEventStatus
  /** False = shown on the timeline but excluded from the running balance. */
  countedInBalance: boolean
  exclusionReason?: OccurrenceExclusionReason
  /** An overdue occurrence pulled onto day 0. */
  wasClampedFromPast: boolean
  /**
   * The date the user actually entered, present only when the clamp moved
   * `date` off it. Shown on the row so a clamped date is not mistaken for the
   * due date being rewritten.
   */
  originalDate?: string
  financialGoalId?: string | null
  debtId?: string | null
}

export type ForecastDay = {
  date: string
  openingBalance: number
  /** Counted amounts only. */
  incoming: number
  outgoing: number
  closingBalance: number
  /** Includes non-counted occurrences so the timeline can show them. */
  occurrences: ForecastOccurrence[]
}

export type ForecastTotals = {
  upcomingIncomeAmount: number
  upcomingOutgoingAmount: number
  requiredOutgoingAmount: number
  plannedOutgoingAmount: number
  estimatedIncomingAmountExcluded: number
}

export type ForecastResult = {
  householdId: string
  asOfDate: string
  horizonDays: number
  horizonEndDate: string
  startingLiquidBalance: number
  days: ForecastDay[]
  /** Event-only, date-sorted — the Upcoming screen's list. */
  timeline: ForecastOccurrence[]
  totals: ForecastTotals
  /** MAY BE NEGATIVE. The single most important number in the forecast. */
  lowestProjectedBalance: number
  lowestProjectedBalanceDate: string
  endingProjectedBalance: number
  obligationsCovered: boolean
  nextSufficientlyCertainInflow: {
    date: string
    amount: number
    sourceEventId: string
  } | null
  staleAssetIds: string[]
  usableNowAssetCount: number
  liveEventCount: number
  assumptions: CalculationAssumption[]
}

// --- financial state (§26D) -------------------------------------------------

/**
 * v3.1 renamed this enum. Old: `good|attention|tight|insufficient_data`.
 * `incomplete` means "not enough data to judge", never "bad".
 */
export type FinancialState = 'on_track' | 'watch' | 'tight' | 'incomplete'

export type FinancialStateReason =
  | 'no_liquid_sources'
  | 'no_cashflow_events'
  | 'required_payment_not_covered'
  | 'lowest_projected_balance_negative'
  | 'flexible_money_low'
  | 'large_payment_upcoming'
  | 'unconfirmed_critical_data'
  | 'stale_data'

export type FinancialStateResult = {
  state: FinancialState
  /** EVERY reason that fired, not just the winning one. */
  reasons: FinancialStateReason[]
  horizonDays: number
  assumptions: CalculationAssumption[]
}

// --- flexible money (§26B) --------------------------------------------------

/**
 * NEVER label any of these a spending allowance (design §12.3) — not "Ngân sách
 * được phép tiêu", not "Số tiền bạn nên tiêu".
 *
 * There are TWO distinct figures and they are not interchangeable:
 *  - `flexibleMoneyToday` — the §26B conservative form: what is free before the
 *    next sufficiently-certain inflow arrives.
 *  - `lowestProjectedBalance` — the horizon form: what is free without the
 *    balance ever going negative. **This is the one what-if compares
 *    before/after.** It used to be re-exported as `flexibleMoneyHorizon` after
 *    subtracting the protected reserve; with the reserve retired the two are
 *    the same number, so only one name survives.
 *
 * Both MAY BE NEGATIVE.
 */
export type FlexibleMoneyResult = {
  asOfDate: string
  horizonDays: number
  currentSharedLiquidMoney: number
  /**
   * How many `usable_now` assets that figure is the sum of.
   *
   * 0đ is ambiguous on its own — a wallet holding nothing and no wallet at all
   * both sum to zero — and only the second means there is no balance for a
   * projection to be about. Optional so an older server reads as "unknown",
   * which every consumer treats as "there is a source" rather than blanking.
   */
  usableNowAssetCount?: number
  /** §26B conservative form. MAY BE NEGATIVE. */
  flexibleMoneyToday: number
  requiredOutflowsBeforeNextInflow: number
  nextSufficientlyCertainInflow: { date: string; amount: number } | null
  /** The occurrence keys behind the subtraction, for "how was this computed". */
  consideredOutflowKeys: string[]
  /** The horizon form. MAY BE NEGATIVE. What what-if compares. */
  lowestProjectedBalance: number
  lowestProjectedBalanceDate: string
  /** MAY BE NEGATIVE. Label with its assumption when shown. */
  endingProjectedBalance: number
  obligationsCovered: boolean
  /**
   * Liquid money the household's GOALS already claim — what is set aside behind
   * a goal, plus what this month's pace can still draw from what is left.
   *
   * Not an obligation with a date: this money does not leave the household, it
   * simply stops being free. Optional so an older server that does not send it
   * reads as 0 rather than NaN.
   */
  goalCommitments?: number
  assumptions: CalculationAssumption[]
}

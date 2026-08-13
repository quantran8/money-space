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
  | 'private_records_excluded'
  | 'no_confirmed_inflow_in_horizon'
  | 'reserve_applied'
  | 'no_reserve_declared'
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
  protectedReserveAmount: number
  reserveProtected: boolean
  nextSufficientlyCertainInflow: {
    date: string
    amount: number
    sourceEventId: string
  } | null
  excludedPrivateRecordCount: number
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
  | 'no_reserve_declared'
  | 'required_payment_not_covered'
  | 'lowest_projected_balance_negative'
  | 'reserve_significantly_breached'
  | 'flexible_money_low'
  | 'large_payment_upcoming'
  | 'forecast_near_reserve'
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
 * There are THREE distinct figures and they are not interchangeable:
 *  - `flexibleMoneyToday` — the §26B conservative form: what is free before the
 *    next sufficiently-certain inflow arrives.
 *  - `flexibleMoneyHorizon` — spendable without breaching the reserve at ANY
 *    point in the horizon. **This is the one what-if compares before/after.**
 *  - `flexibleMoneyEndOfHorizon` — end-of-horizon variant; must be labelled
 *    with its assumption whenever it is shown.
 *
 * All three MAY BE NEGATIVE.
 */
export type FlexibleMoneyResult = {
  asOfDate: string
  horizonDays: number
  currentSharedLiquidMoney: number
  protectedReserveAmount: number
  /** §26B conservative form. MAY BE NEGATIVE. */
  flexibleMoneyToday: number
  requiredOutflowsBeforeNextInflow: number
  nextSufficientlyCertainInflow: { date: string; amount: number } | null
  /** The occurrence keys behind the subtraction, for "how was this computed". */
  consideredOutflowKeys: string[]
  /** MAY BE NEGATIVE. What what-if compares. */
  flexibleMoneyHorizon: number
  /** MAY BE NEGATIVE. Label with its assumption when shown. */
  flexibleMoneyEndOfHorizon: number
  lowestProjectedBalance: number
  lowestProjectedBalanceDate: string
  obligationsCovered: boolean
  reserveProtected: boolean
  assumptions: CalculationAssumption[]
}

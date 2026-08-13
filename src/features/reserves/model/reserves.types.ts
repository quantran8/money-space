/**
 * The household's emergency fund (spec §19C, stored as `protected_reserves`).
 *
 * It is a FLOOR on the forecast, not an account and not a fence. Nothing is
 * moved anywhere and nothing is locked — the money stays spendable. The number
 * is the level the projected balance is not meant to drop below, so "how much
 * can we spend without breaking what we promised ourselves" has an answer:
 *
 *   flexibleMoneyHorizon = lowestProjectedBalance - emergencyFund
 *
 * Two consequences follow from it being a floor rather than a pot:
 *
 * - **Upcoming obligations must NOT be added to it.** Tax due next month is a
 *   cashflow event; the forecast already walks the balance down on its due date
 *   and it stops mattering once paid. Folding it into the floor subtracts it
 *   twice and never expires.
 * - **It cannot be derived.** Nothing in the data says a household wants to keep
 *   120tr rather than 80tr — that is a decision, which is why it is stored and
 *   why the forecast has a `no_reserve_declared` state.
 *
 * The client treats this as ONE number per household. Multiple named pots are
 * financial goals (a goal with no deadline is exactly that), not reserves.
 */
export type ReserveStatus = 'active' | 'archived'

/**
 * Stored `name` for the single reserve row the client maintains. The name is no
 * longer shown anywhere, so it is a constant rather than a translated string —
 * a household's stored data should not change meaning when they switch locale.
 */
export const EMERGENCY_FUND_NAME = 'Quỹ dự phòng'

export type ProtectedReserve = {
  id: string
  householdId: string
  name: string
  amount: number
  status: ReserveStatus
  note?: string
  createdAt?: string
  updatedAt?: string
}

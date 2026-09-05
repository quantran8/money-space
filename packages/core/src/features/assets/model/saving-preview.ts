import {
  computeSavingEarly,
  computeSavingOnTime,
  termMonthsOf,
  type SavingBreakdown,
} from '#/features/assets/model/assets'
import type { CalculationTerm } from '#/features/assets/model/assets.types'
import { parseRawDecimal, parseRawMoney } from '#/shared/lib/number-format'
import type { AssetForm } from '#/features/assets/model/assets-form'

/**
 * The term lengths a Vietnamese bank actually offers on a passbook. Typing a
 * maturity date is how the field worked before, and it made the most common
 * case — "gửi 12 tháng" — the slowest one to enter: open a calendar, page to
 * the right month, pick the same day of the month you started on.
 */
export const savingTermPresetMonths = [1, 3, 6, 9, 12, 18, 24, 36] as const

/**
 * The maturity date `months` after `startDate`, clamped to the month's length
 * (31/01 + 1 tháng → 28/02), so a preset never produces a date the bank would
 * not use. Mirrors the backend's `addMonthsIso`, which stamps the accrual
 * period ends — a different rounding here would make the preview disagree with
 * the interest the app later credits.
 */
export function maturityDateFromTerm(startDate: string, months: number): string {
  const start = new Date(`${startDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return ''
  const day = start.getUTCDate()
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

/**
 * Which preset a start/maturity pair corresponds to, or `null` for a hand-picked
 * date. Lets the segmented control show the stored term as selected when an
 * existing deposit is reopened, instead of resetting to "no preset chosen".
 */
export function termPresetForDates(startDate: string, maturityDate: string): number | null {
  if (!startDate || !maturityDate) return null
  return (
    savingTermPresetMonths.find(
      (months) => maturityDateFromTerm(startDate, months) === maturityDate,
    ) ?? null
  )
}

export type SavingPreview = {
  /** Held to maturity: principal, interest earned, take-home. */
  onTime: SavingBreakdown
  /** Broken at `earlyMonth`, priced at the non-term rate. */
  early: SavingBreakdown
  /** The month the early figures are for — mid-term, the worst-case a saver hits. */
  earlyMonth: number
  /** Whole months from deposit to maturity. */
  termMonths: number
  /** What each monthly payout is worth, for a `monthly` schedule. */
  monthlyInterest: number
  /** What breaking the deposit costs, versus holding it. Always ≥ 0. */
  earlyPenalty: number
}

/**
 * Turn raw form values into the payout figures for a saving deposit, or `null`
 * while the inputs cannot support an honest number.
 *
 * Reuses `computeSavingOnTime` / `computeSavingEarly` rather than restating the
 * formulas, so what the form promises before saving and what the detail page
 * shows afterwards cannot drift apart.
 */
export function previewSavingDeposit(
  values: Pick<
    AssetForm,
    'type' | 'principal' | 'interestRate' | 'startDate' | 'maturityDate' | 'nonTermRate' | 'interestPayment'
  >,
): SavingPreview | null {
  if (values.type !== 'saving_deposit') return null

  const principal = parseRawMoney(values.principal)
  const interestRate = parseRawDecimal(values.interestRate)
  if (!Number.isFinite(principal) || principal <= 0) return null
  if (!Number.isFinite(interestRate) || interestRate < 0) return null
  if (!values.startDate || !values.maturityDate) return null
  if (values.maturityDate <= values.startDate) return null

  // A missing non-term rate is 0%, not a reason to withhold the block: it is
  // the last field the user fills, and the on-time figures — the ones they came
  // for — do not depend on it.
  const nonTermRate = parseRawDecimal(values.nonTermRate)

  const term: CalculationTerm = {
    calculationType: 'saving_deposit',
    principalAmount: principal,
    interestRate,
    startDate: values.startDate,
    maturityDate: values.maturityDate,
    interestPayment: values.interestPayment,
    nonTermRate: Number.isFinite(nonTermRate) ? nonTermRate : 0,
    interestDestination: 'principal',
    receivingWalletId: null,
  }

  const termMonths = termMonthsOf(term)
  if (termMonths <= 0) return null

  // Mid-term: the point a saver is most likely to be asked to weigh, and where
  // the gap between the two rates is fully visible. A term too short to have a
  // mid-point is quoted at month 1.
  const earlyMonth = Math.max(1, Math.floor(termMonths / 2))
  const onTime = computeSavingOnTime(term)
  const early = computeSavingEarly(term, earlyMonth)
  // An extreme rate/tenor pair can drive a clawback past the principal; the
  // depositor still walks away with nothing rather than owing the bank.
  const earlyTotal = Math.max(0, early.total)

  return {
    onTime,
    early: { ...early, total: earlyTotal },
    earlyMonth,
    termMonths,
    monthlyInterest: (principal * (interestRate / 100)) / 12,
    earlyPenalty: Math.max(0, onTime.total - earlyTotal),
  }
}

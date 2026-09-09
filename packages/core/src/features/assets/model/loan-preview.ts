import {
  computeMaturityValue,
  savingTermYears,
} from '#/features/assets/model/assets'
import type { CalculationTerm } from '#/features/assets/model/assets.types'
import { parseRawDecimal, parseRawMoney } from '#/shared/lib/number-format'
import type { AssetForm } from '#/features/assets/model/assets-form'

export type LoanPreview = {
  /** What was lent out. */
  principal: number
  /** Interest earned over the whole term. */
  interest: number
  /** Principal + interest — what comes back when the loan is collected. */
  total: number
  /** Whole months from the lending date to the due date. */
  termMonths: number
  /** What one month of interest is worth, at the same rate. */
  monthlyInterest: number
}

/**
 * The money a loan returns when it is collected, or `null` while the inputs
 * cannot support an honest number.
 *
 * Reuses `computeMaturityValue` — the same function the detail page quotes —
 * rather than restating simple interest here, so the promise made before saving
 * and the figure shown afterwards cannot drift apart.
 */
export function previewLoanReceivable(
  values: Pick<
    AssetForm,
    'type' | 'principal' | 'interestRate' | 'hasInterest' | 'startDate' | 'maturityDate'
  >,
): LoanPreview | null {
  if (values.type !== 'loan_receivable') return null
  // An interest-free loan returns exactly what was lent; there is no interest
  // to preview, and a block promising "0đ lãi" is noise on a form.
  if (!values.hasInterest) return null

  const principal = parseRawMoney(values.principal)
  const interestRate = parseRawDecimal(values.interestRate)
  if (!Number.isFinite(principal) || principal <= 0) return null
  if (!Number.isFinite(interestRate) || interestRate <= 0) return null
  if (!values.startDate || !values.maturityDate) return null
  if (values.maturityDate <= values.startDate) return null

  const term: CalculationTerm = {
    calculationType: 'loan_receivable',
    principalAmount: principal,
    interestRate,
    startDate: values.startDate,
    maturityDate: values.maturityDate,
    interestPayment: 'end_of_term',
    nonTermRate: 0,
    interestDestination: 'principal',
    receivingWalletId: null,
  }

  const total = computeMaturityValue(term)
  if (total === null) return null

  return {
    principal,
    interest: total - principal,
    total,
    termMonths: Math.max(1, Math.round(savingTermYears(term) * 12)),
    monthlyInterest: (principal * (interestRate / 100)) / 12,
  }
}

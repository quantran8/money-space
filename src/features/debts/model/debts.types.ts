/**
 * Who the household borrowed from — the single classification of a debt. Drives
 * the repayment rules (see memory/debts.md):
 *   - `bank_institution`: interest, term, and a fixed monthly payment are
 *     required; repayment money events are locked (can't be hand-edited).
 *   - `relative` / `other`: interest and a fixed term are optional; when the
 *     user sets a schedule, editing a repayment event rebalances the next
 *     unpaid installment by the over/under-payment.
 */
export type LenderType = 'relative' | 'bank_institution' | 'other'

/** Lenders whose repayment schedule is fixed and whose events are locked. */
export function isFixedScheduleLender(lenderType: LenderType): boolean {
  return lenderType === 'bank_institution'
}

export type DebtStatus = 'active' | 'paid_off' | 'paused' | 'overdue' | 'cancelled'

/** One interest stage as returned by / sent to the backend. */
export type DebtInterestPeriodDto = {
  /** Annual interest rate in percent, e.g. 9.2. */
  interestRate: number
  /** Stage length in months; omitted means "remaining term". */
  months?: number
  startDate?: string
  endDate?: string
}

export type DebtItem = {
  id: string
  name: string
  lenderType: LenderType
  lenderName: string
  /** Compact display string, e.g. "84M". */
  originalAmount: string
  /** Compact display string, e.g. "84M". */
  outstandingAmount: string
  /** Raw VND amounts, used to populate the edit form. */
  originalAmountValue: number
  outstandingAmountValue: number
  fixedPaymentAmountValue?: number
  currency: string
  borrowedAt: string
  expectedFinalDueDate?: string
  status: DebtStatus
  ownerMemberId?: string
  ownerName?: string
  receivedToAssetId?: string
  receivedToAssetName?: string
  paymentFrequency?: 'none' | 'monthly' | 'quarterly' | 'yearly'
  fixedPaymentAmount?: string
  interestSummary?: string
  /** Backend interest-calculation enum, used to rehydrate the calc method. */
  interestCalculation?: string
  /** Full interest schedule (one entry per stage). */
  interestPeriods?: DebtInterestPeriodDto[]
  note?: string
}

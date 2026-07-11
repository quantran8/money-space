export type DebtType =
  | 'family_loan'
  | 'friend_loan'
  | 'bank_loan'
  | 'consumer_finance'
  | 'mortgage'
  | 'credit_card'
  | 'installment'
  | 'other'

export type LenderType = 'family' | 'friend' | 'bank' | 'credit_institution' | 'company' | 'other'

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
  debtType: DebtType
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

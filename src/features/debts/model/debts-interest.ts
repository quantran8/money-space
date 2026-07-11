/**
 * Interest-period + repayment maths for the debt form.
 *
 * Each stage the user enters is persisted as its own row in
 * `debt_interest_periods` (see `toInterestPeriodDtos` /
 * `fromInterestPeriodDtos`). Keep the maths here pure and UI-free.
 */

import type { DebtInterestPeriodDto } from '@/features/debts/model/debts.types'

/** How the fixed periodic payment is derived from principal + interest. */
export type InterestCalc = 'fixed' | 'reducing'

/** One interest stage: a rate that applies for a run of months. */
export type InterestPeriod = {
  /** Annual interest rate in percent, e.g. 9.2 for 9.2%/year. */
  ratePct: string
  /** Number of months this stage lasts. Empty = "remaining months". */
  months: string
}

export type PaymentFrequency = 'none' | 'monthly' | 'quarterly' | 'yearly'

/** Periods per year for each supported frequency. */
const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  none: 0,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
}

export function periodsPerYear(frequency: PaymentFrequency): number {
  return PERIODS_PER_YEAR[frequency] ?? 0
}

function toNumber(value: string): number {
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Whole months between two ISO dates (yyyy-mm-dd), rounded to the nearest
 * month and never below 1. Returns null when either date is missing/invalid.
 */
export function monthsBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  if (to <= from) return null
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() - from.getDate()) / 30
  return Math.max(1, Math.round(months))
}

/** Number of repayment installments across the loan term for a frequency. */
export function totalInstallments(
  frequency: PaymentFrequency,
  termMonths: number | null,
): number | null {
  if (!termMonths || termMonths <= 0) return null
  const perYear = periodsPerYear(frequency)
  if (perYear <= 0) return null
  return Math.max(1, Math.round((termMonths / 12) * perYear))
}

/**
 * Term-weighted average annual rate (percent) across the interest periods.
 * A period with empty `months` soaks up whatever term is left over. Returns 0
 * when no usable rate is present.
 */
export function averageAnnualRate(
  periods: InterestPeriod[],
  termMonths: number | null,
): number {
  const usable = periods.filter((p) => p.ratePct.trim() !== '')
  if (usable.length === 0) return 0

  const fixedMonths = usable.reduce((sum, p) => sum + Math.max(0, toNumber(p.months)), 0)
  const remaining = termMonths ? Math.max(0, termMonths - fixedMonths) : 0

  let weighted = 0
  let totalWeight = 0
  for (const period of usable) {
    const explicit = Math.max(0, toNumber(period.months))
    const weight = explicit > 0 ? explicit : remaining || 1
    weighted += toNumber(period.ratePct) * weight
    totalWeight += weight
  }
  return totalWeight > 0 ? weighted / totalWeight : toNumber(usable[0].ratePct)
}

export type RepaymentEstimate = {
  /** Suggested amount to pay each installment, in VND (rounded). */
  perPayment: number
  /** Number of installments over the loan term. */
  installments: number
  /** Averaged annual rate used, in percent. */
  annualRatePct: number
}

/**
 * Estimate the payment due each installment.
 *
 * - `fixed` (annuity): every installment is the same amount, covering interest
 *   on the shrinking balance plus principal — the standard bank formula
 *   `PMT = P·r / (1 − (1+r)^−n)`.
 * - `reducing`: principal is split evenly (P/n) and interest is charged on the
 *   outstanding balance; we return the *first* (largest) installment, which is
 *   the most conservative planning figure.
 *
 * Returns null when there isn't enough information (no term or no frequency).
 */
export function estimateRepayment(params: {
  principal: number
  frequency: PaymentFrequency
  termMonths: number | null
  periods: InterestPeriod[]
  calc: InterestCalc
}): RepaymentEstimate | null {
  const { principal, frequency, termMonths, periods, calc } = params
  const installments = totalInstallments(frequency, termMonths)
  if (!installments || principal <= 0) return null

  const annualRatePct = averageAnnualRate(periods, termMonths)
  const ratePerPeriod = annualRatePct / 100 / periodsPerYear(frequency)

  // No interest → straight principal split.
  if (ratePerPeriod <= 0) {
    return {
      perPayment: Math.round(principal / installments),
      installments,
      annualRatePct,
    }
  }

  if (calc === 'reducing') {
    const principalPart = principal / installments
    const firstInterest = principal * ratePerPeriod
    return {
      perPayment: Math.round(principalPart + firstInterest),
      installments,
      annualRatePct,
    }
  }

  // Annuity / fixed installment.
  const factor = Math.pow(1 + ratePerPeriod, -installments)
  const perPayment = (principal * ratePerPeriod) / (1 - factor)
  return {
    perPayment: Math.round(perPayment),
    installments,
    annualRatePct,
  }
}

/**
 * Map the UI calc method to the backend `DebtInterestCalculation` enum
 * (`simple_interest | reducing_balance | flat_rate | custom`). A fixed annuity
 * charges interest on the reducing balance; the `reducing` split is a flat rate
 * on principal.
 */
export function calcToBackendEnum(calc: InterestCalc): 'reducing_balance' | 'flat_rate' {
  return calc === 'fixed' ? 'reducing_balance' : 'flat_rate'
}

/** Inverse of {@link calcToBackendEnum}; defaults to `fixed` for unknown values. */
export function calcFromBackendEnum(value: string | undefined): InterestCalc {
  return value === 'flat_rate' ? 'reducing' : 'fixed'
}

/** Serialize the form's string-based stages into the backend DTO shape. */
export function toInterestPeriodDtos(
  periods: InterestPeriod[],
): DebtInterestPeriodDto[] {
  return periods
    .filter((p) => p.ratePct.trim() !== '')
    .map((p) => {
      const rate = Number(p.ratePct.replace(',', '.'))
      const months = Number(p.months.replace(',', '.'))
      return {
        interestRate: Number.isFinite(rate) ? rate : 0,
        months: Number.isFinite(months) && months > 0 ? Math.round(months) : undefined,
      }
    })
}

/** Rehydrate the form's string-based stages from the backend DTO. */
export function fromInterestPeriodDtos(
  periods: DebtInterestPeriodDto[] | undefined,
): InterestPeriod[] | null {
  if (!periods || periods.length === 0) return null
  return periods.map((p) => ({
    ratePct: p.interestRate != null ? String(p.interestRate) : '',
    months: p.months != null ? String(p.months) : '',
  }))
}

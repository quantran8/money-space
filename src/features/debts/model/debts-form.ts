import { z } from 'zod'

import { parseRawMoney } from '@/shared/lib/number-format'
import type { InterestCalc, InterestPeriod } from '@/features/debts/model/debts-interest'
import { isFixedScheduleLender } from '@/features/debts/model/debts.types'
import type { DebtStatus, LenderType } from '@/features/debts/model/debts.types'

export type DebtForm = {
  name: string
  lenderType: LenderType
  lenderName: string
  originalAmount: string
  outstandingAmount: string
  borrowedAt: string
  expectedFinalDueDate: string
  ownerMemberId: string
  receivedToAssetId: string
  paymentFrequency: 'none' | 'monthly' | 'quarterly' | 'yearly'
  fixedPaymentAmount: string
  /** Whether the user has overridden the auto-computed payment amount. */
  fixedPaymentTouched: boolean
  /** Whether this loan charges interest. When false, the interest fields are
   *  hidden and no rate/calc is persisted. */
  hasInterest: boolean
  /** How the periodic payment is derived (annuity vs. reducing balance). */
  interestCalc: InterestCalc
  /** One or more interest stages (rate %/year + months). */
  interestPeriods: InterestPeriod[]
  note: string
}

export type DebtSummary = {
  outstanding: number
  activeCount: number
  overdueCount: number
  monthlyPlanned: number
}

export const defaultValues: DebtForm = {
  name: '',
  lenderType: 'relative',
  lenderName: '',
  originalAmount: '',
  outstandingAmount: '',
  borrowedAt: '2026-07-08',
  expectedFinalDueDate: '',
  ownerMemberId: '',
  receivedToAssetId: '',
  paymentFrequency: 'none',
  fixedPaymentAmount: '',
  fixedPaymentTouched: false,
  hasInterest: false,
  interestCalc: 'fixed',
  interestPeriods: [{ ratePct: '', months: '' }],
  note: '',
}

/**
 * The three lender buckets, shown as quick-pick chips. Labels are resolved via
 * i18n at the call site (`options.lenderType.<value>`); the fallback label here
 * is Vietnamese for any non-translated context.
 */
export const quickLenderTypes: Array<{
  value: LenderType
  label: string
}> = [
  { value: 'relative', label: 'Người thân' },
  { value: 'bank_institution', label: 'Ngân hàng / Tổ chức' },
  { value: 'other', label: 'Khác' },
]

/** Parse a raw (separator-free) money string like "84000000" into VND. */
export function parseAmountInput(raw: string) {
  const value = parseRawMoney(raw)
  return Number.isFinite(value) ? value : 0
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function amountToRaw(value?: number) {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

export function formatVndShortLocal(value: number) {
  if (value >= 1_000_000_000) return `${Math.round((value / 1_000_000_000) * 10) / 10}B`
  if (value >= 1_000_000) return `${Math.round((value / 1_000_000) * 10) / 10}M`
  if (value >= 1_000) return `${Math.round((value / 1_000) * 10) / 10}K`
  return `${value}`
}

export function formatDate(isoDate?: string) {
  if (!isoDate) return 'Chưa chốt hạn'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('vi-VN')
}

export function getStatusTone(status: DebtStatus) {
  if (status === 'overdue') {
    return 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))] border-none'
  }
  if (status === 'paid_off') {
    return 'bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))] border-none'
  }
  if (status === 'paused' || status === 'cancelled') {
    return 'bg-secondary text-muted-foreground border-none'
  }
  return 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] border-none'
}

export function getStatusLabel(status: DebtStatus) {
  switch (status) {
    case 'active':
      return 'Đang trả'
    case 'paid_off':
      return 'Đã xong'
    case 'paused':
      return 'Tạm dừng'
    case 'overdue':
      return 'Quá hạn'
    case 'cancelled':
      return 'Đã hủy'
  }
}

export function buildDebtSchema() {
  return z
    .object({
      name: z.string().trim().min(1, 'Vui lòng nhập tên khoản nợ.'),
      lenderType: z.enum(['relative', 'bank_institution', 'other']),
      lenderName: z.string().trim().min(1, 'Vui lòng nhập nơi cho vay.'),
      originalAmount: z.string().trim().min(1, 'Vui lòng nhập số tiền vay.'),
      outstandingAmount: z.string().trim().min(1, 'Vui lòng nhập số còn nợ.'),
      borrowedAt: z.string().min(1, 'Vui lòng chọn ngày vay.'),
      expectedFinalDueDate: z.string(),
      ownerMemberId: z.string(),
      receivedToAssetId: z.string(),
      paymentFrequency: z.enum(['none', 'monthly', 'quarterly', 'yearly']),
      fixedPaymentAmount: z.string(),
      fixedPaymentTouched: z.boolean(),
      hasInterest: z.boolean(),
      interestCalc: z.enum(['fixed', 'reducing']),
      interestPeriods: z
        .array(
          z.object({
            ratePct: z.string(),
            months: z.string(),
          }),
        )
        .min(1),
      note: z.string(),
    })
    .superRefine((value, ctx) => {
      if (parseAmountInput(value.originalAmount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['originalAmount'],
          message: 'Số tiền vay cần lớn hơn 0.',
        })
      }
      if (parseAmountInput(value.outstandingAmount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outstandingAmount'],
          message: 'Số còn nợ cần lớn hơn 0.',
        })
      }
      if (parseAmountInput(value.outstandingAmount) > parseAmountInput(value.originalAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outstandingAmount'],
          message: 'Số còn nợ không nên lớn hơn số vay ban đầu.',
        })
      }
      // A bank/institution loan is a fixed-schedule debt: the interest rate, the
      // final due date (its term) and a fixed monthly payment are all required so
      // the schedule and its locked repayments are well-defined (see
      // memory/debts.md). Relative/other loans leave all three optional.
      if (isFixedScheduleLender(value.lenderType)) {
        const hasRate =
          value.hasInterest &&
          value.interestPeriods.some((p) => p.ratePct.trim() !== '')
        if (!hasRate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['interestPeriods'],
            message: 'Khoản vay ngân hàng/tổ chức cần có lãi suất.',
          })
        }
        if (!value.expectedFinalDueDate.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['expectedFinalDueDate'],
            message: 'Khoản vay ngân hàng/tổ chức cần có kỳ hạn trả (ngày đáo hạn).',
          })
        }
        if (parseAmountInput(value.fixedPaymentAmount) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['fixedPaymentAmount'],
            message: 'Khoản vay ngân hàng/tổ chức cần số tiền trả hàng tháng.',
          })
        }
      }
    })
}

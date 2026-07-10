import { z } from 'zod'

import { parseRawMoney } from '@/shared/lib/number-format'
import type { DebtStatus, DebtType, LenderType } from '@/features/debts/model/debts.types'

export type DebtForm = {
  name: string
  debtType: DebtType
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
  interestSummary: string
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
  debtType: 'family_loan',
  lenderType: 'family',
  lenderName: '',
  originalAmount: '',
  outstandingAmount: '',
  borrowedAt: '2026-07-08',
  expectedFinalDueDate: '',
  ownerMemberId: '',
  receivedToAssetId: '',
  paymentFrequency: 'none',
  fixedPaymentAmount: '',
  interestSummary: '',
  note: '',
}

export const quickLenderTypes: Array<{
  value: LenderType
  label: string
  debtType: DebtType
}> = [
  { value: 'family', label: 'Người thân', debtType: 'family_loan' },
  { value: 'bank', label: 'Ngân hàng', debtType: 'bank_loan' },
  { value: 'other', label: 'Khác', debtType: 'other' },
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
      debtType: z.enum([
        'family_loan',
        'friend_loan',
        'bank_loan',
        'consumer_finance',
        'mortgage',
        'credit_card',
        'installment',
        'other',
      ]),
      lenderType: z.enum(['family', 'friend', 'bank', 'credit_institution', 'company', 'other']),
      lenderName: z.string().trim().min(1, 'Vui lòng nhập nơi cho vay.'),
      originalAmount: z.string().trim().min(1, 'Vui lòng nhập số tiền vay.'),
      outstandingAmount: z.string().trim().min(1, 'Vui lòng nhập số còn nợ.'),
      borrowedAt: z.string().min(1, 'Vui lòng chọn ngày vay.'),
      expectedFinalDueDate: z.string(),
      ownerMemberId: z.string(),
      receivedToAssetId: z.string(),
      paymentFrequency: z.enum(['none', 'monthly', 'quarterly', 'yearly']),
      fixedPaymentAmount: z.string(),
      interestSummary: z.string(),
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
    })
}

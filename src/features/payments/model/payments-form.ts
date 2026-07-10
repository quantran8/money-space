import { z } from 'zod'

import type { PaymentStatus, UpcomingPaymentItem } from '@/features/payments/model/payments'
import { parseRawMoney } from '@/shared/lib/number-format'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedRequiredText,
} from '@/shared/lib/validation'

export type PaymentForm = {
  name: string
  amount: string
  due: string
  status: PaymentStatus
}

export const defaultPaymentFormValues: PaymentForm = {
  name: '',
  amount: '',
  due: '2026-07-10',
  status: 'normal',
}

export const AS_OF = '2026-07-06'
const AS_OF_YEAR = 2026

const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const statusTone: Record<PaymentStatus, string> = {
  important:
    'border border-[hsla(var(--status-orange),0.24)] bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
  normal: 'border border-border bg-card text-[hsl(var(--muted-foreground))]',
  pending:
    'border border-[hsla(var(--status-blue),0.24)] bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]',
}

export type PaymentGroupKey = 'overdue' | 'next7' | 'next30' | 'later'

export const groupDot: Record<PaymentGroupKey, string> = {
  overdue: 'hsl(var(--status-red))',
  next7: 'hsl(var(--status-orange))',
  next30: 'hsl(var(--status-blue))',
  later: 'hsl(var(--muted-foreground))',
}

export type PaymentTab = 'all' | 'important' | 'pending'

export function dueToIso(due: string): string {
  const parsed = new Date(due)
  if (!Number.isNaN(parsed.getTime())) return due
  const [day, abbr] = due.split(' ')
  const month = monthAbbr.indexOf(abbr)
  if (!day || month < 0) return defaultPaymentFormValues.due
  const year = new Date().getFullYear()
  return `${year}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
}

function dueToAsOfIso(due: string): string {
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(due.trim())
  if (iso) return iso[0]
  const [day, abbr] = due.trim().split(/\s+/)
  const month = monthAbbr.indexOf(abbr)
  if (!day || month < 0) return `${AS_OF_YEAR}-07-10`
  return `${AS_OF_YEAR}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function daysUntilDue(due: string): number {
  const target = new Date(dueToAsOfIso(due)).getTime()
  const now = new Date(AS_OF).getTime()
  if (Number.isNaN(target) || Number.isNaN(now)) return Number.POSITIVE_INFINITY
  return Math.round((target - now) / (1000 * 60 * 60 * 24))
}

/** Sum the raw VND amounts of a set of payments. */
export function sumAmounts(items: { amountValue?: number }[]): number {
  return items.reduce((total, item) => total + (item.amountValue ?? 0), 0)
}

/** Parse a raw (separator-free) payment amount string into VND. */
export function amountToVnd(amount: string): number {
  const value = parseRawMoney(amount)
  return Number.isFinite(value) ? value : 0
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function amountToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

export function buildPaymentSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z.object({
    name: localizedRequiredText(t, t('payments.form.name')),
    amount: localizedMoneyAmount(t),
    due: localizedIsoDate(t),
    status: z.enum(['important', 'normal', 'pending']),
  })
}

export type PaymentGroup = { key: PaymentGroupKey; items: UpcomingPaymentItem[] }

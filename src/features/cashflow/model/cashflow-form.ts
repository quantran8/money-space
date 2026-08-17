import { z } from 'zod'

import type {
  CashflowCertainty,
  CashflowDirection,
  CashflowRecurrence,
} from '@/features/cashflow/model/cashflow.types'
import { parseRawMoney } from '@/shared/lib/number-format'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

export type CashflowEventForm = {
  name: string
  amount: string
  direction: CashflowDirection
  expectedDate: string
  recurrence: CashflowRecurrence
  /**
   * Outgoing only. The backend forces `null` for incoming — you don't "have to"
   * receive money — so the field is hidden rather than disabled when incoming.
   */
  requirement: 'required' | 'planned'
  certainty: CashflowCertainty
  /**
   * Which wallet this will settle through. Optional — at planning time the
   * household often does not know yet, and confirming asks for one then.
   * Empty string = not chosen (a Select cannot hold `null`).
   */
  settlementAssetId: string
  note: string
}

export const RECURRENCE_OPTIONS: CashflowRecurrence[] = [
  'once',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
]

export function defaultCashflowFormValues(
  direction: CashflowDirection = 'outgoing',
): CashflowEventForm {
  return {
    name: '',
    amount: '',
    direction,
    expectedDate: new Date().toISOString().slice(0, 10),
    recurrence: 'once',
    // `required` is the conservative default: assuming an obligation is
    // optional would understate what the household must cover.
    requirement: 'required',
    // `confirmed` matches the backend default. `estimated` is displayed but
    // never banked, so it must be a deliberate choice.
    certainty: 'confirmed',
    settlementAssetId: '',
    note: '',
  }
}

export function buildCashflowSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z.object({
    name: localizedRequiredText(t, t('upcoming.form.name')),
    amount: localizedMoneyAmount(t),
    direction: z.enum(['incoming', 'outgoing']),
    expectedDate: localizedIsoDate(t),
    recurrence: z.enum(['once', 'weekly', 'monthly', 'quarterly', 'yearly']),
    requirement: z.enum(['required', 'planned']),
    certainty: z.enum(['confirmed', 'estimated']),
    // Optional by design — never block planning on a decision the household
    // has not made yet. Completion is where it becomes required.
    settlementAssetId: z.string(),
    note: localizedOptionalText(t, 120),
  })
}

/** Parse a raw (separator-free) amount string into VND. */
export function cashflowAmountToVnd(amount: string): number {
  const value = parseRawMoney(amount)
  return Number.isFinite(value) ? value : 0
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function cashflowAmountToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

import { z } from 'zod'

import type {
  CashflowCertainty,
  CashflowDirection,
  CashflowRecurrence,
} from '#/features/cashflow/model/cashflow.types'
import { parseRawMoney } from '#/shared/lib/number-format'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '#/shared/lib/validation'

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
    // Required for OUTGOING, optional for incoming — see the superRefine below.
    settlementAssetId: z.string(),
    note: localizedOptionalText(t, 120),
  })
    .superRefine((values, ctx) => {
      /**
       * An outflow entered BY HAND must name the wallet it leaves from: an
       * outflow outranks the goals sharing its wallet, and without a wallet the
       * goal money it costs cannot be worked out, so the form could not show
       * the trade before saving (`GoalImpactNotice`).
       *
       * This is a rule of this form, not of the domain. The server accepts an
       * outgoing event with no wallet, because a debt is not tied to one —
       * repayments generated months ahead cannot know which wallet will pay
       * them, and `completeCashflowEvent` asks at payment time instead. See
       * memory/debts.md.
       */
      if (values.direction === 'outgoing' && !values.settlementAssetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['settlementAssetId'],
          message: t('upcoming.complete.walletRequired'),
        })
      }
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

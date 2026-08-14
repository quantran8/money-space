import { z } from 'zod'

import type { GoalItem, GoalPriority } from '@/features/goals/model/goals'
import { formatVndShort } from '@/shared/lib/format-money'
import {
  localizedMoneyAmount,
  localizedOptionalMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

export type GoalForm = {
  name: string
  target: string
  /**
   * What the household has already put aside. Accepted **on create only** — the
   * backend rejects it on PATCH so the stored total cannot diverge from the
   * contribution history (`UpdateFinancialGoalDto`). Onboarding needs it: a
   * couple arrives with savings that predate the app ("we already have 200M
   * toward the house") and there is no honest event to invent for them.
   */
  current: string
  /**
   * The declared monthly contribution. This is what drives the §26C projection —
   * with it undeclared the API returns `reason: 'no_contribution'` and the UI
   * can only show progress, never a projected completion date (§14.3).
   */
  plannedMonthly: string
  priority: GoalPriority
  targetDate: string
  note: string
}

export type RecentUpdate = {
  id: string
  text: string
}

export type GoalStats = {
  saved: number
  target: number
  avg: number
}

export type GoalAllocationSlice = {
  id: string
  name: string
  percent: number
  color: string
}

export const defaultGoalFormValues: GoalForm = {
  name: '',
  target: '',
  current: '',
  plannedMonthly: '',
  priority: 'medium',
  targetDate: '',
  note: '',
}

export const priorityRank: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 }

export const priorityTone: Record<GoalPriority, string> = {
  high: 'bg-alert-tint text-alert',
  medium: 'bg-[hsl(var(--secondary))] text-ink2',
  low: 'bg-[hsl(var(--secondary))] text-ink2',
}

// One hue per allocation slice, cycled by goal order (validated status palette).
export const allocationColors = [
  'hsl(142 71% 45%)', // green
  'hsl(35 100% 50%)', // orange
  'hsl(211 100% 50%)', // blue
  'hsl(240 4% 65%)', // gray
]

export function formatAmount(value: number) {
  return formatVndShort(value)
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function amountToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

/** Suggested monthly top-up: remaining spread over ~4 months, min 1M when short. */
export function suggestedPace(goal: GoalItem) {
  const remaining = Math.max(goalAmount(goal.targetAmount) - goalAmount(goal.currentAmount), 0)
  if (remaining <= 0) return 0
  return Math.max(1_000_000, Math.round(remaining / 4))
}

/**
 * The goal's VND amount as a number. The API sends the raw numeric
 * `currentAmount` / `targetAmount`; this normalizes a possibly-missing value
 * to 0.
 */
export function goalAmount(amount: number | undefined): number {
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
}

/**
 * `current` is only editable while creating: `UpdateFinancialGoalDto` omits it,
 * so after creation the only thing that may move the stored total is a
 * `goal_contribution` money event. Pass `isEditing` so the schema stops
 * validating (and the dialog stops rendering) a field the API would ignore.
 */
export function buildGoalSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  isEditing = false,
) {
  return z
    .object({
      name: localizedRequiredText(t, t('goals.form.name')),
      target: localizedMoneyAmount(t),
      current: localizedOptionalMoneyAmount(t),
      plannedMonthly: localizedOptionalMoneyAmount(t),
      priority: z.enum(['high', 'medium', 'low']),
      targetDate: z.string(),
      note: localizedOptionalText(t, 120),
    })
    .superRefine((values, ctx) => {
      // Only meaningful on create — on edit the field is not rendered and the
      // API ignores it, so a stale value must not block the save.
      if (!isEditing && values.current !== '' && values.target !== '') {
        if (Number(values.current) > Number(values.target)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['current'],
            message: t('goals.form.currentExceedsTarget'),
          })
        }
      }
    })
}

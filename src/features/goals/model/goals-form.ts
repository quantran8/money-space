import { z } from 'zod'

import type { GoalItem, GoalPriority } from '@/features/goals/model/goals'
import { formatVndShort } from '@/shared/lib/format-money'
import {
  localizedMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

export type GoalForm = {
  name: string
  target: string
  priority: GoalPriority
  deadline: string
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
  priority: 'medium',
  deadline: '',
  note: '',
}

export const priorityRank: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 }

export const priorityTone: Record<GoalPriority, string> = {
  high: 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
  medium: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
  low: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
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

export function buildGoalSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  // No `current` field: progress is driven by goal_contribution money events,
  // not entered on the goal form. See addContribution in use-goals-page.
  return z.object({
    name: localizedRequiredText(t, t('goals.form.name')),
    target: localizedMoneyAmount(t),
    priority: z.enum(['high', 'medium', 'low']),
    deadline: z.string(),
    note: localizedOptionalText(t, 120),
  })
}

import type { GoalPriority } from '@/features/goals/model/goals.types'

export type { GoalItem, GoalPriority } from '@/features/goals/model/goals.types'

export const priorityLabels: Record<GoalPriority, string> = {
  high: 'Ưu tiên cao',
  medium: 'Bình thường',
  low: 'Ưu tiên thấp',
}

/** Parse a raw (separator-free) VND digit string into a number. */
export function parseAmount(raw: string) {
  const cleaned = raw.replace(/\./g, '').trim()
  if (cleaned === '') return 0
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function computeProgress(current: string, target: string) {
  const targetValue = parseAmount(target)
  if (targetValue <= 0) return 0
  return Math.round(Math.min(100, (parseAmount(current) / targetValue) * 100))
}

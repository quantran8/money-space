export type { GoalItem, GoalPriority } from '#/features/goals/model/goals.types'

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

/**
 * A goal's completion as a whole percent, from amounts already in VND.
 *
 * Mirrors the server's own rule in `goal-projection.ts` — round, then clamp to
 * 100 — so every percentage on the goal screen agrees. The screen shows more
 * than one: the projection panel reads `progressPercent` off the API, while the
 * scheduled-outflow section has to derive before/after figures the server sends
 * only as amounts. Those two used to round differently, and a goal at 99,6tr of
 * 100tr showed "100%" in one place and "99,6%" in the other, on the same page.
 *
 * Clamped at 100 rather than reporting 104%: past the target the goal is done,
 * and the surplus is a different fact from the progress this number reports.
 *
 * `null` when there is no target to measure against — a goal with none has no
 * meaningful percentage, and 0% would read as "no progress" rather than "not
 * applicable", so the caller can drop the row instead of printing a wrong one.
 */
export function goalPercent(amount: number, target: number): number | null {
  if (!(target > 0)) return null
  return Math.min(100, Math.max(0, Math.round((amount / target) * 100)))
}

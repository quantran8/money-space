/**
 * Goal projection (spec §20, §26C). Mirrors the backend's `goal-projection.ts`.
 *
 * `reason` is a machine code the client renders. `no_contribution` is the
 * important one: when the household has not declared a monthly contribution
 * there is NO honest projected date, so the UI must show **progress only** —
 * inventing a date from past behaviour would be a guess presented as a fact.
 */
export type GoalProjectionReason =
  | 'ok'
  | 'already_complete'
  | 'no_contribution'
  | 'no_target_date'
  | 'target_date_passed'
  | 'goal_inactive'

export type GoalProjection = {
  goalId: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  progressPercent: number
  plannedMonthlyContribution: number | null
  estimatedMonthsToGoal: number | null
  projectedCompletionDate: string | null
  targetDate: string | null
  monthsUntilTargetDate: number | null
  /** The Goals-screen number: "to hit Jun 2029, add ~X/month" (04 §8). */
  requiredMonthlyContributionForTargetDate: number | null
  onPaceForTargetDate: boolean | null
  /** Positive = projected to land later than the target date. */
  paceGapMonths: number | null
  reason: GoalProjectionReason
}

/**
 * Whether a projected completion date can honestly be shown. Phase 8's
 * `goal-projection-panel.tsx` shows progress only when this is false.
 */
export function hasProjectedDate(projection: GoalProjection): boolean {
  return projection.reason !== 'no_contribution' && projection.projectedCompletionDate !== null
}

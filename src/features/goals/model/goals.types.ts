export type GoalPriority = 'high' | 'medium' | 'low'

export type GoalItem = {
  id: string
  name: string
  /**
   * Raw VND amounts; the API sends these. Format for display client-side.
   *
   * Already resolved server-side from the goal's allocations at live asset
   * values — a goal stores no figure of its own.
   */
  currentAmount?: number
  targetAmount?: number
  /** @deprecated legacy formatted strings — no longer sent by the API. */
  current?: string
  /** @deprecated legacy formatted strings — no longer sent by the API. */
  target?: string
  progress: number
  priority: GoalPriority
  note: string
  plannedMonthlyContribution?: number | null
  /** Canonical since Phase 8; the `deadline` alias is gone. */
  targetDate?: string
  projection?: import('@/features/goals/model/goal-projection.types').GoalProjection
}

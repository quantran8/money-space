export type GoalPriority = 'high' | 'medium' | 'low'

export type GoalItem = {
  id: string
  name: string
  /** Raw VND amounts; the API sends these. Format for display client-side. */
  currentAmount?: number
  targetAmount?: number
  /** @deprecated legacy formatted strings — no longer sent by the API. */
  current?: string
  /** @deprecated legacy formatted strings — no longer sent by the API. */
  target?: string
  progress: number
  priority: GoalPriority
  note: string
  deadline?: string
}

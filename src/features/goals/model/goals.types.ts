export type GoalPriority = 'high' | 'medium' | 'low'

export type GoalItem = {
  id: string
  name: string
  current: string
  currentAmount?: number
  target: string
  targetAmount?: number
  progress: number
  priority: GoalPriority
  note: string
  deadline?: string
}

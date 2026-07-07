export type GoalPriority = 'high' | 'medium' | 'low'

export type GoalItem = {
  id: string
  name: string
  current: string
  target: string
  progress: number
  priority: GoalPriority
  note: string
}

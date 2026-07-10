import { apiRequest } from '@/shared/api/http'

export type GoalRecord = {
  id: string
  name: string
  current: string
  currentAmount: number
  target: string
  targetAmount: number
  progress: number
  priority: 'high' | 'medium' | 'low'
  note: string
  deadline?: string
}

type GoalListResponse = {
  householdId: string
  items: GoalRecord[]
  total: number
}

export type GoalPayload = {
  name: string
  currentAmount?: number
  targetAmount: number
  priority: 'high' | 'medium' | 'low'
  note?: string
  deadline?: string
}

export function listGoals(householdId: string) {
  return apiRequest<GoalListResponse>(`/api/households/${householdId}/financial-goals`)
}

export function createGoal(householdId: string, payload: GoalPayload) {
  return apiRequest<GoalRecord>(`/api/households/${householdId}/financial-goals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGoal(householdId: string, goalId: string, payload: Partial<GoalPayload>) {
  return apiRequest<GoalRecord>(`/api/households/${householdId}/financial-goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteGoal(householdId: string, goalId: string) {
  return apiRequest<{ deleted: boolean; goalId: string }>(
    `/api/households/${householdId}/financial-goals/${goalId}`,
    {
      method: 'DELETE',
    },
  )
}

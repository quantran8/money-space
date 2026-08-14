import { apiRequest } from '@/shared/api/http'
import type { GoalProjection } from '@/features/goals/model/goal-projection.types'

export type GoalRecord = {
  id: string
  name: string
  currentAmount: number
  targetAmount: number
  progress: number
  priority: 'high' | 'medium' | 'low'
  note: string
  plannedMonthlyContribution?: number | null
  /** The canonical field. The pre-v3.1 `deadline` alias is gone (Phase 8). */
  targetDate?: string
  /** Attached when the request asks for `?include=projection` (§26C). */
  projection?: GoalProjection
}

type GoalListResponse = {
  householdId: string
  items: GoalRecord[]
  total: number
}

export type GoalPayload = {
  name: string
  targetAmount: number
  priority: 'high' | 'medium' | 'low'
  note?: string
  plannedMonthlyContribution?: number
  targetDate?: string
}

/**
 * Create accepts one extra field: `currentAmount`, so onboarding can record
 * savings that predate the app ("we already have 200M toward the house") — there
 * is no honest contribution event to invent for those, and deriving would show 0.
 *
 * It is deliberately absent from {@link GoalPayload}, which types the PATCH body:
 * `UpdateFinancialGoalDto` omits it server-side, so after creation the only thing
 * that may move the stored total is a `goal_contribution` money event. That keeps
 * the column and the event history from diverging.
 */
export type CreateGoalPayload = GoalPayload & {
  currentAmount?: number
}

/** Always asks for projections — every goal surface in v3.1 shows one. */
export function listGoals(householdId: string) {
  return apiRequest<GoalListResponse>(
    `/api/households/${householdId}/financial-goals?include=projection`,
  )
}

export function getGoalProjection(householdId: string, goalId: string) {
  return apiRequest<GoalProjection>(
    `/api/households/${householdId}/financial-goals/${goalId}/projection`,
  )
}

export function createGoal(householdId: string, payload: CreateGoalPayload) {
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

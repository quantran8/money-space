import { apiRequest } from '@/shared/api/http'
import type { GoalProjection } from '@/features/goals/model/goal-projection.types'

export type GoalAllocationKind = 'fixed' | 'percent'

/**
 * What a share is FOR. Both count towards the goal's progress; only
 * `contribution` counts towards its monthly pace.
 *
 * `holding` is value already accumulated (gold, stocks) — it moves with the
 * market, which is not the household keeping or missing a savings pace.
 * `contribution` is the wallet money flows through, and a wallet has no market
 * price. The household chooses; the asset type only seeds the default.
 */
export type GoalAllocationRole = 'contribution' | 'holding'

/** One asset's share of an `asset_backed` goal. */
export type GoalAllocationRecord = {
  id: string
  financialGoalId: string
  assetId: string
  kind: GoalAllocationKind
  role: GoalAllocationRole
  /** Set when `kind = 'fixed'`. The declared amount. */
  allocatedAmount: number | null
  /** Set when `kind = 'percent'`. */
  percent: number | null
  /** The asset's whole current value, for context next to the claim. */
  assetValue: number
  /**
   * What this claim is worth right now. For a `fixed` claim this is capped at
   * `assetValue`, so a fallen asset shows less than was declared — that is the
   * truth, not a bug to fix.
   */
  currentValue: number
  /**
   * What this wallet puts into the goal each month, when it declares an amount.
   * Only a `contribution` share of a cash / bank account can carry one; the
   * goal's `plannedMonthlyContribution` is the sum across its shares.
   */
  monthlyContribution?: number | null
  note: string
}

export type GoalRecord = {
  id: string
  name: string
  /**
   * The money actually behind the goal, already resolved server-side from its
   * allocations at live asset values. Read this; never recompute it.
   */
  currentAmount: number
  targetAmount: number
  progress: number
  priority: 'high' | 'medium' | 'low'
  note: string
  /**
   * The declared pace. READ-ONLY: the server keeps it as the sum of what the
   * goal's wallet shares say they put in each month, so it is changed by editing
   * those shares, never by sending this field.
   */
  plannedMonthlyContribution?: number | null
  /** The canonical field. The pre-v3.1 `deadline` alias is gone (Phase 8). */
  targetDate?: string
  /** Attached when the request asks for `?include=projection` (§26C). */
  projection?: GoalProjection
  /** Attached on the single-goal read only. */
  allocations?: GoalAllocationRecord[]
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
  targetDate?: string
}

/**
 * Create takes the goal AND the assets behind it, in one call.
 *
 * At least one allocation is required, and at least one of them must be a cash
 * or bank account: a goal is a set of shares of real assets, so one with no
 * shares has no progress and no way to gain any — and money is only ever put in
 * through a wallet, so a goal backed by gold alone is one nobody can save
 * towards. "Set aside 100tr from shared money" is a fixed 100tr share of the
 * wallet holding it — shared money is not a separate kind of money.
 *
 * The goal's monthly pace is not sent here either: it is declared per wallet, as
 * `monthlyContribution` on the shares below.
 *
 * `allocations` is absent from {@link GoalPayload} (which types the PATCH body)
 * because shares are edited one at a time through their own routes, where each
 * write is checked against what the asset still has free.
 */
export type CreateGoalPayload = GoalPayload & {
  allocations: GoalAllocationPayload[]
}

export type GoalAllocationPayload = {
  /** Omit to take the asset type's default (wallet → `contribution`). */
  role?: GoalAllocationRole
  assetId: string
  kind: GoalAllocationKind
  /**
   * What this wallet puts in each month. Accepted only on a `contribution`
   * share of a cash / bank account — a pace has to name the account the money
   * comes out of. Send `null` to stop declaring one.
   */
  monthlyContribution?: number | null
  allocatedAmount?: number
  percent?: number
  note?: string
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

/** One goal with its projection and, for `asset_backed`, its allocations. */
export function getGoal(householdId: string, goalId: string) {
  return apiRequest<GoalRecord>(
    `/api/households/${householdId}/financial-goals/${goalId}`,
  )
}

export function listGoalAllocations(householdId: string, goalId: string) {
  return apiRequest<{ items: GoalAllocationRecord[]; total: number }>(
    `/api/households/${householdId}/financial-goals/${goalId}/allocations`,
  )
}

export function createGoalAllocation(
  householdId: string,
  goalId: string,
  payload: GoalAllocationPayload,
) {
  return apiRequest<GoalAllocationRecord>(
    `/api/households/${householdId}/financial-goals/${goalId}/allocations`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function updateGoalAllocation(
  householdId: string,
  goalId: string,
  allocationId: string,
  payload: Partial<Omit<GoalAllocationPayload, 'assetId'>>,
) {
  return apiRequest<GoalAllocationRecord>(
    `/api/households/${householdId}/financial-goals/${goalId}/allocations/${allocationId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export function deleteGoalAllocation(
  householdId: string,
  goalId: string,
  allocationId: string,
) {
  return apiRequest<{ deleted: boolean; allocationId: string }>(
    `/api/households/${householdId}/financial-goals/${goalId}/allocations/${allocationId}`,
    { method: 'DELETE' },
  )
}

/** One month of a goal's history: what went in, against the declared pace. */
export type GoalMonthProgress = {
  /** `YYYY-MM`. */
  month: string
  /** Total progress at the month's close, market value included. */
  endAmount: number
  /**
   * The part of `endAmount` being HELD rather than contributed through — gold,
   * stocks, crypto. Kept apart from the pace so the two are never read as one.
   */
  holdingsAmount: number
  /**
   * How much the household PUT IN that month — contribution shares only, so
   * gold repricing never lands here. `null` means "we cannot say": the first
   * month on record, a month frozen before contributions were tracked, or a
   * running month whose predecessor has no close.
   */
  delta: number | null
  planned: number | null
  /** `delta - planned`; negative means the month fell short. */
  gap: number | null
  /**
   * The month still running: `delta` is measured to right now, not to a
   * month-end close, so it is partial and will keep moving. Shown so a
   * household can see where it stands without waiting for the month to end.
   */
  inProgress: boolean
}

export function getGoalMonthlyProgress(householdId: string, goalId: string) {
  return apiRequest<{
    goalId: string
    plannedMonthlyContribution: number | null
    months: GoalMonthProgress[]
  }>(
    `/api/households/${householdId}/financial-goals/${goalId}/monthly-progress`,
  )
}

/**
 * Why the goal's figure moved since the last frozen point.
 *
 * A goal backed by gold reprices on its own, so the number can change with the
 * household having done nothing. The figure is right — freezing gold at its
 * assigned value would have the goal claim 250tr that would fetch 240tr — so
 * what was missing is the explanation, not a different number.
 */
export type GoalProgressChange = {
  /** `YYYY-MM-DD` of the point being compared against. */
  previousDate: string
  previousAmount: number
  currentAmount: number
  /** Signed change since `previousDate`. */
  delta: number
  /** The assets behind it, biggest mover first. Only assets that moved appear. */
  reasons: Array<{ assetId: string; assetName: string; delta: number }>
}

export function getGoalProgressChange(householdId: string, goalId: string) {
  return apiRequest<{
    goalId: string
    /** Null when nothing moved, or the goal has no earlier point to compare to. */
    change: GoalProgressChange | null
  }>(`/api/households/${householdId}/financial-goals/${goalId}/progress-change`)
}

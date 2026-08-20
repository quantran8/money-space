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

/**
 * Which goals already draw on one wallet.
 *
 * A wallet feeding a single goal has nothing to divide. The question only
 * arises once a second goal at the SAME priority joins it, and the create form
 * cannot see that on its own — it holds one goal and no view of the others.
 */
export type GoalWalletUsage = {
  assetId: string
  /** What is left of the wallet after every goal's claim on it. */
  freeAmount: number
  goals: Array<{
    goalId: string
    name: string
    priority: 'high' | 'medium' | 'low'
    monthlyContribution: number | null
    sharePercent: number | null
  }>
}

type GoalListResponse = {
  householdId: string
  items: GoalRecord[]
  total: number
  /** Attached when the request asks for `?include=walletUsage`. */
  walletUsage?: GoalWalletUsage[]
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
  /**
   * This goal's share (1–100) of the wallet's remaining monthly room, used only
   * when goals tied at the same priority cannot all be paid in full. Send it
   * when the chosen wallet already backs another goal at the same priority —
   * that is the tie `priority` cannot break.
   */
  sharePercent?: number | null
  allocatedAmount?: number
  percent?: number
  note?: string
}

/**
 * Always asks for projections — every goal surface in v3.1 shows one — and for
 * wallet usage, which the create form needs to know whether to ask for a share.
 */
export function listGoals(householdId: string) {
  return apiRequest<GoalListResponse>(
    `/api/households/${householdId}/financial-goals?include=projection,walletUsage`,
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

/** One goal's claim on an asset, as the asset's own page reads it. */
export type AssetGoalClaim = {
  goalId: string
  goalName: string
  priority: 'high' | 'medium' | 'low'
  allocationId: string
  kind: GoalAllocationKind
  role: GoalAllocationRole
  allocatedAmount: number | null
  percent: number | null
  monthlyContribution: number | null
  sharePercent: number | null
  /** What this claim is worth right now, capped at the asset's value. */
  currentValue: number
  /**
   * What this goal is counted as holding from the asset ALL IN — set aside plus
   * its share of this month's pace. The figure to show under "đang tính";
   * `currentValue` is only the set-aside half.
   */
  countedValue: number
}

export type AssetGoalUsage = {
  householdId: string
  assetId: string
  assetValue: number
  /**
   * Money SET ASIDE against it — the same sum the write path enforces.
   *
   * Excludes the monthly paces on purpose: a pace does not stop a new
   * allocation from claiming the same money. Pair with `freeAmount`.
   */
  claimedAmount: number
  /** What a new claim would still be allowed to take. */
  freeAmount: number
  /**
   * Everything the goals claim ALL IN — set aside plus what this month's paces
   * can still draw from the room left over. The same resolver the dashboard's
   * "đã có nhiệm vụ" uses, so the two screens cannot disagree.
   */
  committedAmount: number
  /**
   * How much of this wallet has no job yet.
   *
   * The figure to show for "chưa dành cho mục tiêu nào" — NOT `freeAmount`,
   * which answers the write path's question instead. A 52tr wallet with 20tr
   * set aside and two goals each promising 20tr/month has `freeAmount` 32tr but
   * `unassignedAmount` 0: both paces are drawing on that 32tr.
   */
  unassignedAmount: number
  items: AssetGoalClaim[]
  total: number
}

/**
 * Which goals an asset is backing, and how much of it is still free.
 *
 * Served by the goals module even though the path is under assets — the answer
 * needs goals, and the module edge only runs one way.
 */
export function getAssetGoalUsage(householdId: string, assetId: string) {
  return apiRequest<AssetGoalUsage>(
    `/api/households/${householdId}/assets/${assetId}/goal-usage`,
  )
}

export interface GoalSpendImpactItem {
  goalId: string
  goalName: string | null
  /** What the goal is counted as holding from this wallet before the spend. */
  before: number
  after: number
  /** How much this goal loses. Always positive — untouched goals are omitted. */
  reduction: number
  /**
   * Which half gave way: this month's contribution, or money already set aside.
   * Different events for the household — a month of saving paused, versus the
   * goal moving backwards — so they are never reported as one total.
   */
  paceReduction: number
  setAsideReduction: number
}

export interface SpendImpact {
  assetId: string
  assetValue: number
  amount: number
  assetValueAfter: number
  totalReduction: number
  /** Across every goal — this month's contribution given up. */
  totalPaceReduction: number
  /** Across every goal — money already set aside taken back out. */
  totalSetAsideReduction: number
  /** Biggest loser first, so the goal paying most is the one you read first. */
  goals: GoalSpendImpactItem[]
  /** True when the wallet cannot cover the spend at all — a separate sentence. */
  exceedsWallet: boolean
}

/**
 * What spending from a wallet would cost the goals saving into it.
 *
 * The server's figure of record. **The web form does not call this** — it
 * computes the same answer locally (`goals/model/spend-impact.ts`) so the
 * warning appears as the household types, with no round trip to race against a
 * quick save. Kept because it is the shared contract other clients read, and
 * because it is what the local copy is verified against.
 */
export function getSpendImpact(
  householdId: string,
  assetId: string,
  amount: number,
) {
  return apiRequest<SpendImpact>(
    `/api/households/${householdId}/assets/${assetId}/spend-impact?amount=${encodeURIComponent(amount)}`,
  )
}

/**
 * What money already scheduled to leave this goal's wallets will cost it.
 *
 * `null` when nothing is scheduled that touches them — the section then does not
 * render at all. Deliberately ONE call rather than a projected field on every
 * metric: the same fact spread across four numbers fragments the story and
 * leaves the cause (a named bill, on a date) nowhere to live.
 */
export type ScheduledOutflowImpact = {
  goalId: string
  /** Last day covered — the end of the current month. */
  throughDate: string
  events: {
    id: string
    name: string
    amount: number
    expectedDate: string
    assetId: string
    assetName: string
  }[]
  outflowAmount: number
  currentAmount: number
  projectedAmount: number
  /** The declared pace, left alone — see `currentPace` / `projectedPace`. */
  plannedMonthlyContribution: number | null
  currentPace: number
  projectedPace: number
}

export function getScheduledOutflowImpact(householdId: string, goalId: string) {
  return apiRequest<ScheduledOutflowImpact | null>(
    `/api/households/${householdId}/financial-goals/${goalId}/scheduled-outflow-impact`,
  )
}

export function getGoalMonthlyProgress(householdId: string, goalId: string) {
  return apiRequest<{
    goalId: string
    plannedMonthlyContribution: number | null
    months: GoalMonthProgress[]
    /**
     * True when a wallet had to be divided without the household having said
     * how — the figure stands, but it was a fallback rather than their choice,
     * so the panel asks instead of presenting it as settled.
     */
    needsShareDecision?: boolean
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

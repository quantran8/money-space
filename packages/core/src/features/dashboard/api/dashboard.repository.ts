import { apiRequest } from '#/shared/api/http'

export type DashboardOverview = {
  updatedAt: string
  /** Raw VND amounts; format for display with `formatVndShort`. */
  liquid: number
  liquidSplit: {
    cash: number
    account: number
  }
  savings: number
  debt: number
  netWorth: number
  /**
   * How much of the household's money already has a job — the sum of every
   * goal's progress, capped at total assets.
   *
   * A DISPLAY split, not a deduction: `netWorth` above is NOT reduced by it,
   * and flexible money keeps its own formula. Setting money aside for a goal
   * does not make a household poorer.
   */
  earmarkedForGoals: number
  /** `netWorth`'s asset side minus the above, floored at 0. */
  unassigned: number
  attentionCount: number
}

/**
 * The dashboard endpoint returns a rich object; the client only consumes the
 * `snapshot` block (assets/payments/etc. come from their own feature hooks).
 */
type DashboardResponse = {
  snapshot?: Partial<DashboardOverview> | null
}

const EMPTY_OVERVIEW: DashboardOverview = {
  updatedAt: '',
  liquid: 0,
  liquidSplit: { cash: 0, account: 0 },
  savings: 0,
  debt: 0,
  netWorth: 0,
  earmarkedForGoals: 0,
  unassigned: 0,
  attentionCount: 0,
}

export type AttentionItem = {
  title: string
  reason: string
  level: string
}

export async function getDashboard(householdId: string): Promise<DashboardOverview> {
  const response = await apiRequest<DashboardResponse>(
    `/households/${householdId}/dashboard`,
  )
  // Merge onto defaults so a partial/empty snapshot never yields undefined fields.
  return { ...EMPTY_OVERVIEW, ...(response.snapshot ?? {}) }
}

export function listAttentionItems(householdId: string) {
  return apiRequest<{ householdId: string; items: AttentionItem[]; total: number }>(
    `/households/${householdId}/attention-items`,
  )
}

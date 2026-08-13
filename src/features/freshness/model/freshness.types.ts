/**
 * Data freshness (04 §12).
 *
 * How much the household can trust the numbers they are being shown. This is
 * **not** a nag: a stale value is a fact about the data, never a failing of the
 * user. Copy must stay calm and never imply neglect.
 */
export type FreshnessState = 'fresh' | 'aging' | 'stale' | 'unknown'

export type UpdateFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly'

export type FreshnessItem = {
  assetId: string
  name: string
  liquidity: string
  currentValue: number
  valueUpdatedAt: string | null
  state: FreshnessState
  daysSinceUpdate: number | null
}

export type DataFreshnessResult = {
  householdId: string
  asOfDate: string
  updateFrequency: UpdateFrequency
  staleAfterDays: number
  counts: Record<FreshnessState, number>
  /**
   * The OLDEST value bounds how much the whole picture can be trusted — one
   * stale bank balance undermines the forecast however fresh the rest is.
   */
  oldestDaysSinceUpdate: number | null
  /** A single flag Home can act on without re-deriving the rule. */
  needsAttention: boolean
  items: FreshnessItem[]
  total: number
}

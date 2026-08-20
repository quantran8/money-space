export const queryKeys = {
  households: ['households'] as const,
  household: (householdId: string) => ['households', householdId] as const,
  assets: (householdId: string) => ['households', householdId, 'assets'] as const,
  assetSummary: (householdId: string) => ['households', householdId, 'assets', 'summary'] as const,
  assetSnapshots: (householdId: string) =>
    ['households', householdId, 'assets', 'snapshots'] as const,
  assetValueHistory: (householdId: string, assetId: string) =>
    ['households', householdId, 'assets', assetId, 'value-history'] as const,
  symbolSearch: (assetClass: string, query: string) =>
    ['market-data', 'symbols', assetClass, query] as const,
  debts: (householdId: string) => ['households', householdId, 'debts'] as const,
  goals: (householdId: string) => ['households', householdId, 'goals'] as const,
  /**
   * One goal's asset allocations. Nested under `goals` so invalidating the goals
   * list also refreshes every open allocation panel — an allocation IS the
   * goal's progress, so the two can never be stale relative to each other.
   */
  goalAllocations: (householdId: string, goalId: string) =>
    ['households', householdId, 'goals', goalId, 'allocations'] as const,
  /**
   * Which goals one ASSET is backing, and how much of it is still free.
   *
   * Nested under `goals` rather than `assets`: the answer changes when an
   * allocation is written, and the goals prefix is what every allocation write
   * already invalidates. Under `assets` it would go stale until the asset itself
   * happened to change.
   */
  assetGoalUsage: (householdId: string, assetId: string) =>
    ['households', householdId, 'goals', 'asset-usage', assetId] as const,
  /** One goal's month-by-month history, frozen into snapshots. */
  goalMonthlyProgress: (householdId: string, goalId: string) =>
    ['households', householdId, 'goals', goalId, 'monthly-progress'] as const,
  /** Why one goal's figure moved since the last frozen point. */
  goalProgressChange: (householdId: string, goalId: string) =>
    ['households', householdId, 'goals', goalId, 'progress-change'] as const,
  goalProjection: (householdId: string, goalId: string) =>
    ['households', householdId, 'goals', goalId, 'projection'] as const,
  members: (householdId: string) => ['households', householdId, 'members'] as const,
  /** Pending invite tokens for a household — the inviter's side (QR + link). */
  invites: (householdId: string) => ['households', householdId, 'invites'] as const,
  /**
   * The invitee's pre-accept preview. NOT under `households` — the person
   * holding the token has no household yet, which is the whole point.
   */
  invitePreview: (token: string) => ['invites', token] as const,
  payments: (householdId: string) => ['households', householdId, 'payments'] as const,

  // --- v3.1 foresight ------------------------------------------------------
  /** Stored cashflow event rows (the CRUD list), not forecast occurrences. */
  cashflowEvents: (householdId: string) =>
    ['households', householdId, 'cashflow-events'] as const,
  /** Virtual occurrences expanded across a horizon — the Upcoming timeline. */
  cashflowOccurrences: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'cashflow-events', 'occurrences', horizonDays] as const,
  /**
   * Forecast + flexible money + financial state share ONE cache entry, because
   * they share one request (`GET /forecast-bundle`) — the latter two are pure
   * functions of the forecast. `useForecast`, `useFlexibleMoney` and
   * `useFinancialState` all read this key and select their slice out of it.
   */
  forecastBundle: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'forecast-bundle', horizonDays] as const,
  /**
   * Prefix key covering every horizon. Anything that moves money — an asset, a
   * debt, a cashflow event, a money event, a freshness confirmation
   * — should invalidate THIS, not a hand-listed subset of the three old keys.
   */
  forecastBundleAll: (householdId: string) =>
    ['households', householdId, 'forecast-bundle'] as const,
  freshness: (householdId: string) => ['households', householdId, 'data-freshness'] as const,
  events: (householdId: string, month?: string) =>
    ['households', householdId, 'events', month ?? 'all'] as const,
  eventsSummary: (householdId: string, month?: string) =>
    ['households', householdId, 'events', 'summary', month ?? 'current'] as const,
  eventCategories: (householdId: string) =>
    ['households', householdId, 'event-categories'] as const,
  dashboard: (householdId: string) => ['households', householdId, 'dashboard'] as const,
  /** The household journal. `limit` distinguishes Home's peek from the page. */
  activity: (householdId: string, limit?: number) =>
    ['households', householdId, 'activity', limit ?? 'all'] as const,
  attentionItems: (householdId: string) =>
    ['households', householdId, 'attention-items'] as const,
} as const

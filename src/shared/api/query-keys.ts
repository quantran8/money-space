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
  goalProjection: (householdId: string, goalId: string) =>
    ['households', householdId, 'goals', goalId, 'projection'] as const,
  members: (householdId: string) => ['households', householdId, 'members'] as const,
  payments: (householdId: string) => ['households', householdId, 'payments'] as const,

  // --- v3.1 foresight ------------------------------------------------------
  /** Stored cashflow event rows (the CRUD list), not forecast occurrences. */
  cashflowEvents: (householdId: string) =>
    ['households', householdId, 'cashflow-events'] as const,
  /** Virtual occurrences expanded across a horizon — the Upcoming timeline. */
  cashflowOccurrences: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'cashflow-events', 'occurrences', horizonDays] as const,
  forecast: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'forecast', horizonDays] as const,
  flexibleMoney: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'flexible-money', horizonDays] as const,
  financialState: (householdId: string, horizonDays: number) =>
    ['households', householdId, 'financial-state', horizonDays] as const,
  reserves: (householdId: string) => ['households', householdId, 'protected-reserves'] as const,
  freshness: (householdId: string) => ['households', householdId, 'data-freshness'] as const,
  events: (householdId: string, month?: string) =>
    ['households', householdId, 'events', month ?? 'all'] as const,
  eventsSummary: (householdId: string, month?: string) =>
    ['households', householdId, 'events', 'summary', month ?? 'current'] as const,
  eventCategories: (householdId: string) =>
    ['households', householdId, 'event-categories'] as const,
  dashboard: (householdId: string) => ['households', householdId, 'dashboard'] as const,
  attentionItems: (householdId: string) =>
    ['households', householdId, 'attention-items'] as const,
} as const

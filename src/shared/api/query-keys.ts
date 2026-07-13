export const queryKeys = {
  households: ['households'] as const,
  household: (householdId: string) => ['households', householdId] as const,
  assets: (householdId: string) => ['households', householdId, 'assets'] as const,
  assetSummary: (householdId: string) => ['households', householdId, 'assets', 'summary'] as const,
  assetSnapshots: (householdId: string) =>
    ['households', householdId, 'assets', 'snapshots'] as const,
  assetValueHistory: (householdId: string, assetId: string) =>
    ['households', householdId, 'assets', assetId, 'value-history'] as const,
  debts: (householdId: string) => ['households', householdId, 'debts'] as const,
  goals: (householdId: string) => ['households', householdId, 'goals'] as const,
  members: (householdId: string) => ['households', householdId, 'members'] as const,
  payments: (householdId: string) => ['households', householdId, 'payments'] as const,
  events: (householdId: string, month?: string) =>
    ['households', householdId, 'events', month ?? 'all'] as const,
  eventsSummary: (householdId: string, month?: string) =>
    ['households', householdId, 'events', 'summary', month ?? 'current'] as const,
  dashboard: (householdId: string) => ['households', householdId, 'dashboard'] as const,
  attentionItems: (householdId: string) =>
    ['households', householdId, 'attention-items'] as const,
} as const

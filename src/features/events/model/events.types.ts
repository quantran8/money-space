export type MoneyEventItem = {
  title: string
  amount: string
  note: string
  /** Short display date, e.g. "05 Jul". */
  date: string
  /** Full ISO date (YYYY-MM-DD) used for month grouping and filtering. */
  isoDate: string
  type: 'expense' | 'income' | 'transfer' | 'goal_contribution' | 'debt_update'
  category: string
  direction: 'inflow' | 'outflow' | 'neutral'
  assetId?: string
  assetName?: string
  debtId?: string
}

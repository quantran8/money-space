export type MoneyEventItem = {
  id?: string
  title: string
  amount: string
  amountValue?: number
  note: string
  /** Short display date, e.g. "05 Jul". */
  date: string
  /** Full ISO date (YYYY-MM-DD) used for month grouping and filtering. */
  isoDate: string
  type:
    | 'expense'
    | 'income'
    | 'transfer'
    | 'asset_purchase'
    | 'asset_sale'
    | 'payment_paid'
    | 'goal_contribution'
    | 'debt_update'
    | 'adjustment'
    | 'other'
  category: string
  direction: 'inflow' | 'outflow' | 'neutral'
  assetId?: string
  assetName?: string
  fromAssetId?: string
  toAssetId?: string
  upcomingPaymentId?: string
  financialGoalId?: string
  debtId?: string
}

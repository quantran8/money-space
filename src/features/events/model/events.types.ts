export type MoneyEventItem = {
  id?: string
  title: string
  /** Raw signed VND amount (inflow > 0, outflow < 0); format for display. */
  amount: number
  /** Sale/purchase fee in VND. 0 for non-sale events. See asset-sale. */
  feeAmount?: number
  /** For an asset_sale: resolved sold quantity (market) / value (manual). */
  soldQuantity?: number
  soldValue?: number
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
    // Revaluation: the user re-priced an asset directly. Neutral — moves no
    // wallet, excluded from income/expense. See asset-valuation.
    | 'asset_update'
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

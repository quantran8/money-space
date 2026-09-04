export type MoneyEventItem = {
  id?: string
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
    // A holding that was corrected — not bought, not sold. Neutral for the same
    // reasons as a revaluation, but kept apart from it: that one says the PRICE
    // moved, this says the QUANTITY did. Reporting a re-count as a price move is
    // what made correcting 10 chỉ to 1 chỉ look like a market loss.
    | 'asset_quantity_adjustment'
    | 'payment_paid'
      | 'debt_update'
    | 'adjustment'
    | 'other'
  categoryId: string
  direction: 'inflow' | 'outflow' | 'neutral'
  assetId?: string
  assetName?: string
  fromAssetId?: string
  toAssetId?: string
  cashflowEventId?: string
  financialGoalId?: string
  debtId?: string
  /**
   * Auth profile id of whoever recorded the event. Resolve it against the
   * household's members (`MemberItem.profileId`) to name them — the API sends
   * no name, so a creator who has left the household goes unnamed instead of
   * being reported under a stale one.
   *
   * System-generated events (saving-interest accrual) have no acting member and
   * fall back to the household creator server-side, so this is only trustworthy
   * for events a person actually recorded.
   */
  createdById?: string
}

import { canSettleCashflow, computeCurrentValue } from '@money-space/core/features/assets/model/assets'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

import type { SelectOption } from '@/components/ui'

/**
 * The wallets a cashflow event can settle through, as `Select` options.
 *
 * `canSettleCashflow` is the filter, not a hand-written type check — it mirrors
 * the server, so the picker cannot produce a 400 the household has no way to
 * act on (memory/cashflow-events.md).
 *
 * The balance sits beside the name because **which wallet can carry this spend
 * is the decision being made**, and it cannot be made from names alone. The
 * figure comes from `computeCurrentValue`, the single source of truth for what
 * an asset is worth today.
 */
export function settlementWalletOptions(
  assets: Asset[],
  asOf: string,
  labelWithValue: (params: { name: string; value: string }) => string,
): SelectOption<string>[] {
  return assets.filter(canSettleCashflow).map((asset) => ({
    value: asset.id,
    label: labelWithValue({
      name: asset.name,
      value: formatMoney(computeCurrentValue(asset, asOf) ?? 0),
    }),
  }))
}

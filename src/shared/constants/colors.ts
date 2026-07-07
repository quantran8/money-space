import type { AssetLiquidity } from '@/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Liquidity-group chart palette (validated categorical, see dataviz skill)
// ---------------------------------------------------------------------------

/** One hue per liquidity bucket, in `liquidityOrder`. Text tokens elsewhere. */
export const liquidityColors: Record<AssetLiquidity, string> = {
  usable_now: 'hsl(142 71% 45%)', // status-green — spendable
  not_immediately_usable: 'hsl(211 100% 50%)', // accent/blue — reserve
  long_term: 'hsl(35 100% 50%)', // status-orange — long hold
}

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import type { AssetType } from '@money-space/core/features/assets/model/assets.types'

import { colors } from '@/theme/tokens'

/**
 * One glyph per asset type, the leading mark on a source row.
 *
 * The type used to be named in the metadata line under the asset name, where it
 * competed with the name for the same reading position while saying something
 * the household already knows about its own accounts. As an icon it frees that
 * line for holder and freshness, which are what actually vary between rows.
 *
 * The web's lucide set mapped to the Expo vector equivalents — same meaning per
 * type, so a row reads the same on both clients.
 */
const glyphByType: Record<
  AssetType,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  cash: 'cash',
  bank_account: 'bank',
  saving_deposit: 'piggy-bank',
  bond: 'receipt',
  gold: 'diamond-stone',
  stock: 'chart-line',
  fund: 'chart-line',
  crypto: 'bitcoin',
  foreign_currency: 'currency-usd',
  real_estate: 'home-city',
  insurance: 'shield-check',
  loan_receivable: 'hand-coin',
  certificate_of_deposit: 'receipt',
  investment: 'chart-line',
  other: 'wallet',
}

export function AssetTypeIcon({ type, size = 20 }: { type: AssetType; size?: number }) {
  return (
    <MaterialCommunityIcons
      name={glyphByType[type] ?? 'wallet'}
      size={size}
      color={colors.ink2}
    />
  )
}

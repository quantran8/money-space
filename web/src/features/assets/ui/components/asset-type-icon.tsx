import {
  Banknote,
  Bitcoin,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gem,
  HandCoins,
  Home,
  Landmark,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import type { AssetType } from '@money-space/core/features/assets/model/assets.types'

/**
 * One glyph per asset type, used as the leading mark on a source row.
 *
 * The row used to name the type in a line of `t-caption-sm` under the asset
 * name. That line competed with the name for the same reading position while
 * saying something the household already knows about its own accounts — so the
 * type moves to an icon and the line under the name is freed for holder and
 * freshness, which are what actually vary between rows.
 */
const iconByType: Record<AssetType, LucideIcon> = {
  cash: Banknote,
  bank_account: Landmark,
  saving_deposit: PiggyBank,
  bond: Receipt,
  gold: Gem,
  stock: ChartNoAxesCombined,
  fund: ChartNoAxesCombined,
  crypto: Bitcoin,
  foreign_currency: CircleDollarSign,
  real_estate: Home,
  insurance: ShieldCheck,
  loan_receivable: HandCoins,
  certificate_of_deposit: Receipt,
  investment: ChartNoAxesCombined,
  other: Wallet,
}

export function AssetTypeIcon({ type, className }: { type: AssetType; className?: string }) {
  const Icon = iconByType[type] ?? Wallet
  return <Icon className={className} aria-hidden="true" />
}

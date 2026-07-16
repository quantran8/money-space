import type { Asset, AssetType } from '@/features/assets/model/assets.types'

export type StatusVariant = 'stable' | 'attention' | 'tense'

export type NetWorthBreakdownItem = {
  label: string
  value: string
}

/**
 * Coarse asset buckets used only for the dashboard "Tiền đang ở đâu?" breakdown
 * (mockup: Tiết kiệm / Đầu tư / Vàng / Tiền mặt & tài khoản). Each of the many
 * fine-grained `AssetType`s folds into one of four glanceable groups. The order
 * here is the display order of the legend/segments.
 */
export type AssetBucketKey = 'saving' | 'invest' | 'gold' | 'cash'

const ASSET_BUCKET_FOR_TYPE: Record<AssetType, AssetBucketKey> = {
  cash: 'cash',
  bank_account: 'cash',
  foreign_currency: 'cash',
  saving_deposit: 'saving',
  certificate_of_deposit: 'saving',
  bond: 'saving',
  loan_receivable: 'saving',
  insurance: 'saving',
  gold: 'gold',
  stock: 'invest',
  fund: 'invest',
  crypto: 'invest',
  investment: 'invest',
  real_estate: 'invest',
  other: 'invest',
}

export const ASSET_BUCKET_ORDER: AssetBucketKey[] = ['saving', 'invest', 'gold', 'cash']

export type AssetBucket = {
  key: AssetBucketKey
  value: number
  /** Share of the total, 0–100, rounded to a whole percent. */
  percent: number
}

/**
 * Fold the raw asset list into the four dashboard buckets and attach each one's
 * share of the total. Buckets with no assets are still returned (value 0) so the
 * legend stays stable; the caller decides whether to hide empties.
 */
export function buildAssetBuckets(assets: Asset[]): { buckets: AssetBucket[]; total: number } {
  const totals: Record<AssetBucketKey, number> = { saving: 0, invest: 0, gold: 0, cash: 0 }
  for (const asset of assets) {
    if (asset.status && asset.status !== 'active') continue
    const bucket = ASSET_BUCKET_FOR_TYPE[asset.type] ?? 'invest'
    totals[bucket] += asset.currentValue ?? 0
  }
  const total = ASSET_BUCKET_ORDER.reduce((sum, key) => sum + totals[key], 0)
  const buckets = ASSET_BUCKET_ORDER.map((key) => ({
    key,
    value: totals[key],
    percent: total > 0 ? Math.round((totals[key] / total) * 100) : 0,
  }))
  return { buckets, total }
}

export type ResponsibilityRow = {
  name: string
  initials: string
  count: number
  /** Comma-joined names of the payments this member owns, for the row subtitle. */
  items: string
}

/**
 * Group upcoming payments by the member who owns them (`payment.owner`). Members
 * with at least one payment are sorted by count desc; the count of ownerless
 * payments is returned separately so the caller can show a "chưa phân công" row.
 */
export function buildResponsibility(
  payments: { owner?: string; name: string }[],
): { rows: ResponsibilityRow[]; unassigned: number } {
  const byOwner = new Map<string, string[]>()
  let unassigned = 0
  for (const payment of payments) {
    const owner = payment.owner?.trim()
    if (!owner) {
      unassigned += 1
      continue
    }
    const names = byOwner.get(owner) ?? []
    names.push(payment.name)
    byOwner.set(owner, names)
  }
  const rows: ResponsibilityRow[] = [...byOwner.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, names]) => ({
      name,
      initials: name.slice(0, 1).toUpperCase(),
      count: names.length,
      items: names.join(', '),
    }))
  return { rows, unassigned }
}

export function shortDate(value: string | null | undefined) {
  return (value ?? '').replace('/2026', '')
}

export function dueDate(value: string | null | undefined) {
  return (value ?? '').replace(' Jul', '/07')
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Split a payment's date into the {month, day} parts the calendar pill shows.
 * Prefers an ISO `dueDate` (YYYY-MM-DD); falls back to parsing the "20 Jul" /
 * "20/07" display string. Returns "—"/"·" placeholders when nothing parses.
 */
export function dueParts(
  isoDueDate: string | null | undefined,
  displayDue: string | null | undefined,
): { month: string; day: string } {
  const iso = (isoDueDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const month = MONTH_ABBR[Number(iso[2]) - 1] ?? '—'
    return { month, day: String(Number(iso[3])).padStart(2, '0') }
  }
  const display = displayDue ?? ''
  const named = display.match(/(\d{1,2})\s+([A-Za-z]{3})/)
  if (named) {
    return { month: named[2], day: named[1].padStart(2, '0') }
  }
  const slashed = display.match(/(\d{1,2})\/(\d{1,2})/)
  if (slashed) {
    const month = MONTH_ABBR[Number(slashed[2]) - 1] ?? '—'
    return { month, day: slashed[1].padStart(2, '0') }
  }
  return { month: '—', day: '·' }
}

export function parseCompactMillions(value: string) {
  const normalized = value.trim().toLowerCase().replace(',', '.')
  const amount = Number.parseFloat(normalized.replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(amount)) return 0
  if (normalized.includes('tỷ') || normalized.includes('b')) return amount * 1_000
  if (normalized.includes('nghìn') || normalized.includes('k')) return amount / 1_000
  return amount
}

/** Vietnamese-style month figure, e.g. "4,5" — comma decimal, one decimal place. */
export function formatMonths(value: number) {
  const rounded = Math.round(value * 10) / 10
  const normalized = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return normalized.replace('.', ',')
}

/** Map the attention count into a calm/attention/tense status bucket. */
export function statusVariantFor(attentionCount: number): StatusVariant {
  if (attentionCount > 2) return 'tense'
  if (attentionCount > 0) return 'attention'
  return 'stable'
}

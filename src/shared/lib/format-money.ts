export type DisplayCurrency = 'VND' | 'USD' | 'EUR'

let displayCurrency: DisplayCurrency = 'VND'

export function setDisplayCurrency(currency?: string | null) {
  if (currency === 'VND' || currency === 'USD' || currency === 'EUR') displayCurrency = currency
}

export function getDisplayCurrency(): DisplayCurrency {
  return displayCurrency
}

/**
 * Exactly one decimal place, always — "130,0" not "130" (design.md §10.4, and
 * the §20 examples: `+32,0`, `130,0 tr`).
 *
 * The trailing zero is not cosmetic. In a tabular-nums column the decimal
 * points only line up if every row has one, and a bare "130" beside "118,7"
 * reads as a different precision than it actually is.
 */
function millions(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Exactly two decimals — "1,81 tỷ" (§10.4). At billion scale a single decimal
 * rounds away tens of millions, which is real money to a household.
 */
function billions(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Compact money using the household currency selected in Settings.
 *
 * Follows the §10.4 scale, with the long unit words this helper has always
 * used ("triệu"/"tỷ" rather than the table-scale "tr"):
 *
 *   ≥ 1 tỷ        1,81 tỷ      two decimals — one would round away tens of
 *                              millions at this magnitude
 *   1tr – 999tr   130,0 triệu  always one decimal
 *   < 1 triệu     450.000đ     whole đồng
 *
 * Two things this deliberately does NOT do:
 *  - **No "nghìn" tier.** §10.4 goes straight from triệu to whole đồng.
 *    "500,0 nghìn" is both off-spec and less readable than "500.000đ".
 *  - **No trailing zero below a million.** An estimate to the nearest hundred
 *    thousand must not be dressed up as a precise decimal (§2.16).
 */
export function formatMoney(value: number, currency: DisplayCurrency = displayCurrency): string {
  const amount = Number.isFinite(value) ? value : 0

  if (currency === 'VND') {
    const absolute = Math.abs(amount)
    if (absolute >= 1_000_000_000) return `${billions(amount / 1_000_000_000)} tỷ`
    if (absolute >= 1_000_000) return `${millions(amount / 1_000_000)} triệu`
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/** Compatibility name used throughout the app; now follows the selected currency. */
export function formatVndShort(value: number): string {
  return formatMoney(value)
}

/**
 * Signed short VND, e.g. "+3,4M" / "-3,4M". Use for money events whose amount
 * carries a direction (inflow positive, outflow negative).
 */
export function formatVndSigned(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${formatMoney(Math.abs(value))}`
}

/**
 * The design-system money scale (design.md §10.4).
 *
 *   < 1 triệu     450.000đ
 *   1tr – 999tr   48,2 tr
 *   ≥ 1 tỷ        1,81 tỷ
 *
 * Differs from `formatMoney` in two ways the spec is explicit about: the unit is
 * the short "tr" (tables get crowded fast, and §10.4 puts the unit in the header
 * rather than in every cell), and billions carry TWO decimals — at that scale a
 * single decimal rounds away tens of millions.
 *
 * Only ever applied to VND. A household on another display currency falls
 * through to `formatMoney`, which is currency-aware.
 */
export function formatVndScale(value: number, currency: DisplayCurrency = displayCurrency): string {
  if (currency !== 'VND') return formatMoney(value, currency)

  const amount = Number.isFinite(value) ? value : 0
  const absolute = Math.abs(amount)

  if (absolute >= 1_000_000_000) return `${billions(amount / 1_000_000_000)} tỷ`
  if (absolute >= 1_000_000) return `${millions(amount / 1_000_000)} tr`

  // Below a million the spec shows whole đồng — an estimate to the nearest
  // hundred thousand should not be dressed up as "0,5 tr".
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`
}

/**
 * A money value for use INSIDE a table cell (design.md §10.4).
 *
 * The spec is explicit: *"Trong bảng: bỏ đơn vị ở từng ô, ghi ở header hoặc chú
 * thích cuối bảng. Ngoài bảng: luôn kèm đơn vị."* Repeating "tr" down a column
 * adds four characters per row and no information — the column already says
 * what it holds, and the eye is comparing magnitudes, not reading units.
 *
 * So this returns the bare number: `−12,1`, `+32,0`, `36,1`. The caller MUST
 * declare the unit once, in the column header or a footnote.
 *
 * Everything is expressed in `triệu` regardless of size, because a column that
 * silently switched to `tỷ` on one row would break the comparison the column
 * exists to support — 1,81 tỷ renders as `1.810,0`, which reads correctly
 * against `209,7` in the row above it.
 */
export function formatVndCell(value: number, currency: DisplayCurrency = displayCurrency): string {
  if (currency !== 'VND') return formatMoney(value, currency)

  const amount = Number.isFinite(value) ? value : 0
  return millions(amount / 1_000_000)
}

/**
 * Signed table-cell money, e.g. `+32,0` / `−12,1`.
 *
 * Uses the real minus sign U+2212, not a hyphen (§10.4) — the hyphen is
 * narrower than the plus and makes a signed column look ragged.
 */
export function formatVndCellSigned(value: number): string {
  const formatted = formatVndCell(Math.abs(value))
  return value < 0 ? `−${formatted}` : `+${formatted}`
}

/**
 * A goal/projection date as "Th10 2029" (vi) or "Oct 2029" (en). Goal
 * projections are month-precision by nature — showing an exact day would imply
 * an accuracy the projection does not have.
 */
export function formatMonthYear(isoDate: string, locale = 'vi-VN'): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

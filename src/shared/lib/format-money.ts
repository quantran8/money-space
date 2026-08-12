export type DisplayCurrency = 'VND' | 'USD' | 'EUR'

let displayCurrency: DisplayCurrency = 'VND'

export function setDisplayCurrency(currency?: string | null) {
  if (currency === 'VND' || currency === 'USD' || currency === 'EUR') displayCurrency = currency
}

export function getDisplayCurrency(): DisplayCurrency {
  return displayCurrency
}

function decimal(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
}

/** Compact money using the household currency selected in Settings. */
export function formatMoney(value: number, currency: DisplayCurrency = displayCurrency): string {
  const amount = Number.isFinite(value) ? value : 0

  if (currency === 'VND') {
    const absolute = Math.abs(amount)
    if (absolute >= 1_000_000_000) return `${decimal(amount / 1_000_000_000)} tỷ`
    if (absolute >= 1_000_000) return `${decimal(amount / 1_000_000)} triệu`
    if (absolute >= 1_000) return `${decimal(amount / 1_000)} nghìn`
    return `${new Intl.NumberFormat('vi-VN').format(amount)} đồng`
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

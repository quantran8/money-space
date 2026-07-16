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

/** Format a VND amount as a short "M" figure, matching the app's money style. */
export function formatVndShort(value: number): string {
  const millions = value / 1_000_000
  const rounded = Math.round(millions * 10) / 10
  return `${String(rounded).replace('.', ',')}M`
}

/**
 * Signed short VND, e.g. "+3,4M" / "-3,4M". Use for money events whose amount
 * carries a direction (inflow positive, outflow negative).
 */
export function formatVndSigned(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${formatVndShort(Math.abs(value))}`
}

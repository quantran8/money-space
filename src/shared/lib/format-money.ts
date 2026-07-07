/** Format a VND amount as a short "M" figure, matching the app's money style. */
export function formatVndShort(value: number): string {
  const millions = value / 1_000_000
  const rounded = Math.round(millions * 10) / 10
  return `${String(rounded).replace('.', ',')}M`
}

export type StatusVariant = 'stable' | 'attention' | 'tense'

export type NetWorthBreakdownItem = {
  label: string
  value: string
}

export function shortDate(value: string | null | undefined) {
  return (value ?? '').replace('/2026', '')
}

export function dueDate(value: string | null | undefined) {
  return (value ?? '').replace(' Jul', '/07')
}

export function parseCompactMillions(value: string) {
  return Number(value.replace('M', '').replace(',', '.'))
}

export function formatCompactMillions(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${normalized.replace('.', ',')}M`
}

/** Map the attention count into a calm/attention/tense status bucket. */
export function statusVariantFor(attentionCount: number): StatusVariant {
  if (attentionCount > 2) return 'tense'
  if (attentionCount > 0) return 'attention'
  return 'stable'
}

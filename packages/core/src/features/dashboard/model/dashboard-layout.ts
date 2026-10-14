export const DASHBOARD_WIDGET_IDS = [
  'picture',
  'overdue',
  'bankReview',
  'upcoming',
  'spending',
  'goals',
  'moneySources',
] as const

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number]
export type DashboardWidgetSize = 'half' | 'full'
export type DashboardWidgetItem = { id: DashboardWidgetId; size: DashboardWidgetSize }

/** Order and widths shown until the household customises. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetItem[] = [
  { id: 'picture', size: 'full' },
  { id: 'overdue', size: 'full' },
  { id: 'bankReview', size: 'full' },
  { id: 'upcoming', size: 'full' },
  { id: 'spending', size: 'half' },
  { id: 'goals', size: 'half' },
  { id: 'moneySources', size: 'full' },
]

/** Drops unknown ids and duplicates from a stored layout. */
export function sanitizeDashboardLayout(raw: unknown): DashboardWidgetItem[] {
  if (!Array.isArray(raw)) return DEFAULT_DASHBOARD_LAYOUT
  const seen = new Set<string>()
  const out: DashboardWidgetItem[] = []
  for (const item of raw as Partial<DashboardWidgetItem>[]) {
    const id = item?.id
    if (!id || !DASHBOARD_WIDGET_IDS.includes(id) || seen.has(id)) continue
    seen.add(id)
    out.push({ id, size: item.size === 'half' ? 'half' : 'full' })
  }
  return out
}

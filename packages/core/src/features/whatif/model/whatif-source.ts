import type { WhatIfSource } from '#/shared/stores/whatif-store'

/**
 * Which screen the what-if was opened from, derived from the route.
 *
 * The union has been declared since the sheet was built but was effectively
 * dead: only three call sites ever passed a value, two of them the literal
 * `'other'`, so `whatif_run.source` could not distinguish anything. There is a
 * single entry point — the FAB, present on every screen — so `source` can only
 * mean "which screen was open when it was pressed", and that is exactly what a
 * pathname says.
 *
 * Pure, and pathname-based rather than router-based: core cannot import
 * react-router or expo-router, but the two hosts deliberately mirror each
 * other's paths so one mapper serves both. See memory/what-if.md.
 */
export function sourceForPathname(pathname: string): WhatIfSource {
  // `/goals/:goalId` before `/goals` — the specific route first, or every goal
  // detail would be recorded as the list.
  if (pathname.startsWith('/goals/')) return 'goal-detail'
  if (pathname.startsWith('/goals')) return 'goal'
  if (pathname.startsWith('/upcoming')) return 'upcoming'
  if (pathname === '/') return 'home'
  return 'other'
}

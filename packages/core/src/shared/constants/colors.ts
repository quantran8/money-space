import type { AssetLiquidity } from '#/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Liquidity-group chart palette (design.md §5.4, §2.8)
// ---------------------------------------------------------------------------

/**
 * One fill per liquidity bucket, in `liquidityOrder`.
 *
 * v4.0 encodes liquidity by WEIGHT, not by hue — exactly as the money
 * composition bar does (§5.4). The v3.x palette gave each bucket its own
 * saturated colour (green / blue / orange), which broke two rules at once:
 * amber is reserved entirely for `attention` (§5.4), and spending a third of
 * the screen's colour budget on a neutral breakdown leaves nothing to signal
 * with (§5.2 — "colour is only for things the user must act on").
 *
 * So the ramp runs light → saturated in the direction of usefulness today:
 * long-term holdings recede, money usable now carries the accent.
 *
 * These are `var()` references, so they follow the active palette (Ledger or
 * Archive) instead of pinning literal hex the way the v3.x table did.
 */
export const liquidityColors: Record<AssetLiquidity, string> = {
  usable_now: 'var(--accent)', // spendable today — read this first
  not_immediately_usable: 'var(--protect)', // reserve; neutral, never amber
  long_term: 'var(--committed)', // long hold — palest
}

/**
 * Stroke used to separate adjacent chart marks (pie slices, active dots).
 *
 * Charts sit inside a sunk block, so the separator is the sunk fill itself —
 * v4.0 has no border token to fall back on (§2.2).
 */
export const chartSeparator = 'var(--sunk)'

/** Axis ticks and gridlines. Metadata weight only (§24 — ink3 is never a value). */
export const chartAxis = 'var(--ink3)'
export const chartGrid = 'var(--hair)'

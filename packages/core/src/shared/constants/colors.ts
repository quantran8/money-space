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
 * Alternate liquidity palette: one hue, three weights.
 *
 * `liquidityColors` encodes the ramp with three separate tokens (accent /
 * protect / committed), which are close in weight but not actually the same
 * hue — as rounded donut segments with air between them, the buckets read as
 * three unrelated greys rather than as one quantity split three ways.
 *
 * This set spends a single token and steps it down instead, which is the same
 * move the money-sources rank bars make: weight, not hue (§5.4). The eye reads
 * the ordering off saturation, so "usable now" carries the full accent and
 * long-term holdings recede toward the card.
 *
 * `color-mix` toward `--card` rather than an alpha channel: this chart is used
 * on both the panel and the sunk surface, and a translucent fill would take a
 * different tone on each. Mixing toward the card keeps the ramp identical on
 * both, and keeps it following the active palette (Ledger or Archive).
 */
export const liquidityRampColors: Record<AssetLiquidity, string> = {
  usable_now: 'var(--accent)',
  not_immediately_usable: 'color-mix(in srgb, var(--accent) 55%, var(--card))',
  long_term: 'color-mix(in srgb, var(--accent) 25%, var(--card))',
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

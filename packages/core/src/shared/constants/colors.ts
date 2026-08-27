import type { AssetLiquidity } from '#/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Liquidity-group chart palette (design.md §5.4, §2.8)
// ---------------------------------------------------------------------------

/**
 * One fill per liquidity bucket, in `liquidityOrder`.
 *
 * Liquidity is encoded by WEIGHT within one hue, never by three competing hues
 * — the v3.x palette gave each bucket its own saturated colour (green / blue /
 * orange), which broke two rules at once: amber is reserved entirely for
 * `attention` (§5.4), and spending a third of the screen's colour budget on a
 * neutral breakdown leaves nothing to signal with (§5.2).
 *
 * v4.0 stepped the near-black `--accent` instead, which held the rule but cost
 * the encoding: three steps of a colourless token read as three greys. Both
 * this and `liquidityRampColors` now share the azure ramp below, so the two
 * composition donuts on the assets page can never drift apart.
 *
 * These are `var()` references, so they follow the active palette (Ledger or
 * Archive) instead of pinning literal hex the way the v3.x table did.
 */
export const liquidityColors: Record<AssetLiquidity, string> = {
  usable_now: 'var(--liquidity-1)', // spendable today — read this first
  not_immediately_usable: 'var(--liquidity-2)', // reserve; neutral, never amber
  long_term: 'var(--liquidity-3)', // long hold — palest
}

/**
 * The liquidity ramp: one hue, three monotone lightness steps.
 *
 * `liquidityColors` encodes the ramp with three separate tokens (accent /
 * protect / committed), which are close in weight but not actually the same
 * hue — as rounded donut segments with air between them, the buckets read as
 * three unrelated greys rather than as one quantity split three ways.
 *
 * The earlier fix stepped `--accent` down with `color-mix`, but on this palette
 * `--accent` IS `--action` (near-black #0f1011), so every step measured below
 * the chroma floor — a hue that reads as grey has stopped doing encoding work.
 * The ramp now spends a saturated azure instead, defined per palette in
 * index.css so Ledger and Archive each get steps tuned to their own ground.
 *
 * Liquidity is ORDINAL — the buckets have a fixed order — so lightness, not
 * hue, carries the ordering: it is the one channel that survives greyscale,
 * colour-blindness and a photocopier. "Usable now" takes the deepest step and
 * long-term holdings recede toward the surface.
 */
export const liquidityRampColors: Record<AssetLiquidity, string> = {
  usable_now: 'var(--liquidity-1)',
  not_immediately_usable: 'var(--liquidity-2)',
  long_term: 'var(--liquidity-3)',
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

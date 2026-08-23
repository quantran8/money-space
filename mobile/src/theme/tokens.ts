/**
 * Design v4.2 tokens as JavaScript values.
 *
 * NativeWind covers styling through `className`, but some APIs take colours as
 * props rather than classes — the tab bar, chart fills, icon strokes. Those
 * read from here.
 *
 * This file and `tailwind.config.js` state the same palette twice, which is a
 * real duplication: NativeWind resolves classes at build time and offers no way
 * to read a token back at runtime. When a colour changes, change both.
 */

export const colors = {
  // Three surfaces, separated by lightness only.
  app: '#EEF1F3',
  panel: '#FFFFFF',
  sunk: '#F5F7F8',

  ink: '#15181C',
  ink2: '#525860',
  ink3: '#707780',
  hair: '#E5E9EC',

  interactive: '#0A6B47',
  interactiveSoft: '#E3EFEA',

  attention: '#9A6818',
  attentionSoft: '#F6EDDC',
  alert: '#B23A26',

  committed: '#D2D6DA',
  protect: '#A9B0B8',
} as const

export const radius = {
  panel: 14,
  sunk: 10,
  control: 8,
} as const

/**
 * v4.2 §7. A range, not fixed geometry: low data density means a tighter
 * composition, never the same items stretched further apart.
 */
export const spacing = {
  /** Section → section. */
  section: 16,
  /** Panel padding on a phone (<640). Desktop's 32 never applies here. */
  panel: 20,
  /** Header → body inside a section. */
  header: 24,
  /** A dense row's vertical padding. */
  row: 10,
} as const

/** The minimum touch target, v4.2 §9. Nav, CTA and action links all clear it. */
export const TOUCH_TARGET = 44

/**
 * Liquidity encoded by WEIGHT, not hue (§5.4): money usable today carries the
 * accent, long-term holdings recede. Amber stays reserved for `attention`.
 */
export const liquidityColors = {
  usable_now: colors.interactive,
  not_immediately_usable: colors.protect,
  long_term: colors.committed,
} as const

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
 * The spacing scale, v4.2 §7.
 *
 * Named by JOB, not by size. Six screens each picking their own `mt-3` /
 * `mt-4` / `mt-5` is how the app ended up with thirteen different gaps and a
 * rhythm that changed from tab to tab — a number says nothing about whether
 * two things belong together.
 *
 * §7 calls these a default range rather than fixed geometry: low data density
 * means a TIGHTER composition, never the same items stretched further apart.
 */
export const spacing = {
  /** Between sections of a screen. */
  section: 16,
  /** Panel padding on a phone. Desktop's 32 never applies here. */
  panel: 20,
  /** A section header and the body under it. */
  header: 24,
  /** Between blocks inside one panel. */
  block: 16,
  /** Between a label and the control it names, or two lines of one thought. */
  tight: 8,
  /** A dense row's vertical padding. */
  row: 10,
  /** A list or table and the summary that closes it. */
  summary: 16,
} as const

/**
 * The type scale, v4.2 §5.
 *
 * `secondary` is 14, not 13. The whole supporting layer — a wallet's holder, a
 * relative date, the caveat under a figure — had drifted down to 13 and 12,
 * where `--ink3` on `--sunk` is legible in a screenshot and hard work on a
 * phone held at arm's length. Metadata may be quiet; it may not be unreadable.
 */
export const type = {
  /** The one figure a screen exists to answer. */
  hero: 56,
  /** A second-rank metric. */
  metric: 30,
  /** A metric inside a cell or row. */
  metricSmall: 22,
  /** Screen title. */
  pageTitle: 19,
  /** Section title. */
  sectionTitle: 16,
  /** Body copy. */
  body: 14,
  /** Supporting copy: holders, dates, captions, caveats. */
  secondary: 14,
  /** The smallest text that may carry meaning. Never a money value. */
  caption: 12,
  /** Uppercase semantic label. */
  label: 11,
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

/**
 * Design v5 tokens as JavaScript values.
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
  // v5 surfaces (01-foundations §2.1). Cool cast, tuned so a white card still
  // separates from the canvas now that shadows are gone.
  canvas: '#EDF3F8',
  card: '#FFFFFF',
  wash: '#E3ECF2',
  divider: '#EEF1F2',
  /** The one surface allowed to wear it: the hero card, radius 28. */
  hero: '#B5CDE8',
  heroDeep: '#ACC6E3',
  /** A disabled control's fill — deliberately NOT wash, which reads as usable. */
  fieldDisabled: '#F7F9FA',

  ink: '#0F1011',
  ink2: '#596268',
  ink3: '#6B767C',

  /** Interaction is ink, never green (§4). */
  action: '#0F1011',
  actionInverse: '#FFFFFF',
  actionSoft: '#EEF1F2',
  dataPrimary: '#73A4D7',

  // Fill tones — a dot, a bar, a tick, a destructive background. Anything that
  // must be READ takes the `*Ink` counterpart below.
  positive: '#8FCDA4',
  attention: '#E1BE68',
  attentionSoft: '#F6EDDC',
  alert: '#E8A39A',

  // Text-safe counterparts, all clearing 4.5:1 on a white card. These are DATA
  // tones — direction, provenance — never an interaction colour. A button
  // never wears one.
  positiveInk: '#4E855F',
  dataInk: '#356FA8',
  alertInk: '#A9544D',
  attentionInk: '#8C6817',

  committed: '#D8E0E4',
  protect: '#AFC0C7',

  scrim: 'rgba(15, 16, 17, 0.34)',

  // v4 aliases, kept so a screen mid-migration still resolves.
  app: '#EDF3F8',
  panel: '#FFFFFF',
  sunk: '#E3ECF2',
  hair: '#EEF1F2',
  interactive: '#0F1011',
  interactiveSoft: '#EEF1F2',
} as const

/**
 * v5 geometry (§2.1, §8). Cards grew from 14 to 22, and the hero card owns 28.
 * `control` is a field or a chip; a pill is fully round.
 */
export const radius = {
  hero: 28,
  card: 22,
  control: 14,
  pill: 999,
  // v4 aliases.
  panel: 22,
  sunk: 14,
} as const

/**
 * The spacing scale, v5 §7.
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
 * The type scale, v5 §5.2–5.3 — the same eleven steps the web ships, so a
 * figure reads at the same rank on both clients.
 *
 * Weight falls as size rises: 500 for display and headings, 400 for the money
 * steps, 300 for body and metadata. v4 set money at 300, which is too thin to
 * carry the one number a screen exists to answer.
 */
export const type = {
  /** The landing figure. Rarely used in-app. */
  display: { size: 72, weight: '500', lineHeight: 73, letterSpacing: -2.52 },
  /** The one figure a screen exists to answer. */
  hero: { size: 56, weight: '400', lineHeight: 59, letterSpacing: -2.24 },
  /** A second-rank metric. */
  figure: { size: 40, weight: '400', lineHeight: 44, letterSpacing: -1.4 },
  /** A metric inside a cell or row. */
  metric: { size: 28, weight: '400', lineHeight: 32, letterSpacing: -0.84 },
  /** Screen title. */
  title: { size: 24, weight: '500', lineHeight: 31, letterSpacing: -0.48 },
  /** Section title. */
  subtitle: { size: 20, weight: '500', lineHeight: 27, letterSpacing: -0.2 },
  /** A quiet 20 — a lead line rather than a heading. */
  subhead: { size: 20, weight: '400', lineHeight: 26, letterSpacing: 0 },
  /** Body copy. */
  body: { size: 16, weight: '300', lineHeight: 24, letterSpacing: 0 },
  /** Supporting copy: holders, dates, captions, caveats. */
  bodySm: { size: 14, weight: '300', lineHeight: 21, letterSpacing: 0 },
  /** The smallest text that may carry meaning. Never a money value. */
  caption: { size: 12, weight: '300', lineHeight: 17, letterSpacing: 0 },
  /** The floor. A unit, a tick label. */
  captionSm: { size: 11, weight: '300', lineHeight: 15, letterSpacing: 0 },
} as const

/** The minimum touch target, v5 §9. Nav, CTA and action links all clear it. */
export const TOUCH_TARGET = 44

/**
 * Liquidity ramp — one hue, three monotone lightness steps, so the ordering
 * (usable now → long term) survives greyscale and CVD.
 *
 * v4 encoded this by WEIGHT off the green accent. v5 cannot: the accent IS
 * `--action` (near-black), so that ramp measures below the chroma floor —
 * three greys where the design intends one quantity split three ways.
 */
export const liquidityColors = {
  usable_now: '#0954C4',
  not_immediately_usable: '#3486EA',
  long_term: '#7CB6F3',
} as const

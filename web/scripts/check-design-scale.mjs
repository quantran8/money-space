#!/usr/bin/env node
/**
 * Guards the type and spacing scales (Foundations; index.css §Type, §Spacing).
 *
 * The app once carried 35 distinct font sizes across 800 call sites, because
 * every component wrote its own `text-[13px]`. Nobody chose that — it is what
 * happens when the size is decided at the call site, one component at a time.
 *
 * The nine `.t-*` steps replaced it, and this check is what keeps them:
 * a raw font size in a component is a step that is not on the scale, so it
 * fails the build rather than quietly becoming the tenth.
 *
 * Runs as part of `npm run lint`.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'src')

/** `text-[13px]`, and the Tailwind presets — both bypass the scale. */
const RULES = [
  [/\btext-\[\d+(?:\.\d+)?px\]/g, 'raw font size — use a .t-* step'],
  [
    /(?<![\w-])text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?![\w-])/g,
    'Tailwind preset size — use a .t-* step',
  ],
  // Urbanist ships 300/400/500 only (index.html). 600 is synthesised by the
  // browser: a smeared approximation of a weight the family does not have.
  [/\bfont-(?:semibold|bold|extrabold|black|thin|extralight)\b/g, 'weight not in Urbanist 300/400/500'],
]

/**
 * `t-title` and `t-subtitle` are COMPLETE steps — they set their own size and
 * weight. Pairing one with another `t-*` step or a `font-*` is what let the
 * same section heading render at three different sizes across the app, so the
 * pairing is an error rather than a preference.
 *
 * `t-page-tracking` is deliberately absent: it IS a modifier and is meant to
 * be paired with a step.
 */
const TITLE_CLASSES = /(?<![\w-])(t-title|t-subtitle)(?![\w-])/
const CONFLICTS = /(?:\b(?:sm|md|lg|xl|2xl):)?\b(t-(?:display|hero|figure|metric|subhead|body-sm|body|caption-sm|caption)|font-(?:light|normal|medium|semibold|bold))\b/

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return entry === 'node_modules' ? [] : walk(full)
    return full.endsWith('.tsx') ? [full] : []
  })
}

/**
 * Spacing must land on the Foundations scale: 4 · 8 · 12 · 16 · 20 · 24 · 28 ·
 * 32 · 48, i.e. Tailwind steps 1–8 and 12 (plus 0, and the half-steps Tailwind
 * itself defines for optical work).
 *
 * Unlike type, a plain `mt-4` is fine — spacing only needs naming where the
 * design system makes a promise (card padding, card gap, header→body, dense
 * row, page edge), and those live in the `s-*` classes. What this catches is a
 * step that is not on the scale at all: `gap-14` (56), `py-10` (40), `mt-9`
 * (36) — the values that made the same position render three different ways.
 */
const SPACING_PROPS =
  'p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y'
const ON_SCALE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 12])
const SPACING = new RegExp(
  String.raw`(?<![\w-])(?:(?:sm|md|lg|xl|2xl):)?(${SPACING_PROPS})-(\d+)(?![\w.\[-])`,
  'g',
)
/**
 * Values a layout legitimately needs that are not spacing steps: the mobile
 * nav clearance and the wide page-section rhythm. Listed rather than allowed
 * by range, so adding one is a decision somebody makes on purpose.
 */
const SPACING_ALLOW = new Set([16, 24])

/**
 * Wash is a CONTROL surface (Foundations §2.4): segmented controls, secondary
 * buttons, row hover, selected states, chart beds, skeletons, table headers.
 * It is not a card level, so it must never bed ordinary CONTENT — an empty
 * state, a notice, a summary block, a list item, a whole section.
 *
 * The tell is a static `bg-wash` carrying a text class on a NON-interactive
 * element. Hover/focus/disabled/data- variants are the legitimate uses, and a
 * button or an element with a hover fill is a control by definition — all are
 * excluded, so what is left is wash bedding prose.
 *
 * It cannot see across lines, so a multi-line className or a wrapper whose
 * text sits on a child still needs review by eye. It catches the single-line
 * shape that all nine of the original violations shared.
 */
const WASH_CONTENT = new RegExp(
  String.raw`(?<!hover:)(?<!focus:)(?<!disabled:)(?<!checked:)\bbg-wash\b`,
)
const WASH_CONTENT_TELL = /\btext-center\b|\bt-body-sm\b|\bt-body\b|\bleading-\d/

const violations = []
for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const [pattern, why] of RULES) {
      for (const match of line.matchAll(pattern)) {
        violations.push({ file: relative(root, file), line: i + 1, text: match[0], why })
      }
    }

    for (const m of line.matchAll(SPACING)) {
      const step = Number(m[2])
      if (!ON_SCALE.has(step) && !SPACING_ALLOW.has(step)) {
        violations.push({
          file: relative(root, file),
          line: i + 1,
          text: m[0],
          why: `off the spacing scale (${step * 4}px) — use 4/8/12/16/20/24/28/32/48`,
        })
      }
    }

    // Wash bedding content rather than serving as a control surface.
    if (
      WASH_CONTENT.test(line) &&
      WASH_CONTENT_TELL.test(line) &&
      !/data-\[/.test(line) &&
      // A control: anything that paints a hover state on the same element...
      !/hover:/.test(line) &&
      // ...or an element whose opening tag is a button/link. The tag often
      // sits several lines above its className, so look back a little.
      !/<(?:button|a|Button|Link|NavLink)\b/.test(
        lines.slice(Math.max(0, i - 6), i + 1).join(' '),
      )
    ) {
      violations.push({
        file: relative(root, file),
        line: i + 1,
        text: 'bg-wash + content',
        why: 'wash is a control surface — content sits on the card (§2.4); use spacing or a divider',
      })
    }

    // A title class carrying its own size or weight on top.
    if (TITLE_CLASSES.test(line)) {
      const clash = line.match(CONFLICTS)
      if (clash) {
        violations.push({
          file: relative(root, file),
          line: i + 1,
          text: `${line.match(TITLE_CLASSES)[1]} + ${clash[1]}`,
          why: 'title classes are complete steps — do not add a size or weight',
        })
      }
    }
  })
}

if (violations.length > 0) {
  console.error(`\n✗ design scale — ${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}  — ${v.why}`)
  }
  console.error('\nThe scale is defined in src/index.css:')
  console.error('  t-display 72/500 · t-hero 56/400 · t-figure 40/400 · t-metric 28/400')
  console.error('  t-subhead 20/400 · t-body 16/300 · t-body-sm 14/300')
  console.error('  t-caption 12/300 · t-caption-sm 11/300')
  console.error('  headings: t-title 24/500 · t-subtitle 20/500 (complete — never add a step)')
  console.error('Spacing scale: 4/8/12/16/20/24/28/32/48 (tw 1-8, 12).')
  console.error('  roles: s-card · s-page · s-card-gap · s-head-body · s-split-gap · s-row · s-tap\n')
  process.exit(1)
}

console.log('✓ design scale passed — type on a .t-* step, spacing on the scale')

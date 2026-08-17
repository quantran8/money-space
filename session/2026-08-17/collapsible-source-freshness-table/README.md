# Home §12.1 freshness table + §12.4 ranked bars

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/collapsible-source-freshness-table/`
- **Status**: done

## What the task is

Update `Bức tranh hôm nay` to a supplied HTML mock. The mock keeps the hero, the
totals line and the composition bar as they are, and changes the freshness block:
what was an always-open list of the 4 oldest sources becomes a one-line summary
("8 nguồn · cũ nhất 6 ngày trước") with a `Hiện chi tiết` toggle that opens a
three-column table — Nguồn / Cập nhật / Số tiền.

## Changes made

- `src/components/ui/source-freshness-list.tsx` — rewritten. The rows now render
  as a `<table>` behind a `useState` toggle instead of a `<ul>` that was always
  open. Freshness moved into its own column between the name and the amount.
  Removed the `overflow` prop (no row cap left to overflow); added a required
  `labels` prop carrying the toggle copy and the three column headers, so the
  component still owns no strings (§10.4).
- `src/features/dashboard/model/home-derivations.ts` — `buildCoverage` no longer
  takes a `limit` and returns every `usable_now` source rather than the 4 oldest.
- `src/features/dashboard/ui/components/financial-picture-section.tsx` — passes
  the new `labels`, drops the `Link to="/networth"` overflow, and builds the
  summary line from parts so the count and the age can be weighted separately.
- `src/i18n/resources.ts` (`vi` + `en`) — replaced `home.coverage.summary`,
  `summaryNoAge` and `more` with `sourceCount`, `oldest`, `show`, `hide` and
  `columns.{source,updated,amount}`; `home.location.barsLabel` became
  `Số dư (tr)` / `Balance (M)` now that it is an axis caption, not a chip.

### Follow-up 1 — placement + motion (same day)

- `financial-picture-section.tsx` — the freshness block moved OUT of
  `PanelSplit` to sit below it at full section width. It was nested in the left
  column, which is capped at 380px on `lg`, so the table was squeezed. It also
  qualifies both columns (hero AND composition bar), so scoping it to one
  understated it.
- `source-freshness-list.tsx` — the `hidden` attribute became `AnimatePresence`
  + a `motion.div` height transition (240ms height / 160ms opacity, `easeOut`
  from `components/ui/motion.tsx`, inside that file's 160–260ms budget).
  Dropped `aria-controls`: the table unmounts when collapsed, so it pointed at
  an absent id. `aria-expanded` carries the state.

### Follow-up 2 — §12.4 `Tiền đang ở đâu` to the second mock

- `money-sources-section.tsx` — bars now take **one fill per bar by rank**
  (`RANK_FILL`, accent → ink2 → protect → committed, clamped at the palest step)
  instead of one fill per liquidity group. Added a real x-axis: ticks via
  `formatVndCell` plus the unit caption. The group legend beside the total is
  gone; the left column is just `Tổng giá trị` at 32px.
- `home-derivations.ts` — `buildMoneyLocationMap`'s `ordered` no longer sorts
  `usable_now` before `held`. **This was a required fix, not cosmetic**: with
  rank-based fills, the old split order would have painted the darkest fill on
  the largest *usable* source, so a 30tr holding could render paler than a 2tr
  account. Now a single descending-by-value ranking. `groups`/`totalUsable` are
  still derived (nothing draws `groups` today, but `totalUsable` must keep
  agreeing with §12.1).

## Key decisions

- **The mock's status pill was NOT implemented.** The mock has an "Đang ổn" chip
  to the right of the section title. v11 deliberately removed exactly that chip
  because it states a verdict before the reader has seen anything to verify it
  against (§16 Voice). Confirmed with the user: keep the new layout, leave the
  pill out.
- **Row cap removed rather than kept at 4.** The cap only existed because the
  list was always open and pushed §12.2 (`Ba mươi ngày tới`) toward the fold.
  Collapsed by default, the block can name every source, which is what makes the
  total above it verifiable by addition instead of asserted. Confirmed with the
  user.
- **Summary composed from parts, not one interpolated string.** `Trans` is not
  used anywhere in this repo, and its `count` prop triggers i18next
  pluralisation, so an English `sourceCount` needs `_one`/`_other` — which it now
  has. The count and the age are emphasised by wrapping them in the component.
- **Age copy is relative in both places.** The summary reuses the same
  `formatAge` as the table column ("6 ngày trước", "hôm qua"), so the line and
  the column it summarises read identically. It used to say a raw `{{days}} ngày`.
- **Amber stays conditional.** The oldest age is `text-attention` only when
  `coverage.hasStale` — i.e. past the household's own update frequency, not past
  a fixed number of days (§5.2, §25). The mock hardcodes amber; that would colour
  a perfectly fresh household's oldest source.
- Row hover uses `bg-panel`, not the mock's literal `white`, so it survives the
  warm theme in `src/index.css`.
- **Kept recharts; did not adopt Chart.js.** The §12.4 mock was written against
  Chart.js via CDN. Recharts is already installed and used across the app, does
  this layout natively, and avoids both a second chart library and a CDN script
  tag. Confirmed with the user.
- **Rank fills use tokens, not the mock's hex.** The mock hardcodes `#0A6B47`,
  `#66777F`, `#94A0A6`, `#BCC4C8`. Those are Ledger's values; using `var(--accent)`
  / `--ink2` / `--protect` / `--committed` keeps the ramp correct under Archive.
- **Colour no longer encodes liquidity in §12.4** (user's call: "mỗi bar 1 màu").
  Worth knowing for later: which sources count as usable is now stated ONLY in
  §12.1. If the group legend is ever wanted back, the fills must go back to
  grouped too, or the two will contradict each other.

## Verification

- `npm run build` (tsc -b + vite build) — passes.
- `node scripts/check-copy.mjs` — passes, no banned vocabulary.
- `npm run lint` — 5 errors / 9 warnings, all pre-existing in `router.tsx`,
  `data-table.tsx`, `motion.tsx`, `assets.repository.ts`, `use-asset-sale.ts`,
  `use-assets-page.ts`, `use-events-page.ts`. None in the files touched here.

## Mobile app parity notes

- Port the collapse: summary line + toggle, with the per-source rows hidden by
  default. The table shape itself is web-specific — on mobile the same three
  facts likely want a row layout (name over age, amount right-aligned) rather
  than a real table, but the *collapse* and the *uncapped source list* are the
  behaviour to match.
- `buildCoverage` losing its `limit` argument is a shared-logic change: any
  mobile caller relying on getting only 4 rows must add its own slice.
- **`buildMoneyLocationMap` ordering changed** — `bars` is now ranked purely by
  value. Any mobile code assuming usable-now sources come first is now wrong.
  This is the one change in this session that alters shared derivation output.
- Do NOT port a status pill onto this section.
- The freshness block belongs BELOW the two-column split at full width, not
  inside the left column.

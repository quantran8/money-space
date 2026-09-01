# Mobile: design v5 foundation + section parity with web

- **Date**: 2026-08-31
- **Session folder**: `session/2026-08-31/mobile-design-v5-and-section-parity/`
- **Status**: done

## What the task is

"Đồng bộ các section đã làm trên web xuống mobile."

Mobile was last touched in bulk by the Expo port (2026-08-23). Everything the
web shipped after that — the whole design system v5 migration plus ~10 section
redesigns — had landed on web only. Two gaps, in order:

1. **Foundation.** Mobile was still entirely on v4.2 tokens (green
   `--interactive` as the CTA colour, old surfaces, no v5 type scale) while web
   had migrated to v5.
2. **Sections.** The per-task `Mobile app parity notes` in
   `session/2026-08-2[3-9]/*` and `session/2026-08-31/*` were the authoritative
   task list; they were worked through in full.

Scope was confirmed with the user: foundation first, then all sections from the
session folder, in one pass.

## Changes made

### Foundation (v4.2 → v5)

- `mobile/src/theme/tokens.ts` — rewritten to the v5 palette. `action` (ink)
  splits from `dataPrimary` (blue) and `positive` (green); added the text-safe
  `*Ink` counterparts, `hero`/`heroDeep`, `fieldDisabled`, `scrim`. Radii grew
  (card 14→22, new `hero` 28, `control` 14). `type` became the eleven-step v5
  scale with weight and tracking per step. `liquidityColors` moved off the green
  accent to the three-step azure ramp — the v5 accent IS near-black, so the old
  by-weight ramp measured as three greys.
- `mobile/tailwind.config.js` — same palette as classes, plus a plugin adding
  the `.t-*` type scale (the eleven steps the web ships in `index.css`, with
  `lineHeight` in px since NativeWind has no unitless ratio). v4 names kept as
  aliases so a mid-migration screen still resolves.
- `mobile/app/_layout.tsx` — loads Urbanist 300/400/500 + IBM Plex Mono via
  `@expo-google-fonts/*` (both newly added deps). **Fonts were never actually
  loaded before** — the config named Be Vietnam Pro but nothing registered it,
  so every `font-*` class fell back to the system face. Holds the first frame
  until they land rather than reflowing.
- **78 files migrated mechanically**: every `text-[Npx]` → the nearest `t-*`
  step, `font-medium` dropped where the step already fixes weight, v4 surface
  names → v5, and inline `letterSpacing` tuned to the old sizes removed (the
  step owns tracking now). `text-attention` / `text-alert` → `-ink` variants:
  those fills are 1.8–2.1:1 and fail AA as text.
- `mobile/src/components/ui/panel.tsx` — `Money` takes `step` (a scale rank)
  instead of `size` (a pixel number).
- `mobile/src/components/ui/progress-bar.tsx` — rewritten to the v5 tick
  treatment: fixed 2px/6px pitch, measured with `onLayout` and rendered as a
  tick array (RN has no repeating-gradient). Tone `interactive` → `data`.
- `mobile/src/components/ui/money-composition-ring.tsx` — **new**, replaces
  `money-composition-bar.tsx` (deleted, no remaining consumers). Arcs drawn as
  `stroke-dasharray` runs on one SVG circle.

### Sections

- **Upcoming** (`app/(tabs)/upcoming.tsx`) — was calling `horizonDays` /
  `setHorizonDays`, which core had already replaced with `range` / `setRange`;
  this was a live type error. Now uses the range picker, the windowed `summary`
  and the overdue section.
  - `features/forecast/ui/range-picker.tsx` — **new**, replaces
    `horizon-selector.tsx` (deleted).
  - `features/forecast/ui/overdue-section.tsx` — **new**, incl. the ⋯ menu
    (edit/delete) from the 2026-08-31 web task.
  - `forecast-summary.tsx` — reads `summary` (the selected window) instead of
    `forecast.totals` (the whole fetched horizon); added per-flow counts and the
    truncation warning; dropped the range from its header (§34).
- **What-if** (`features/whatif/`) — result blocks rebuilt consequence-first:
  impact summary → bills → goals → funding source → balance bridge →
  assumptions, incl. the new funding-source block. The sheet now swaps
  form → result instead of stacking them.
- **Assets** (`assets-list-section.tsx`) — flat list → one group per liquidity
  bucket with subtotal + share + source count. Takes `total` (unfiltered) as the
  share denominator.
- **Asset detail** — goal usage uses the ring, free-leads ordering, the
  overdrawn guard; history rows now name who recorded each change.
- **Debt detail** — schedule split into paid/upcoming with cross-group
  numbering; progress line says instalments, not money.
- **Events** — `MonthScope` (**new**) hoisted above the summary; summary panel
  aligned to the web (Dòng tiền title, net leads, moneyIn/moneyOut, positive net
  stays ink); type filter widened to the six-value v5 taxonomy.
- **Goals** — `goal-priority-mark.tsx` (**new**): queen / star / none, on both
  the goals list and Home's goal rows.
- **Household** — name is now an editable field (the backend endpoint exists);
  `sign-out-section.tsx` (**new**) — mobile had **no sign-out at all** after the
  drawer removal.
- **Dashboard chart** — `stepAfter` → monotone cubic (Fritsch–Carlson), matching
  the web.

## Key decisions

- **Foundation before sections.** Doing sections first would have meant styling
  every one twice.
- **v4 token names kept as aliases.** 58 files referenced them; aliasing let the
  migration be mechanical and reviewable instead of a rename storm.
- **`text-attention` / `text-alert` → `-ink` is not cosmetic.** Those fills are
  tuned as fills; as text they fail AA. Every read use was rewritten.
- **`comfortable` what-if result is ink, not green.** v5 §4 reserves `positive`
  for a genuinely good consequence; "this fits" is the absence of a problem.
- **No motion ported with the what-if rebuild.** The web's `RevealSequence` /
  `CountUp` are `motion/react` and were paced for a 56rem dialog watched still.
  The ORDER is the argument and survives without the choreography.
- **Six-value event filter became a `Select`, not a `Segmented`.** Six segments
  at 375pt give ~55pt each — under the 44pt tap floor once padding counts.
- **No custom date range in the mobile range picker.** A two-month range
  calendar does not fit a phone; a `custom` range from a deep link still renders.
- **Monotone, not a plain spline.** Verified over 2000 random series: zero
  overshoot past the data range, so the low-point dot stays the true minimum.
- **`Button` stayed text-only.** The web's sign-out pairs a `LogOut` glyph;
  widening the primitive for one call site is how a kit stops being a kit.

## Verification

`npx tsc --noEmit`, `npx expo lint` and `npx expo export --platform ios` all
pass. The 138 pre-existing `react-hook-form` module-resolution errors are
unchanged from baseline (measured by stashing this work) and are unrelated.

## Known issues (pre-existing, not from this task)

- `assets.form.market.quoteSource` is used in
  `mobile/src/features/assets/components/asset-form-sheet.tsx:776` but exists in
  **neither** locale in `packages/core/src/i18n/resources.ts`. Present in `HEAD`
  too. It renders as the raw key.
- The 138 `react-hook-form` typecheck errors above (`Controller` / `useWatch` /
  `UseFormReturn` reported as missing exports) — a module-resolution issue, not
  a code fault.

## Mobile app parity notes

Direction reversed: this task IS the mobile catch-up. What the **web** should
know:

- `mobile/src/theme/tokens.ts` and `mobile/tailwind.config.js` now state the v5
  palette twice, same as before. A token change still needs both files.
- Mobile now has the same `.t-*` vocabulary as web. A new step added to
  `web/src/index.css` must be added to the tailwind plugin too, or mobile
  silently has no such class.
- No `packages/core` changes were needed — every section was UI-only, and every
  i18n key already existed in both locales.
- Still NOT ported, and deliberately: the web's motion primitives, the what-if
  custom date range, `AssetList`'s table, and every grid/breakpoint layout.

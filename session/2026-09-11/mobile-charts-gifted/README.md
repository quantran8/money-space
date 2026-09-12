# Mobile charts with react-native-gifted-charts

- **Date**: 2026-09-11
- **Session folder**: `session/2026-09-11/mobile-charts-gifted/`
- **Status**: done

## What the task is

Mobile was missing charts the web draws. Add a charting library and build the
missing ones.

The premise turned out to be half wrong: mobile already had four hand-drawn
`react-native-svg` visualisations (composition ring, cashflow delta line, asset
value area, money-location bars). Four web charts had no mobile counterpart, and
**two of those are dead code on the web** — so three were built.

## Changes made

- `mobile/package.json` — added `react-native-gifted-charts@^1.4.78` and
  `expo-linear-gradient@~57.0.2` (its required peer).
- `mobile/src/features/events/ui/events-category-section.tsx` — **new**.
  Category donut + legend for the events screen, ported from the web's
  `events-category-card.tsx`.
- `mobile/app/(tabs)/events.tsx` — mounts it between the summary panel and the
  timeline; destructures `spendingByCategory` / `incomeByCategory`.
- `mobile/src/features/assets/components/assets-summary.tsx` — the liquidity
  weight bar became a donut. The labelled rows under it stay.
- `mobile/src/features/goals/ui/goal-monthly-progress-section.tsx` — added
  `RecentMonthsChart`: six closed months as bars against a dashed rate line.
  The rows stay.
- `mobile/src/features/goals/ui/goal-road-section.tsx` — added `RoadChart`:
  actual vs planned as two lines. Renders only at ≥2 closed months.

## Key decisions

- **Skia was evaluated and rejected.** victory-native v42 drops
  `react-native-svg` and requires `@shopify/react-native-skia`, which costs
  **+6MB iOS / +4MB Android** (Shopify's published figure). gifted-charts runs
  on `react-native-svg`, already in the app, so native growth is **0MB**.
  Measured before deciding: the Skia npm package is 10MB but its real binaries
  ship separately (218MB iOS / 224MB Android unpacked, 4 Android ABIs, 36 `.a`
  static libs — most of it Lottie/SVG/scene-graph that a chart never links).

- **The cashflow delta chart keeps its hand-drawn SVG.** gifted-charts only
  offers a cardinal spline (`CurveType.CUBIC` / `QUADRATIC`), which has no
  tangent clamping. Reproducing its control-point maths and sweeping the curve
  showed **11.6px of overshoot on a 104px well** for a step-shaped series —
  exactly the shape a balance makes when it holds flat then drops on payment
  day. The curve would dip below the real minimum and the amber low-point dot
  would no longer sit at the bottom. The existing Fritsch–Carlson monotone path
  cannot overshoot, so it stays. See `memory/dashboard.md`.

- **`PieChartPro`, not `PieChart`.** The shared `.d.ts` declares
  `curvedStartEdges` / `edgesRadius` for both, but `PieChart/main.js` never
  reads them — only `pro.js` does. Without the Pro renderer the arcs fuse into
  a divided disc, losing what makes it a composition rather than a pie.

- **`initialAngle` is left at its default.** `PieChart` plots `sin` / `−cos`, so
  angle 0 is already 12 o'clock sweeping clockwise. Passing `−π/2` (the recharts
  habit, where `startAngle={90}`) would rotate the ring a quarter turn.

- **Charts were added beside the figures, never instead of them.** Liquidity and
  goal-monthly both keep their rows: those readings are lookups ("how much is
  usable now", "how much in August"), which a figure answers and an arc does
  not. The chart contributes the proportion or the shape.

- **The web's `MemberTotals` block was not ported.** It is four figures that
  belong with the summary panel, not part of a composition. `byMember` stays in
  the props so the signature matches the web.

- **Two web charts were deliberately skipped**: `asset-trend-chart.tsx` (+ its
  `assets-charts.tsx` wrapper) and `debts-insights-section.tsx`. Neither is
  imported anywhere on the web, both still use the pre-v4.2
  `hsl(var(--accent))` / `hsl(var(--border))` tokens, and the debts one
  hardcodes Vietnamese copy. Porting them would be designing two new screens
  from code the product no longer shows, not reaching parity.

## Mobile parity notes

This task IS the mobile side. Nothing to port back to the web, but two things
the web should know:

- `liquidityColors` in `packages/core/src/shared/constants/colors.ts` is a map
  of `var(--…)` strings and is **web-only**. Mobile reads the hex equivalents
  from `mobile/src/theme/tokens.ts`. Any new shared chart colour needs both.
- The two dead web chart files above are still in the tree. They are the only
  remaining users of the removed v4.2 tokens, and `debts-insights-section.tsx`
  would fail the mandatory-i18n rule if it were ever re-mounted. Worth deleting
  from the web rather than leaving as a parity trap.

## Verification

- `npx tsc --noEmit` — clean (the pre-existing `auto-price-row.tsx`
  `setAutoPrice` error is unrelated and untouched).
- `npx expo lint` — 0 errors (3 pre-existing unused-import warnings elsewhere).
- `node ../web/scripts/check-copy.mjs` — passed.
- `npx expo export --platform ios` — bundles; `PieChartPro`,
  `referenceLine1Config`, `strokeDashArray2`, `edgesRadius` and the new i18n
  keys all verified present in the emitted Hermes bytecode.

**Not verified:** nothing was run on a device or simulator. Layout, ring
proportions, bar spacing and the dashed rate-line position are unconfirmed
visually.

# Asset detail redesign

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/asset-detail-redesign/`
- **Status**: done

## What the task is

Rebuild the asset detail page to match the mockup the user supplied. It
restructures the page into four sections:

1. Header — name + asset-type badge, secondary "Chỉnh sửa".
2. **Giá trị & hiệu suất** — the hero value with a quantity · unit-price line,
   then cost basis / P&L / share of total assets across one row.
3. **Giá trị tài sản** — the value chart with range tabs, plus a right rail
   carrying the range delta, its percentage, what moved it, and the legend.
4. **Vai trò trong nhà mình** — reference facts on the left, goal usage right.
5. **Lịch sử thay đổi** — table on desktop, cards on mobile.

## Changes made

- `src/features/assets/ui/asset-detail-page.tsx` — restructured to the four
  sections above. Hero became a single row (4 columns for a market asset, 2
  otherwise). The chart and the info block, previously side-by-side cards in an
  `xl` grid, became two full-width sections. Added the derived `rangeDelta` /
  `rangeDeltaPercent` / `chartMarkers`, an `ActivityCard` for the mobile history,
  and simplified `InfoRow` to a plain label/value pair.
- `src/features/assets/ui/components/asset-value-chart.tsx` — added an optional
  `markers` prop rendering labelled `ReferenceDot`s for holding changes, wired
  the marker label into the tooltip, and switched the x-axis to `dd/MM`.
- `src/features/assets/ui/components/asset-goal-usage-section.tsx` — dropped its
  own `Card` wrapper so it nests as the right column of the role section.
- `src/i18n/resources.ts` — added `assets.detail.chart.*` (range rail, legend,
  descriptions), `assets.detail.hero.title` / `holdingLine` / `shareOfTotal`,
  `assets.detail.info.roleTitle` / `countedIn` / `updatedLabel`, and retitled
  `assets.detail.events` to "Lịch sử thay đổi". Both `vi` and `en`.

## Key decisions

- **The mockup's "+2 chỉ" chart markers have no data source.** The
  `value-history` endpoint returns `{date, value}` only, and
  `asset_value_history` carries no quantity column — so a literal port would
  have meant inventing numbers. The markers are instead derived from the money
  events the page already loads (`relatedEvents`), and are labelled with the
  event's VND effect rather than a quantity delta. If quantity markers are
  wanted, the backend has to expose quantity on the history points first.
- **Markers are capped at 4, chosen by magnitude and then re-sorted by date.**
  Taking the most recent 4 would have stripped every marker off the left half of
  a busy range and left it looking as though nothing happened there.
- **`rangeDelta` is the whole move, price and quantity together** — that is what
  the line draws, and reporting only the price part beside it would describe a
  different chart. The note underneath names the causes.
- **A range starting at zero shows no percentage.** A new asset going 0 → 50tr
  is not "+∞%", it is simply new.
- **The mockup's "Chia sẻ / Hiện chi tiết" row was dropped** — `Asset` has no
  sharing/visibility field, and `holderMemberId` is explicitly documented as
  "not a privacy field". "Tính vào bức tranh" is backed by `asset.liquidity`.
- The chart's range tabs became genuinely usable — the mockup had 6-month and
  1-year disabled, but the page already supports all three.

## Mobile app parity notes

- Port the four-section structure and the new i18n keys.
- The `rangeDelta` / marker-selection logic is pure and transfers directly; the
  recharts rendering is web-specific.
- The desktop table / mobile card split is already the native pattern — mobile
  only needs the card form.

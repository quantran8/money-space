# Net worth summary strip — demo layout

- **Date**: 2026-09-15
- **Session folder**: `session/2026-09-15/networth-summary-strip-demo/`
- **Status**: done

## What the task is

Update the "Giá trị ròng" section on the Tài sản & Nợ page to match a supplied
HTML demo: an edge-to-edge two-column card, a tinted change pill, the two
operands as their own wash tiles, and a titled allocation column.

## Changes made

- `web/src/features/assets/ui/components/assets-summary-strip.tsx`
  - Card is now `p-0` + `overflow-hidden` with padding on each half, so the
    column divider reaches the card edges. Replaces `PanelHeader`/`PanelSplit`
    (grid is `lg:grid-cols-[0.92fr_1.08fr]`, stacking under `lg`).
  - **One title row spanning both halves**: `t-subtitle` "Giá trị ròng" left,
    "Cập nhật {date}" right. Neither column carries a heading of its own.
  - Left column is the hero figure, the change pill, then the two tiles.
  - Day change is a rounded pill (tinted bed, arrow in a white circle) instead
    of a run of caption text.
  - "Tổng tài sản" / "Tổng nợ" are `MetricTile`s — wash bed, icon chip, label,
    `t-metric` figure — replacing the inline caption operands.
  - Right column is `flex flex-col justify-center` — it is shorter than the
    left, so without it the donut rides up against the top of the divider.
- `web/src/features/assets/ui/components/asset-composition-chart.tsx`
  - New optional `legendLabel` prop: a `t-caption` line above the legend, for
    when the chart carries no heading of its own. The other call site
    (`assets-charts.tsx`) omits it and is unchanged.
- `packages/core/src/i18n/resources.ts` (vi + en)
  - New: `assets.demo.totalAssetsLabel`, `totalDebtLabel`;
    `assets.summary.dayChangeSuffix`, `changeSinceSuffix`.
  - The header date reuses the existing `assets.strip.updatedAt`
    ("Cập nhật {{value}}") rather than adding a key.

## Key decisions

- **New keys rather than reshaped ones.** `assets.demo.totalAssets/totalDebt`
  and `assets.summary.dayChange/changeSince` interpolate `{{value}}` and are
  still used by `mobile/src/features/assets/components/assets-summary.tsx`.
  The new layout states the amount separately, so it needed label-only and
  suffix-only strings; the old keys are left untouched so mobile keeps working.
- **Tokens, not the demo's literals.** The demo's `text-[54px]`, `#EEF7F1` and
  `rounded-[11px]` became `t-hero`, `bg-positive-tint` and `rounded-control` —
  raw sizes fail the type-scale lint, and a colour ask means the token for that
  role (see `memory/system-colors-not-new-hues.md`,
  `memory/type-scale-nine-steps.md`).
- **The change pill is two-sided.** The demo hardcodes an up-arrow and green.
  Delta here can be negative, so icon and tone key off `toneForValueChange` —
  `ArrowDownRight` + `bg-alert-tint` on a drop. Verified both branches.
- **The card is titled once.** The liquidity split is detail supporting the net
  worth figure, not a section of its own, so it has no heading — only a
  `byLiquidity` caption above the legend. This replaced an earlier pass that
  gave the right column its own title and subtitle.
- **Dropped from the demo**: the demo's fourth "Khác" legend row — liquidity
  has exactly three buckets (`usable_now`, `not_immediately_usable`,
  `long_term`).
- `PanelSplit` was left alone; three other sections use it, and this card's
  full-bleed divider is specific to it.

## Mobile app parity notes

- `mobile/src/features/assets/components/assets-summary.tsx` is the counterpart
  and still renders the old shape (interpolated operand line, no pill, no
  tiles). Port if mobile should match: the single title row with the date, the
  pill, the two metric tiles, and dropping the liquidity heading down to a
  caption above the legend. The new i18n keys are already in shared core, so no
  string work is needed on the mobile side.
- Web-specific, do **not** port literally: the `lg:` two-column grid with the
  vertical divider — mobile is always the stacked form.
- Icons are `lucide-react` here; mobile uses `@expo/vector-icons`, so
  `wallet-cards` / `receipt-text` / `arrow-up-right` need the Expo equivalents
  (see `memory/mobile-icons-are-expo-vector.md`).

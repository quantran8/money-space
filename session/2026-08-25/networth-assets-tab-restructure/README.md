# Net worth — assets tab restructure

- **Date**: 2026-08-25
- **Session folder**: `session/2026-08-25/networth-assets-tab-restructure/`
- **Status**: done

## What the task is

Bring the assets tab of `/networth` in line with the reviewed prototype: lead
with net worth as a single hero figure plus a liquidity breakdown, and replace
the flat six-column source table with one card per liquidity group.

## Changes made

- `frontend/web/src/features/assets/ui/components/assets-summary-strip.tsx` —
  rewritten. Was three equal metrics (assets / debt / net worth); is now a
  `PanelSplit` with net worth as `t-hero` on the left and the liquidity donut
  (reusing `AssetCompositionChart`) on the right. Takes `totals` instead of
  `assetCount` / `debtCount`.
- `frontend/web/src/features/assets/ui/components/assets-list-section.tsx` —
  rewritten. Groups assets by `liquidityOrder` into one `Panel` per bucket, each
  with a subtotal, a share-of-total line and a source count. `usable_now` and
  `not_immediately_usable` sit side by side at `lg`; `long_term` spans both
  columns and splits its rows into two inner columns. Loading and empty states
  stay single-panel. Takes a new `total` prop — the share denominator must be
  the unfiltered total.
- `frontend/web/src/features/assets/ui/components/asset-source-row.tsx` — new.
  One source row: type icon, name, holder avatar + freshness, value, `⋯` menu.
- `frontend/web/src/features/assets/ui/components/asset-type-icon.tsx` — new.
  `AssetType` → lucide icon map.
- `frontend/web/src/features/networth/ui/networth-page.tsx` — passes `totals`
  and `total` through; drops `assetCount` from the destructure.
- `frontend/packages/core/src/i18n/resources.ts` — added `assets.demo`:
  `totalAssets`, `totalDebt`, `byLiquidity`, `sourceCount`, `heldBy`,
  `householdInitials`, `optionsFor`, in both `vi` and `en`.

## Key decisions

- **No core changes.** `useAssetsPage` already returned `totals` and `total`;
  only the web UI layer moved. Mobile can reuse the same hook untouched.
- **`AssetCompositionChart` reused, not reimplemented.** It already draws the
  three-bucket donut with the `liquidityColors` ramp. `MoneyCompositionRing` was
  the wrong primitive — it is a two-tone committed/flexible ratio gauge.
- **The `Thanh khoản` column was deleted, not moved.** Once the list is grouped
  by liquidity the column repeats its own card's heading. Dropping it (with
  `role`, `owner` and `updated` folding into the row's second line) removes the
  table's 840px min-width, so the page no longer scrolls sideways on mobile.
- **Empty groups render nothing** rather than an empty card — an empty card mid
  grid reads as a failed load, and the filter above already explains absence.
- **`AssetList` (`asset-list.tsx`) is now unreferenced but was left in place** —
  deleting it was outside the task and it is the revert point for the table.

## Mobile app parity notes

- `frontend/mobile/src/features/assets/components/assets-list-section.tsx` is
  the counterpart and still renders the flat list — port the liquidity grouping,
  the subtotal + share header and the icon/avatar row to it.
- The new i18n keys are in shared core, so mobile already has the strings.
- Web-specific, do **not** port: the `lg:col-span-2` / two-inner-column layout
  for `long_term` (there is no wide breakpoint on mobile — keep one column), and
  the hover states on the source row.

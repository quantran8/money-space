# Update asset + user-entered unit price

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/update-asset-and-unit-price/`
- **Status**: done

## What the task is

Assets page had no way to **edit** an existing asset, and market-priced assets
(BTC, cổ phiếu, gold, fund, foreign currency) always showed "Chưa có giá" because
`latestPrice()` is a stub returning `null`. The user wanted:

1. An **update asset** feature (edit all fields via the same form).
2. Let the user **input the price** for market-priced assets so their value is
   computed instead of relying on the (unavailable) pricing API.

## Changes made

- `src/features/assets/model/assets.types.ts` — added optional `unitPrice?: number`
  to `MarketPosition` (user-entered price of 1 unit in `quoteCurrency`).
- `src/features/assets/model/assets.ts` — `computeMarketValue` now prefers
  `position.unitPrice` (`quantity × unitPrice × fx`) and falls back to the
  `latestPrice()` lookup when it's absent.
- `src/features/assets/model/assets-form.ts` —
  - Added `unitPrice: string` to `AssetForm` + defaults.
  - `toAsset` sets `marketPosition.unitPrice` from the form (parsed VND, or
    `undefined` if empty).
  - Added `fromAsset(asset)` — rebuilds editable form values from an existing
    asset (edit mode), incl. `moneyToRaw` / `decimalToRaw` raw-string helpers.
  - Schema now requires + money-validates `unitPrice` in the `market_priced` branch.
- `src/features/assets/ui/components/asset-form-dialog.tsx` — added `isEditing`
  prop (edit title/eyebrow + Save button with `Save` icon), and a `unitPrice`
  `MoneyInput` field in the market-priced section.
- `src/features/assets/ui/components/asset-list.tsx` — added a per-row actions
  dropdown (Edit / Delete) mirroring `payment-row.tsx`; new `onEdit` / `onDelete` props.
- `src/features/assets/ui/components/assets-list-section.tsx` — threads
  `onEdit` / `onDelete` down to `AssetList`.
- `src/features/assets/ui/assets-page.tsx` — wires `openEdit`, delete via
  `ConfirmDialog`, passes `isEditing` to the dialog.
- `src/features/assets/hooks/use-assets-page.ts` — added `editingId` / `deleteId`
  state, `openEdit`, `handleDeleteAsset`, edit-vs-create submit (uses existing
  `updateAsset` / `deleteAsset` mutations from `use-assets`), seeds the form from
  `fromAsset(editingAsset)` when editing.
- `src/i18n/resources.ts` — added `assets.form.editEyebrow/editTitle/save/unitPrice/
  unitPricePlaceholder` (vi + en) and reworded `modeMarket` (user now enters the price).

## Key decisions

- **Valuation mode stays derived from type** — the edit form reuses the exact
  same discriminated form; the user still cannot free-pick the valuation mode
  (core domain rule). Editing just re-seeds the fields.
- **`unitPrice` is optional on `MarketPosition`** so nothing breaks if a real
  pricing API is wired later; the manual price simply takes precedence over the
  stub lookup. Value = `quantity × unitPrice × fxToVnd(quoteCurrency)`.
- Reused existing `updateAsset` / `deleteAsset` mutations already present in
  `use-assets.ts` and the `ConfirmDialog` + dropdown pattern from the payments
  feature — no new primitives.

## Mobile app parity notes

- Port `MarketPosition.unitPrice` and the `computeMarketValue` precedence
  (user price → stub lookup) — this is shared domain logic.
- Port the edit + delete asset flow and the `unitPrice` form field.
- **Backend — DONE this session** (`money-space/backend`): `MarketPosition`
  entity gained `unitPrice?`; `computeCurrentValue` (money-space.utils) now
  prefers it over the market-price cache; persisted on new column
  `asset_market_positions.unit_price` (Prisma model + migration
  `20260711000000_add_market_position_unit_price`); mapper reads it back
  (undefined when NULL so the API fallback still works). DTOs reference
  `MarketPosition` so they picked it up automatically. `src/shared/types/
  database.ts` (frontend) row type updated too.
- **Mobile**: still needs the `unitPrice` domain + form + the same
  precedence logic ported.

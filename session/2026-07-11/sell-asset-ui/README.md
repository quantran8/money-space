# Sell asset (Bán tài sản) frontend UI

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/sell-asset-ui/`
- **Status**: done

## What the task is

Build the "Bán tài sản" (sell asset) frontend flow. Backend contract is already
done: a sale is a single `asset_sale` money event POSTed to the money-events
endpoint. The UI lets the user sell a sellable asset (by quantity for market
assets, by value for manual assets), pay an optional fee, and credit a wallet.

## Changes made

- `src/features/assets/model/assets.ts` — added `SELLABLE_ASSET_TYPES`
  (Set<AssetType>) and `isSellableAssetType(type)`.
- `src/features/assets/model/asset-sale-form.ts` (new) — `AssetSaleForm` type,
  `buildAssetSaleSchema(t, asset)` zod schema, `toSalePayload(asset, values, asOf)`
  building the `EventPayload`, plus helpers `isMarketSale`, `currentQuantity`,
  `computeNet`, `defaultAssetSaleValues`.
- `src/features/assets/hooks/use-asset-sale.ts` (new) — dialog state, RHF form
  (onChange), wallet options (cash/bank_account), submit via
  `useEvents().createEvent`, sonner toasts. Exposes saleOpen/openSale/closeSale/
  handleOpenChange/sellingAsset/form/walletOptions/isMarketAsset/currentQuantity/
  previewNet/isSubmitting/submit.
- `src/features/assets/ui/components/asset-sale-dialog.tsx` (new) — ResponsiveDialog
  matching asset-form-dialog patterns: quantity (DecimalInput + "Bán toàn bộ"
  checkbox, market only), proceeds/fee (MoneyInput), net preview line, wallet
  Select, DatePicker, note Input.
- `src/features/assets/ui/components/asset-list.tsx` — added `onSell?` prop, a
  "Bán" dropdown item (HandCoins) shown when sellable & not sold, an "Đã bán"
  muted Badge, and struck-through/dimmed value line when sold.
- `src/features/assets/ui/components/assets-list-section.tsx` — threads `onSell`.
- `src/features/assets/hooks/use-assets-page.ts` — calls `useAssetSale`, exposes
  `openSale(assetId)` (resolves asset then calls sale.openSale) and `sale`.
- `src/features/assets/ui/assets-page.tsx` — passes `onSell`, mounts
  `<AssetSaleDialog />`.
- `src/features/events/ui/components/quick-action-picker.tsx` — added secondary
  "Bán tài sản" entry (HandCoins) that calls new `onSellAsset`.
- `src/features/events/ui/components/event-form-dialog.tsx` — threads `onSellAsset`.
- `src/features/events/hooks/use-events-page.ts` — added `openSellAsset()` which
  navigates to `/assets` (mirrors `openBorrowMoney` → `/debts`).
- `src/features/events/ui/events-page.tsx` — wires `openSellAsset`.
- `src/i18n/resources.ts` — added `assets.sale.*` (vi + en) and
  `options.assetStatus.{active,sold,closed}` (vi + en).

## Key decisions

- Market vs manual is decided by `asset.marketPosition` presence, NOT by type.
  `bond` is in the sellable list but is formula_calculated with no marketPosition,
  so it is treated as a manual (sell-by-value) sale.
- Full sale: market → `soldQuantity = current marketPosition.quantity`; manual →
  `soldValue = computeCurrentValue(asset, asOf)`. Partial manual sale sends the
  gross proceeds as `soldValue` (contract left "value sold" for partial manual
  under-specified; proceeds is the natural stand-in).
- `direction` is omitted (backend derives neutral). `category: 'investment'`.
- Toasts use the ASCII-Vietnamese style already in use-assets-page.ts
  ('Da ban tai san.' / 'Khong the ban tai san.').
- Quick-action picker: "Bán tài sản" is a SECONDARY entry that just navigates to
  /assets. It is NOT added to the `QuickAction` union (added as a local
  `PickerKey` in the picker only) to avoid rippling into the events schema logic.
- `useAssetSale` is owned by `use-assets-page.ts` (matching the existing structure
  where the page hook owns dialog state), exposed as `sale` to the page.

## Mobile app parity notes

- Port the sell flow: sellable-type helper, sale form schema/payload, sale dialog,
  the "Bán" action + "Đã bán" state in the asset list, and the i18n keys.
- Payload shape: `type:'asset_sale'`, `amount` (gross), `feeAmount`,
  `fromAssetId` (sold asset), `toAssetId` (wallet), `soldQuantity` (market) /
  `soldValue` (manual), `category:'investment'`, no `direction`.
- Secondary entry point (quick action → navigate to assets) is optional on mobile.

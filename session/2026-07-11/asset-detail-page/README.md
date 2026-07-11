# Asset detail page — value-over-time chart + related events

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/asset-detail-page/`
- **Status**: done

## What the task is

Add an asset detail page (`/assets/:assetId`) that shows:
- a chart of the asset's value changing over time ("biến động theo thời gian"),
- the timeline of money events related to that asset ("các event liên quan"),
- core asset info, with in-place editing via the existing asset form dialog.

Reached by tapping an asset row on the assets list.

## Changes made

### Backend (`../../../../backend`)

The value-over-time series is now **derived on the backend from money events** (the `asset_valuations` table only ever holds one row per asset, dated `AS_OF`, so it can't feed a real curve).

- `src/modules/assets/assets.controller.ts` — added `GET :assetId/value-history`.
- `src/modules/assets/assets.service.ts` — added `getAssetValueHistory(householdId, assetId)`, split by valuation mode:
  - **market_priced** (`buildMarketValueHistory`) — prices the **market position**: rebuild quantity held at each point (a sale adds `soldQuantity` back going into the past) and value it at the current unit price (`currentValue / currentQuantity`). A sale drops the curve by `quantitySold × today's price`, not by the cash the sale fetched.
  - **manual / formula** (`buildCashValueHistory`) — unwind each linked event's signed cash amount (in via `toAsset` = +, out via `fromAsset` = −), floored at 0.
  - Returns `{ currentValue, items: [{date, value}], total }`, oldest → newest.
- `src/modules/assets/repositories/{assets.repository.interface,prisma-assets.repository}.ts` — added `findMoneyEventsByAsset` (events where `fromAssetId` OR `toAssetId` = asset, oldest → newest).
- `memory/asset-valuation.md` — documented the value-history derivation.

### Frontend-web

- `src/features/assets/hooks/use-asset-detail.ts` — **new**. Reads the backend `value-history` endpoint (via a react-query `useQuery`) for the chart `valueHistory` + `currentValue`; derives the related-events timeline from `useEvents` (events where `fromAssetId`/`toAssetId` = asset), re-signed to the asset's perspective; returns `totalInflow` / `totalOutflow`.
- `src/features/assets/api/assets.repository.ts` — added `getAssetValueHistory()`.
- `src/shared/api/query-keys.ts` — added `assetValueHistory` key.
- `src/features/events/hooks/use-events.ts` — event mutations now also invalidate the assets query prefix (list/summary/snapshots/value-history), so an asset purchase/sale refreshes the assets views and the chart. (Also fixes a pre-existing gap where selling via an event didn't refresh the assets list.)
- `src/features/assets/ui/components/asset-value-chart.tsx` — **new**. Recharts `AreaChart` of `valueHistory`, styled to match `asset-trend-chart.tsx` (same axes/tooltip/gradient conventions). Colored by the asset's liquidity bucket via `liquidityColors`. Shows an empty state when there are fewer than 2 points.
- `src/features/assets/ui/asset-detail-page.tsx` — **new**. Modeled on `debt-detail-page.tsx`: back button, header with type/liquidity/auto-priced/sold badges + Edit button, value chart card, info card, related-events timeline card (inflow/outflow summary tiles + event rows). Reuses `useAssetsPage` form machinery + `AssetFormDialog` for in-place editing.
- `src/app/router.tsx` — added route `assets/:assetId` → `AssetDetailPage`.
- `src/features/assets/ui/components/asset-list.tsx` — added optional `onOpen(assetId)`; the row's main content is now a `<button>` that navigates. Dropdown actions (edit/sell/delete) unchanged.
- `src/features/assets/ui/components/assets-list-section.tsx` — threads `onOpen` through to `AssetList`.
- `src/features/assets/ui/assets-page.tsx` — wires `onOpen` to `navigate('/assets/:id')` via `useNavigate`.
- `src/i18n/resources.ts` — added `assets.detail.*` keys (vi + en): back, notFound, chart, info, events.

## Key decisions

- **Value history is derived on the backend** (`getAssetValueHistory`): `asset_valuations` only stores one row per asset (dated `AS_OF`), so it can't produce a curve. MVP approximation — swap for a real valuation-history query when one lands.
- **Market-priced assets** (`gold`, `stock`, `crypto`, `fund`, `foreign_currency`, `bond`) are valued **from the market position** (quantity × current unit price), NOT from the cash the sale events moved — otherwise a sale would drop the curve by a stale/mismatched cash figure instead of the quantity actually removed. Manual/formula assets have no position, so they unwind cash. (This was the follow-up request: "lên lấy từ asset market position" cho chart.)
- Asset linkage is **from/to only**: money events have no direct `assetId` column (backend), and the frontend `MoneyEventItem.assetId` is never populated — an event touches an asset iff `fromAssetId`/`toAssetId` = asset. Amounts are re-signed to the asset's perspective (in = +, out = −).
- Editing opens the existing dialog in place (no navigation back to the list), matching `DebtDetailPage`.

## Mobile app parity notes

- Add an equivalent asset detail screen: value-over-time chart + related-events list + info + edit.
- Consume the **backend `GET :assetId/value-history`** endpoint for the chart (don't re-derive on device); derive the related-events list from events (`fromAssetId`/`toAssetId` = asset).
- Make asset list rows tappable → detail.
- Ensure money-event mutations invalidate/refetch the assets views (parity with the `use-events` invalidation change).
- Add the same `assets.detail.*` i18n keys.

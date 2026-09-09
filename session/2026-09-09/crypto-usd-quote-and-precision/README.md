# Crypto: exact quantity, USD alongside VND, and a working quote

- **Date**: 2026-09-09
- **Session folder**: `session/2026-09-09/crypto-usd-quote-and-precision/`
- **Status**: done

## What the task is

Crypto holdings must show their quantity exactly (`0,0158615 BTC`, never
`0,016`), show the USD price beside the đồng one on the asset detail page and in
the buy form, and drop the quantity from the line under the hero while giving
the live price a bigger font.

Mid-task the user reported `GET /market-data/quote?assetClass=crypto&symbol=ETH&quoteCurrency=VND`
returning `{ quote: null }`. Root cause was separate from the display work and is
fixed here too.

## Changes made

- `packages/core/src/shared/lib/format-money.ts` — new `formatQuantity` (8
  decimals for crypto, 3 otherwise, trailing zeros trimmed) and `formatQuotePrice`
  (native currency, `en-US` so USD reads `$110,234.57`).
- `web/src/features/assets/ui/asset-detail-page.tsx` — hero line drops the
  quantity, moves from `t-caption`/`ink3` to `t-body-sm`/`ink2`, and appends the
  native price for a foreign-quoted instrument; info panel uses `formatQuantity`.
- `packages/core/src/i18n/resources.ts` — `holdingLine` no longer takes
  `{{quantity}}`; new `holdingLineNative` adds `{{nativePrice}}` (vi + en).
- `web/src/features/assets/ui/components/market-price-section.tsx` — renders
  `quote.nativePrice` under the đồng figure, so the buy AND sell dialogs both
  show USD; the non-VND branch now uses `formatQuotePrice`.
- `packages/core/src/features/assets/api/symbols.repository.ts` — `MarketQuote`
  gains `nativePrice?: { price, quoteCurrency }`.
- `web/.../asset-form-dialog.tsx`, `mobile/.../asset-form-sheet.tsx` — crypto now
  requests `USD`, not `VND`.
- **backend** `market-data.service.ts` — crypto always fetches USD and always
  serves đồng, converting via `toVnd()` (new) using vnstock bank counter rates;
  `market-price.entity.ts` gains `nativePrice`; 6 tests added in
  `market-data.cache.spec.ts`.
- `web/.../asset-form-dialog.tsx` + `mobile/.../asset-form-sheet.tsx`
  (`MarketQuoteHint`) — the add-asset form showed `formatMoney(price, currency)`,
  which is `notation: 'compact'` for a foreign currency and rendered ETH as
  "$2.5K". Now exact đồng via `formatVndExact`, foreign via `formatQuotePrice`,
  with `nativePrice` on a second line. Mobile's inline `quote` prop type was
  replaced with the shared `MarketQuote` (it lacked `nativePrice`).

### Round 3 — cost basis in USD

- `packages/core/.../assets-form.ts` — `AssetForm` gains `purchasePriceCurrency`
  ('VND' | 'USD') and `usdToVnd`; new `purchasePriceInVnd()` converts on submit;
  the đồng-only `moneyLike` check is relaxed to decimals when USD is selected.
- `web/.../asset-form-dialog.tsx` — new `PurchasePriceField` with a `đ/$`
  Segmented toggle (crypto only), an `≈ <đồng>` preview of what gets stored, and
  prefill that seeds the field in whichever currency is active.
- `packages/core/src/i18n/resources.ts` — `assets.form.market.approxVnd`.

### Round 4 — USD on the detail page, and a label for the price line

The detail page showed no USD: `nativePrice` existed only on the *quote* type,
while a held position is priced from the batch cache, which fetched đồng only.

- **backend** `market-data.service.ts` (`fetchPrices`) — adds a USD request for
  every crypto row in the symbol universe.
- **backend** `money-space.utils.ts` — `quoteFor` gains a `quoteCurrency`
  argument; with two cached entries per crypto symbol, the old first-match would
  price a position in the wrong currency. `computeCurrentValue` passes the
  position's own currency.
- **backend** `assets.service.ts` (`withMarketPrice`) — looks up the USD entry
  and attaches `nativeMarketPrice`; new field on `market-position.entity.ts`.
- `packages/core/.../assets.types.ts` — matching `nativeMarketPrice`.
- `web/.../asset-detail-page.tsx` — reads it, and the hero line now carries a
  label: "Giá mỗi BTC · 2.046.085.668đ · $77,655.20" (was a bare
  "2.046.085.668đ / BTC" that did not say what the number meant).
- Tests: dual-currency batch fetch (`market-data.cache.spec.ts`) and `quoteFor`
  currency selection (`money-space.utils.spec.ts`).

## Key decisions

- **Crypto quotes are fetched in USD and served in đồng, always.** CoinMarketCap
  converts to non-USD fiat only on a paid tier — asking it for VND returned an
  error that surfaced as `{ quote: null }` with a 200. Full rationale in
  `memory/market-data.md`.
- **The FX rate comes from vnstock counter rates, not `fx_rates`.** That table is
  empty and nothing in the codebase writes to it. Buy-transfer side, since the
  conversion restates a holding the household would sell.
- **No rate published → serve the unconverted USD quote.** Inventing a rate puts
  a number ~26.000× wrong into a đồng field.
- **8 decimals is the crypto floor** (satoshi). Rounding to 3 broke the hero:
  quantity × unit price no longer reproduced the stated total.
- **CMC quotes VND directly** — my earlier "paid tier only" claim was wrong. The
  real limit is one `convert` per HTTP call, so both currencies come from the
  exchange in two batched calls. `toVnd` is now a fallback only.
- **Crypto cost basis is typed in USD but stored in đồng**, converted with the
  quote's own implied rate. Storing `quote_currency: 'USD'` would be more correct
  but is blocked by the empty `fx_rates` table — the asset would value at 0đ
  everywhere. Full reasoning in `memory/market-data.md`.

## Mobile app parity notes

- Port both core changes (they are shared already): `formatQuantity`,
  `formatQuotePrice`, the `MarketQuote.nativePrice` field, and the i18n keys.
- `asset-form-sheet.tsx` already switched to `USD` in this task.
- Mobile has **no asset detail screen yet**, so the hero-line and info-panel
  changes have no mobile counterpart. When one is built it must use
  `formatQuantity` — `toLocaleString` alone rounds crypto to 3 decimals.
- Mobile's market-price display was updated to match (exact đồng + `nativePrice`).
- **Not yet ported to mobile**: the `đ/$` purchase-price toggle. `AssetForm` now
  carries `purchasePriceCurrency` and `usdToVnd` (both default to VND/null, so
  mobile compiles and behaves exactly as before), but `asset-form-sheet.tsx`
  still renders a đồng-only `MoneyField`. Port `PurchasePriceField`.

## Still blocked

- ~~`COIN_MARKETCAP_API_KEY` not set~~ — resolved by the user; quotes now return.
- `fxToVnd` in `packages/core/.../assets.repository.ts` still returns `1`, so the
  client-side `computeMarketValue` fallback mis-prices USD positions.

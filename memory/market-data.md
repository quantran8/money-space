# Market data

Current quotes come from the backend's external `PriceProvider` and short-lived
TTL cache; provider ticks are not persisted in PostgreSQL. Durable user history
lives in self-contained `asset_value_history` points (value, quantity, price,
purchase price, FX, source and observed time).

The frontend does not call providers directly. Asset/dashboard endpoints return
values resolved by the backend, which now has real adapters for every
market-priced class: VN equities (vnstock), foreign equities (Twelve Data),
crypto (CoinMarketCap) and gold/silver + bank FX rates (vnstock's commodity
feed). Manual price updates remain available as an override for anything the
providers cannot quote.

## Symbol picker (market-priced asset creation)

Every market-priced type takes its symbol from the backend's instrument list via
`SymbolCombobox`, not a free-text field. Each listed instrument is one the price
feed can actually quote — picking from the list is what makes the holding
priceable.

- **Classes with a list**: `stock`, `crypto`, `gold` (which covers **silver** —
  one precious-metal class), `foreign_currency`. Resolved by
  `searchableAssetClassForType` (`src/features/assets/model/assets.ts`).
- **`fund` keeps a plain text input.** It is market-priced but has no instrument
  catalogue behind it, so a combobox there could only ever answer "không tìm
  thấy" — worse than letting the user type the code. This is the same reason the
  picker was removed entirely once; it now applies to one class instead of all.
- API: `GET /api/market-data/symbols?assetClass=&q=&limit=` →
  `SymbolReference[]` (`{ assetClass, symbol, name, exchange, currency, unit }`).
  Wrapped by `searchSymbols()` in
  `src/features/assets/api/symbols.repository.ts`.
- `useSymbolSearch(assetClass, query, enabled)` debounces 300ms, runs only while
  the popover is open, caches per `(class, query)` with `keepPreviousData`.
  Empty query → the default list; typed query → backend-ranked matches.
- Selecting a row sets `symbol`, and carries two fields across:
  - **`market`** ← `reference.exchange` (venue for equities, dealer brand for
    gold/silver). The backend routes pricing on it — a Vietnamese and a foreign
    listing are both `assetClass: 'stock'` — so without it routing falls back to
    a currency heuristic. Persisted on the position.
  - **`unit`** ← `reference.unit`, rather than being guessed from the symbol.
- **Gold/silver symbols are product names, not tickers** ("Vàng miếng SJC"), so
  `resolveMarketSymbol` does not upper-case them. The price feed matches
  case-insensitively; shouting the name back at the user is just wrong.

## Live market price in the asset form

`MarketQuoteHint` shows the current price for the chosen symbol, with its source
and a "dùng làm giá mua" action.

- API: `GET /api/market-data/quote?assetClass=&symbol=&market=` →
  `{ quote: MarketQuote | null }`, via `fetchQuote()` /
  `useMarketQuote(assetClass, symbol, market)`.
  - This is **not** the prices endpoint: that one only covers positions the
    household already holds, and a symbol being added for the first time is by
    definition not in that set.
  - `null` means the instrument cannot be priced (unknown symbol, provider
    down). The form says so and still submits — the user's typed figures value
    the asset. It is never an error state.
- **The price prefills `purchasePrice`, under two guards.** It is right for the
  common case (recording something just bought), but the field stores **đồng**
  and holds a *cost basis*, so:
  - **Once per symbol.** A later refetch of the same quote never rewrites a
    figure the user has since edited; picking a different symbol re-prefills.
  - **VND quotes only.** A USD quote (crypto, foreign equities) would land as
    plain digits in a đồng field — BTC at 78,188 USD becomes 78.188đ, off by the
    FX rate. Crypto is now converted server-side (see below), so it arrives in
    đồng; anything still quoting foreign is shown in its own currency with the
    "dùng làm giá mua" action hidden.
  - The two numbers stay conceptually distinct — market price is *now*,
    `purchasePrice` is what was paid — which is why the quote remains visible
    after prefilling.
- **Changing the asset type clears `symbol`, `market`, `unit` and
  `purchasePrice`.** An instrument belongs to exactly one class, so nothing
  picked for the old type survives: "VÀNG MIẾNG SJC" is not a crypto symbol, and
  leaving it would submit a position nothing can price.

## Crypto: both currencies come from the exchange

A crypto quote is served in **đồng** whatever currency the caller named, with the
USD figure alongside in `nativePrice`. **Both are CoinMarketCap's own numbers** —
`getQuote` asks the provider for `VND` and `USD` in one `getLatestPrices` call.

CMC quotes VND directly; the limit is **one `convert` per HTTP call**
(`convert=USD,VND` → HTTP 400, *"Your plan is limited to 1 convert options"*), so
`CoinMarketCapPriceProvider` already groups requests by convert-currency and
issues one call each. Two calls, no rate of ours in the middle.

Do NOT "fix" this by fetching USD once and multiplying: a derived USD/VND figure
drifts from the exchange's, so the two numbers on screen stop agreeing.

- **Fallback only if the upstream will not quote đồng**: convert its own currency
  with vnstock's bank counter rates — the same feed `foreign_currency` is priced
  from, so a USD holding and a USD-denominated coin convert identically. Not
  `fx_rates`: that table is empty and nothing writes to it. `source` then reads
  `coinmarketcap+vnstock`, naming both upstreams.
- **Buy-transfer side, not sell**, in that fallback. `commodityQuote` uses `sell`
  because it prices a currency being *acquired*; conversion restates a value the
  household already holds and would realise by selling USD to the bank. Order:
  `buyTransfer → buyCash → sell`.
- **No rate published → serve the USD quote unconverted.** It is honestly
  labelled by its `quoteCurrency`, and callers already check that before
  prefilling a đồng field. Inventing a rate puts a number ~26.000× wrong into a
  form.
- **`nativePrice` carries the pre-conversion figure** (`{ price, quoteCurrency }`),
  set only when `price` IS a conversion. Crypto is quoted and remembered in USD
  everywhere the household would check it, so the đồng figure alone cannot be
  verified against any exchange — and since the đồng number is a product of the
  rate, stating only the result hides the half most likely to be stale.
- **One cache entry per symbol**, keyed `VND`: both spellings mean the same đồng
  answer, so the pair of upstream calls happens once per 5-minute TTL.
- `source` names both upstreams (`coinmarketcap+vnstock`): a stale figure is only
  debuggable if you know which half went stale.

**Still required for any of this to return a price**: `COIN_MARKETCAP_API_KEY`
(or `TWELVEDATA_API_KEY`) in the backend env. With neither set, `crypto` never
enters the routes map in `priceRoutes`, the composite provider skips the request,
and the endpoint returns `null` — silently, with no log at the service level.

### The USD price on a HELD position comes from the batch cache

`getQuote` (asset-create) and `getMarketPrices` (held positions) are separate
paths, and both need the dual-currency treatment:

- Positions store `quote_currency: 'VND'`, so `getMarketSymbolUniverse` alone
  would only ever fetch đồng. `fetchPrices` adds a USD request for every crypto
  row, so the cache holds both.
- **`quoteFor` therefore takes a `quoteCurrency`** — with two entries per crypto
  symbol, taking the first match would price a position in whichever landed
  first (~26.000x out). `computeCurrentValue` passes the position's own currency;
  `withMarketPrice` passes it too, then looks up USD separately and attaches it
  as `nativeMarketPrice`.
- `MarketPosition.nativeMarketPrice` is read-only and never persisted, exactly
  like `marketPrice` beside it.

### Crypto positions are STORED and PRICED in USD

`asset_market_positions.quote_currency = 'USD'` for crypto, and `purchase_price`
is a real USD figure. `computeCurrentValue` already multiplies by
`fxRateToVnd(quoteCurrency)`, so the household total stays đồng.

- **`assets.currency` stays `'VND'`.** It labels the COMPUTED value, which is
  what `asset_valuations` and `snapshot_asset_values` store and what net worth
  sums. `computeCurrentValue` always returns đồng, so stamping `'USD'` there
  would label a đồng number USD and corrupt every total — `computeLiquidityTotals`
  is a bare `+=` with no currency awareness.
- **`fx_rates` is the hard prerequisite.** It was empty and nothing wrote to it,
  so `fxRateToVnd('USD')` returned null and a USD position valued at **0**
  everywhere. `MarketDataService.captureFxRates()` now writes the vnstock counter
  rates (buy-transfer, same side as `toVnd`) and runs at the top of the daily
  valuation cron, before any asset is valued. A failure there is logged and the
  run continues on yesterday's rate.
- `saveFxRates` filters to codes present in `currencies` — the bank feed quotes
  ~20 against a 10-row catalog, and the FK would otherwise fail the whole batch.
- **Legacy đồng-quoted crypto** is converted by
  `20260909040000_crypto_positions_to_usd`, dividing `purchase_price` and
  `last_price` by the latest USD/VND rate. Value-preserving: the same đồng cost
  basis comes out, in the right currency. The purchase-day rate is not recorded,
  so the latest is the honest approximation available — and leaving the two
  conventions mixed is worse, since a đồng cost basis then gets multiplied by a
  USD rate on the detail page. No-ops when `fx_rates` has no USD row.
- **Money moves in đồng.** `resolvePurchaseCost` and `addPurchase` convert
  `quantity × purchasePrice` through `toVndCost` before debiting a wallet;
  without a rate they throw rather than debiting 2.400đ for a $2.400 buy. Sales
  already carry `soldValue` in đồng from the form, so that path is untouched.
- **`withMarketPrice` always returns đồng in `marketPrice`**, whatever the
  position stores, with USD in `nativeMarketPrice` — but only when BOTH quotes
  are cached. When the VND one is missing it falls back to the USD quote and
  `nativeMarketPrice` is absent.
- **So the detail page derives the rate as `currentValue / (quantity × native
  unit price)`**, not `marketPrice / nativeMarketPrice.price`. The server
  computed `currentValue` from that very price, so the ratio IS the rate it
  used, and it survives either quote being missing. Depending on both meant
  `costBasis` silently fell back to `currentValue` — showing a cost equal to the
  value and a profit of exactly 0đ.

### The purchase-price field follows the type — no currency choice

`positionQuoteCurrency(type)` decides it: crypto is USD, everything else đồng.
The field's suffix says which, and the price is typed and stored in that one
currency with no conversion between them.

There WAS a `đ/$` toggle (a `purchasePriceCurrency` form field). It went once
positions started storing USD: the currency is derivable from the type, so
carrying it as form state was redundant state that could drift, and offering the
choice implied a conversion that no longer happens.

- **The rate is the quote's own**: `quote.price / quote.nativePrice.price`, i.e.
  CMC's đồng price over CMC's USD price for the same coin at the same instant. No
  second source, so nothing can drift out of step with the price shown above it.
- **No rate → the price is not stored** (`NaN`, so `toAsset` omits it) rather than
  writing 2.400 into a đồng column and understating the basis ~26.000x.
- The converted đồng is shown under the field (`≈ 62.345.751đ`) — the stored
  number is never a surprise.
- Editing reopens in the currency the position is STORED in, so the figure shown
  is the stored one rather than a conversion of it.

**Seeding the USD field: never `String(price)`.** Comma is this app's decimal
separator and `parseRawDecimal` strips `.` as a THOUSANDS separator, so a JS
`String(78821.20853177381)` parses back as 7.882.120.853.177.381 — the price
times 10^11, which then converted to 204 tỷ tỷ đồng. Seed with
`price.toFixed(2).replace('.', ',')`; cents are all a quote carries anyway.

**The `≈` line under the field** shows the đồng equivalent of a USD price, so the
household still reads it in the currency it thinks in. Display only — nothing
converts on submit.

### Popover mechanics inside the dialog (two real traps)

The picker lives inside a **modal** Dialog, and Radix's defaults break it twice:

- `<Popover modal>` is required, or the dialog treats each click on a list row
  as an outside-click and the list closes before anything is selected
  (Playwright reports *"dialog-content intercepts pointer events"*).
- `PopoverContent` must be **`unportalled`**, or the dialog's focus guard pulls
  focus out of the portaled search box and every keystroke is swallowed — the
  field looks focusable but cannot be typed into. `DatePicker` portals normally
  because a calendar needs no typing.


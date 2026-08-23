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
    FX rate. Those quotes are still shown, formatted in their own currency via
    `formatMoney(price, quote.quoteCurrency)`, with the "dùng làm giá mua"
    action hidden until FX conversion exists.
  - The two numbers stay conceptually distinct — market price is *now*,
    `purchasePrice` is what was paid — which is why the quote remains visible
    after prefilling.
- **Changing the asset type clears `symbol`, `market`, `unit` and
  `purchasePrice`.** An instrument belongs to exactly one class, so nothing
  picked for the old type survives: "VÀNG MIẾNG SJC" is not a crypto symbol, and
  leaving it would submit a position nothing can price.

### Popover mechanics inside the dialog (two real traps)

The picker lives inside a **modal** Dialog, and Radix's defaults break it twice:

- `<Popover modal>` is required, or the dialog treats each click on a list row
  as an outside-click and the list closes before anything is selected
  (Playwright reports *"dialog-content intercepts pointer events"*).
- `PopoverContent` must be **`unportalled`**, or the dialog's focus guard pulls
  focus out of the portaled search box and every keystroke is swallowed — the
  field looks focusable but cannot be typed into. `DatePicker` portals normally
  because a calendar needs no typing.


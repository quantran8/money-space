# Market data

Current quotes come from the backend's external `PriceProvider` and short-lived
TTL cache; provider ticks are not persisted in PostgreSQL. Durable user history
lives in self-contained `asset_value_history` points (value, quantity, price,
purchase price, FX, source and observed time).

The frontend does not call providers directly. Asset/dashboard endpoints return
values resolved by the backend. Manual price updates remain available as an
override/fallback while no real provider adapter is configured.

## Symbol picker (stock / crypto asset creation)

When creating a `stock` or `crypto` asset, the "Mã / Ký hiệu" field is a
searchable combobox (`SymbolCombobox`) instead of a free-text input. It opens
showing a curated **default list** (shown before typing) and filters via the
backend as the user types:

- API: `GET /api/market-data/symbols?assetClass=stock|crypto&q=<query>` →
  `SymbolReference[]` (`{ assetClass, symbol, name, exchange, currency, unit }`).
  Wrapped by `searchSymbols()` in
  `src/features/assets/api/symbols.repository.ts`.
- `useSymbolSearch(assetClass, query, enabled)`
  (`src/features/assets/hooks/use-symbol-search.ts`) debounces the query (300ms
  via `useDebouncedValue`), runs only for `stock`/`crypto` while the popover is
  open, caches per `(class, query)` with `keepPreviousData`. Empty query → the
  curated default list; typed query → ranked matches (backend ranks by
  ticker/name).
- `SymbolCombobox` (`src/features/assets/ui/components/symbol-combobox.tsx`,
  shadcn `Popover` + `Command` with `shouldFilter={false}` since the backend
  filters) sets the form `symbol` and prefills `unit` (only when empty) from the
  chosen instrument. Free-typed symbols still pass through, so a symbol not in
  the list can be entered.
- Other market classes (e.g. `gold`) keep the plain uppercase text input.
- The backend serves this from Twelve Data reference data (cached 24h) with a
  curated fallback — see backend `memory/market-data.md`.

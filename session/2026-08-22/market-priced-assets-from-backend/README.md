# Market-priced assets: symbol and price from the backend

- **Date**: 2026-08-22
- **Session folder**: `session/2026-08-22/market-priced-assets-from-backend/`
- **Status**: done

## What the task is

For market-priced asset types, the symbol and the price should come from the
backend instead of being typed by the user. Symbol was a free-text field for
every market-priced type, and no live price was shown anywhere in the form.

## Changes made

- `src/features/assets/api/symbols.repository.ts` — widened `SymbolAssetClass`
  to `stock | crypto | gold | foreign_currency`, added the `MarketQuote` type
  and `fetchQuote()` over the new `/api/market-data/quote` endpoint.
- `src/features/assets/hooks/use-market-quote.ts` (new) — TanStack Query hook
  for the live quote of the selected symbol. `staleTime` matches the backend's
  5-minute cache; an unpriceable symbol resolves to `null`, not an error.
- `src/features/assets/ui/components/asset-form-dialog.tsx` — `MarketFields`
  now renders `SymbolCombobox` instead of a text input, and a new
  `MarketQuoteHint` shows the live market price with its source, plus a
  "use as purchase price" action.
- `src/features/assets/ui/components/symbol-combobox.tsx` — added a
  `placeholder` prop; doc updated for the wider set of classes.
- `src/features/assets/model/assets.ts` — added `searchableAssetClassForType`
  and `SearchableAssetClass`: the picker's class, or `undefined` for a class
  with no instrument list (funds).
- `src/features/assets/model/assets.types.ts` — `MarketPosition.market` (venue
  or dealer brand).
- `src/features/assets/model/assets-form.ts` — `market` in form state, hydration
  and payload; `resolveMarketSymbol` so gold product names are not upper-cased.
- `src/shared/api/query-keys.ts` — `marketQuote(assetClass, symbol, market)`.
- `src/i18n/resources.ts` — `assets.form.market.quote*` keys (vi + en) and
  symbol placeholders reworded from "Ví dụ: FPT" to "Chọn mã chứng khoán".

## Bug fixes after first review

Four interaction bugs, all found by driving the real UI in Playwright (the build
and unit tests were green throughout — none of these are catchable that way):

- **Popup closed the instant a row was clicked.** `SymbolCombobox`'s Popover is
  portaled to `<body>`, outside the modal Dialog, so the dialog read every click
  on a row as an outside-click. Playwright named it exactly:
  *"dialog-content intercepts pointer events"*. Fixed with `<Popover modal>` —
  the same fix `DatePicker` already carries, with the same comment.
- **Search box was unusable.** Even with `modal`, the dialog's focus guard pulls
  focus out of anything portaled outside its DOM, so the input never focused and
  every keystroke was swallowed (a manual `.focus()` from the page context also
  failed). Fixed by rendering this popover **in place** via a new `unportalled`
  prop on `PopoverContent`. `DatePicker` still portals — a calendar needs no
  typing, so it is unaffected.
- **Symbol/venue/unit/price survived an asset-type change**, so switching gold →
  crypto left "VÀNG MIẾNG SJC" as the crypto symbol. `handleTypeChange` now
  clears `symbol`, `market`, `unit` and `purchasePrice`.
- **Purchase price now prefills automatically** on selection (was: only via the
  "use as purchase price" button). This reverses the earlier decision — see
  below for the guard that keeps it safe.

A fifth bug surfaced from reading the screenshots: a **USD quote rendered as
đồng** ("3.200đ" for $3,200 ETH) and prefilled 3200 into the VND cost-basis
field — a ~26,000x understatement. `formatMoney` now receives the quote's own
currency, and prefill is gated on `quoteCurrency === 'VND'`; for other
currencies the price is still shown, labelled correctly, with the "use as
purchase price" action hidden.

## Key decisions

- **Market price prefills `purchasePrice`, under two guards.** Prefilling was
  requested, and it is right for the common case (recording something just
  bought). The guards keep it from destroying real data: it fires **once per
  symbol**, so a later refetch never rewrites a figure the user has edited; and
  **only when the quote is in VND**, because the field stores đồng and a foreign
  quote would land off by the FX rate. The two numbers remain conceptually
  distinct — market price is *now*, `purchasePrice` is what was paid — which is
  why the quote stays visible after prefill.
- **`market` is carried from the picker into the position.** A Vietnamese and a
  foreign listing are both `assetClass: 'stock'`; the backend routes pricing on
  the venue. Without it, routing falls back to a currency heuristic.
- **Funds keep a text input.** `fund` is market-priced but has no instrument
  catalogue behind it, so it gets no combobox — a picker that can only answer
  "not found" is worse than a text field. This is the same reasoning that
  removed the original combobox; it now applies to one class instead of all.
- **Gold and silver share the `gold` class.** No new enum/migration: both are
  held, priced and sold identically (a quantity of a named product at a
  dealer's VND-per-unit quote).
- **Gold symbols are product names, not tickers**, so they are not upper-cased
  (`resolveMarketSymbol`) — the price feed matches case-insensitively, but
  shouting the name back at the user is wrong.

## Mobile app parity notes

- Port the same flow: symbol picker for `stock | crypto | gold |
  foreign_currency`, text input for `fund`, read-only market price with source.
- The backend contract is `GET /api/market-data/symbols?assetClass=&q=&limit=`
  and `GET /api/market-data/quote?assetClass=&symbol=&market=`; the quote
  endpoint returns `{ quote: MarketQuote | null }` and `null` must degrade to
  "no price available", never an error state.
- Carry `market` on the position — mobile must send it too or VN equities will
  route by the currency fallback.
- Do NOT prefill `purchasePrice` from the market price.

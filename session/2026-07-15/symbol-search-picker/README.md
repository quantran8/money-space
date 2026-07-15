# Stock/crypto symbol search picker (Twelve Data)

- **Date**: 2026-07-15
- **Session folder**: `session/2026-07-15/symbol-search-picker/`
- **Status**: done

## What the task is

Add an API (backed by Twelve Data) to list stock and crypto symbols for the
asset-create flow: show a default popular list up front, and search matching
symbols as the user types. Wire it into the web frontend's asset form.

## Changes made

### Backend (`money-space-backend`)

- `src/modules/market-data/entities/symbol-reference.entity.ts` — `SymbolReference` type.
- `src/modules/market-data/providers/symbol-reference-provider.interface.ts` — provider boundary + DI token.
- `src/modules/market-data/providers/twelve-data-symbol-reference.provider.ts` — fetches `/stocks` + `/cryptocurrencies`, caches 24h in memory, dedups, reduces crypto pairs to base ticker.
- `src/modules/market-data/providers/noop-symbol-reference.provider.ts` — empty when no API key.
- `src/modules/market-data/providers/default-symbols.ts` — curated popular defaults per class.
- `src/modules/market-data/dto/search-symbols.query.ts` — query DTO.
- `src/modules/market-data/market-data.service.ts` — `searchSymbols()` (default list / ranked search / curated fallback).
- `src/modules/market-data/market-data.controller.ts` — `GET /api/market-data/symbols`.
- `src/modules/market-data/market-data.module.ts` — key-gated provider selection.
- `src/modules/market-data/market-data.search-symbols.spec.ts` — unit tests (33 total pass).

### Frontend (`money-space-frontend`)

- `src/components/ui/command.tsx` — added shadcn Command primitive (installed `cmdk`; fixed import alias to `@/shared/lib/utils`).
- `src/features/assets/api/symbols.repository.ts` — `searchSymbols()` + types.
- `src/features/assets/hooks/use-symbol-search.ts` — debounced React Query hook.
- `src/shared/lib/use-debounced-value.ts` — small debounce hook.
- `src/features/assets/ui/components/symbol-combobox.tsx` — searchable symbol picker (Popover + Command).
- `src/features/assets/ui/components/asset-form-dialog.tsx` — `MarketFields` uses the combobox for stock/crypto (prefills `unit`); gold keeps text input.
- `src/shared/api/query-keys.ts` — `symbolSearch` key.
- `src/i18n/resources.ts` — `common.loading`, `assets.form.symbolSearchPlaceholder`, `assets.form.symbolNoResults` (vi + en).

## Key decisions

- **Reference vs quote are separate providers.** Symbol reference (which
  instruments exist) is `SymbolReferenceProvider`, distinct from the price
  `PriceProvider`. Reference lists cached 24h in memory (near-static, not
  per-quote rate limited).
- **Curated default list** (not first-N from the alphabetical reference list),
  upgraded with live reference names/exchanges when available.
- **Backend does the filtering/ranking**; the frontend Command uses
  `shouldFilter={false}` and just renders server results, debounced 300ms.
- **Graceful degradation**: no API key or upstream down → curated fallback still
  serves defaults and filters typed queries. The picker always works.
- Only `stock`/`crypto` use the combobox; other market classes (gold) keep the
  free-text input. Free-typed symbols still pass through the combobox.

## Mobile app parity notes

- Port the `GET /api/market-data/symbols` client + a debounced search hook.
- Replace the stock/crypto symbol text field with a searchable picker showing the
  default list first, then backend search results; prefill `unit` on select.
- Backend already serves both platforms — no backend change needed for mobile.

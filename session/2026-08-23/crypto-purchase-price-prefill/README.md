# Crypto purchase price not prefilled on symbol pick

- **Date**: 2026-08-23
- **Session folder**: `session/2026-08-23/crypto-purchase-price-prefill/`
- **Status**: done

## What the task is

In the asset form, picking a crypto instrument did not fill the live price into
"giá mua" (`purchasePrice`). Stock and gold did.

## Root cause

`MarketFields` gates the prefill on `canPrefill = quote?.quoteCurrency === 'VND'`,
because `purchasePrice` is a đồng field — writing a USD figure into it would have
recorded BTC at 78,188đ instead of ~2 tỷ, understating the cost basis ~26,000x.
That guard is correct.

The bug is that the form never asked for a VND quote. `GET /api/market-data/quote`
already accepts `quoteCurrency`, and defaults it per class: gold, foreign currency
and VN equities are VND, **everything else — crypto included — defaults to USD**
(`market-data.service.ts`). So crypto always came back in USD, `canPrefill` was
always false, and the price was only ever offered via the manual "dùng giá này"
button, which was hidden for the same reason.

## Changes made

- `src/features/assets/api/symbols.repository.ts` — `fetchQuote` takes an optional
  `quoteCurrency` and forwards it as a query param.
- `src/shared/api/query-keys.ts` — `marketQuote` key includes `quoteCurrency`, so
  quotes in different currencies do not share a cache entry.
- `src/features/assets/hooks/use-market-quote.ts` — passes `quoteCurrency` through.
- `src/features/assets/ui/components/asset-form-dialog.tsx` — asks for `'VND'`,
  **for crypto only** (see decisions). Updated the now-stale comment claiming FX
  conversion does not exist.
- backend `coinmarketcap-price.provider.spec.ts` — regression test: a VND request
  forwards `convert=VND` and reads the price back off the `VND` key.

## Key decisions

- **Convert at the provider, not in the client.** CoinMarketCap prices in any
  convert-currency in the same call, so asking for VND costs nothing extra and
  needs no FX table. The client-side alternative was dead on arrival: `fxToVnd`
  in `assets.repository.ts` is a stub returning `1` for every currency.
- **Kept the `canPrefill === 'VND'` guard** rather than dropping it now that the
  request asks for VND. A provider can answer in its own currency regardless of
  what was requested; the guard is what stops a mislabelled quote from corrupting
  the cost basis.
- **Did not change how the position is stored.** `assets-form.ts` still submits
  `quoteCurrency: 'VND'` hardcoded — now consistent with the prefilled figure,
  where before a USD-quoted crypto was stored as if it were đồng.

## Known limitation (deliberately not fixed here)

Foreign equities (`stock` on a non-VN venue) hit the same USD default and are still
not prefilled.

They are NOT given the same fix, because it would be actively unsafe. Crypto routes
to CoinMarketCap, which really converts (`convert=VND` is forwarded upstream and the
price is read back off the `VND` key — covered by the new test). Foreign equities
route to Twelve Data, which fetches a USD price and then labels it with whatever
`quoteCurrency` was requested:

```ts
// twelve-data-price.provider.ts:85
quoteCurrency: request.quoteCurrency || 'USD',
```

Asking it for VND would return a USD number tagged `VND`. That passes `canPrefill`
and writes ~78,188đ as the cost basis of a $78,188 position — the exact corruption
the guard exists to prevent. Fixing foreign equities properly needs a real FX
conversion step (server-side, against `/api/market-data/fx-rates`), which is a
larger change than this bug warranted.

## Mobile app parity notes

- Port the same fix, with the same scope: request `quoteCurrency=VND` for **crypto
  only**, not for every market-priced class. See the limitation above — widening it
  to foreign equities silently corrupts the cost basis.
- The `canPrefill` currency guard must be ported too — it is the safety net, not
  incidental. Do not port a prefill that writes a quote of unknown currency into a
  VND field.

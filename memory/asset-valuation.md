# Asset valuation engine (core domain)

The heart of the app. Every asset's current value is **derived**, never free-typed. Related: [[assets]], [[market-data]], [[snapshots-and-networth]].

## Overview

Each asset `type` maps **deterministically** to a `valuationMode` and a default `liquidity` bucket via lookup tables. **The user must NOT free-pick the valuation mode — derive it from the type.**

## Type → valuation mode

| Mode | Asset types |
|---|---|
| `manual` | cash, bank_account, real_estate, insurance, investment, other |
| `formula_calculated` | saving_deposit, certificate_of_deposit, bond, loan_receivable |
| `market_priced` | gold, stock, fund, crypto, foreign_currency |

## Type → default liquidity

| Liquidity | Asset types |
|---|---|
| `usable_now` | cash, bank_account |
| `not_immediately_usable` | saving_deposit, certificate_of_deposit, bond, loan_receivable, foreign_currency, other |
| `long_term` | gold, stock, fund, crypto, real_estate, insurance, investment |

## The three valuation modes (`computeCurrentValue(asset, asOf)` → VND)

Single dispatch entry point. Returns VND, or `null`/`0` when a price is unknown.

- **`manual`** → `manualValue ?? 0`.
- **`market_priced`** → `quantity × price × fxRateToVnd(quoteCurrency)`.
  - **Price source precedence**: user-entered `marketPosition.unitPrice` (if set)
    wins; otherwise fall back to the `latestPrice()` market-data lookup.
  - Quote matched by (assetClass, symbol), case-insensitive.
  - Frontend returns `null` if no `unitPrice` **and** no known price; backend returns `0`.
  - `unitPrice` lets the user type the price of 1 unit (1 BTC, 1 share, 1 chỉ gold)
    directly on the asset — the MVP path, since the pricing API is stubbed.
- **`formula_calculated`** → **simple accrued interest** (non-compounding):
  ```
  current_value = principal + principal × (rate/100) × elapsedYears
  elapsedYears  = daysBetween(startDate, effectiveEnd) / 365
  effectiveEnd  = min(maturityDate, asOf)   // accrual FREEZES at maturity
  ```
  - `computeMaturityValue(term)` = principal + full-term simple interest (for display).

## Saving-deposit interest schedule, early withdrawal & auto-crediting

`saving_deposit` (a `formula_calculated` type) carries extra `CalculationTerm` fields:
- `interestPayment: 'end_of_term' | 'monthly'` — kỳ trả lãi. Persisted via the backend
  `payoutFrequency` column (`monthly↔monthly`, `end_of_term↔at_maturity`).
- `nonTermRate` — lãi suất không kỳ hạn (annual %), **required for saving_deposit**. Applied when
  withdrawing before maturity. Form rejects `nonTermRate > interestRate`.
- `interestDestination: 'wallet' | 'principal'` (+ `receivingWalletId`) — where auto-credited
  interest lands. `wallet` needs a cash/bank wallet; `principal` capitalizes (compounds).

**Display projections** (frontend `assets.ts`, backend `money-space.utils.ts`, mirrored, pure):
- `computeSavingOnTime(term)` — rút đúng hạn: `principal + principal × rate × termYears`.
- `computeSavingEarly(term, N)` — rút trước hạn ở tháng N:
  - `actualInterest = principal × nonTermRate × N/12`.
  - end_of_term: `total = principal + actualInterest`.
  - monthly: bank claws back `principal × rate × N/12 − actualInterest` from principal;
    `total = principal − clawback`.
- `termMonthsOf(term)` = round(termYears×12). UI: `SavingWithdrawalPanel` on the asset detail page
  (slider picks N; comparison table). These are **display-only**, never written to valuations.
- Worked example (100tr, 6%, 12 tháng, non-term 0,2%): đúng hạn 106tr; trước hạn @6mo →
  end_of_term 100,1tr, monthly 97,1tr (clawback 2,9tr).

**Auto-crediting interest** (backend, idempotent, per-asset — the scalable shape, NO cron):
- `computeSavingInterestPeriods(term, asOf)` → the due payouts:
  - monthly: one per elapsed month, `principal × rate / 12`, capped at min(maturity, asOf).
  - end_of_term: a single full-term interest payout, due only once `asOf ≥ maturity`.
- `MoneyEventsService.accrueSavingInterestForAsset(householdId, assetId)` materializes each due
  period into a `money_event` (`type income`, `category 'interest'`, `fromAssetId = deposit`) plus a
  dated `AssetValuation`. `wallet` dest → inflow crediting `receivingWalletId`; `principal` dest →
  `neutral` event + `capitalizeSavingInterest` bumps the deposit (compounds).
  **Idempotency**: a period is keyed by `(deposit, 'interest', periodEnd)`; existing dates are
  skipped, so re-running is a no-op. `accrueHouseholdInterest` loops a household's deposits.
- Endpoints (money-events controller): `POST …/money-events/accrue-interest` (household) and
  `POST …/money-events/assets/:assetId/accrue-interest` (one deposit). Called by an external worker.
- Note: `computeCurrentValue` is unchanged — it still returns the continuously-accrued value at
  `AS_OF` and ignores `interestPayment`. The accrual flow is the source of dated valuation history +
  cash movement; the two are intentionally separate (a deliberate MVP simplification).

## FX

`fxRateToVnd(base)`: VND→1; else finds a base→VND rate, returns **`null` if missing** (caller treats null as "value undefined" → `computeCurrentValue` returns 0, never mis-prices at rate 1). Frontend is currently stubbed (`fxToVnd → 1`). See [[market-data]].

## State cleanup invariant (`normalizeAsset`, backend)

Exactly one valuation source per asset — changing mode clears the others:
- `manual` → clears marketPosition + calculationTerm; defaults manualValue = 0.
- `market_priced` → clears manualValue + calculationTerm.
- `formula_calculated` → clears manualValue + marketPosition.

## Valuation persistence

`upsertCurrentValuation` (backend) recomputes via `computeCurrentValue` and writes/updates an `AssetValuation` row dated `AS_OF`, mapping mode → method:
`manual → manual`, `market_priced → market_price_api`, `formula_calculated → formula_calculated`. It also writes **lineage** (`source`: user/market_price_api/formula; `confidenceLevel`: high for manual, else medium; `marketPriceId`/`fxRateId`/`calculationTermId` stay null until a pricing-API writer + term-id-on-entity land) and — crucially — **writes the derived value back to `assets.current_value`** so the cache is true for EVERY mode. Previously the plain create/update path only wrote `manualValue`, leaving `current_value` stale for market_priced/formula assets.

## Value history over time (asset detail page)

`asset_valuations` holds at most one row per asset (always dated `AS_OF`), so the
asset detail page's "value over time" chart (biến động theo thời gian)
**reconstructs** the series on the backend
(`GET /api/households/:householdId/assets/:assetId/value-history`,
`AssetsService.getAssetValueHistory`), unwinding the asset's money events from
today's value. **Two modes:**
- **market_priced** (gold/stock/crypto/fund/foreign_currency/bond) — priced from
  the **market position**: rebuild quantity held at each point (a sale adds
  `soldQuantity` back going into the past) and value it at the current unit price
  (`currentValue / currentQuantity`). A sale drops the line by
  `quantitySold × today's price`, not by the cash the sale fetched.
- **manual / formula** — unwind each event's signed cash amount (in via
  `toAsset` = +, out via `fromAsset` = −), floored at 0.

Frontend `use-asset-detail.ts` reads the endpoint for the chart; the
related-events timeline is derived separately from the household's events.
Money-event mutations invalidate the assets query prefix so the chart refreshes.
MVP approximation — replace with a real valuation-history query when one exists.

## Where it lives in code

- **frontend-web**: `src/features/assets/model/assets.ts` (`valuationModeForType`, `defaultLiquidityForType`, `computeCurrentValue`, `computeMaturityValue`). Market pricing stubbed in `src/features/assets/api/assets.repository.ts` (`latestPrice→null`, `fxToVnd→1`). Asset detail page: `src/features/assets/ui/asset-detail-page.tsx`, `use-asset-detail.ts`, `asset-value-chart.tsx`.
- **backend**: `src/common/utils/money-space.utils.ts` (`VALUATION_MODE_BY_TYPE`, `computeCurrentValue`, `fxRateToVnd`, `computeLiquidityTotals`); `src/modules/assets/` (`normalizeAsset`, `upsertCurrentValuation`).
- **mobile-app**: to be ported — must mirror the same tables and formulas.

## Enums

- `ValuationMode = manual | market_priced | formula_calculated`
- `AssetLiquidity = usable_now | not_immediately_usable | long_term`
- `AssetClass = gold | crypto | stock | fund | foreign_currency`
- `AssetType` (15 values, listed in the two tables above)

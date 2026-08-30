# Assets feature

Where the household's money/assets sit, and their current value. The valuation maths live in [[asset-valuation]]; this file covers the CRUD/summary flow.

## Overview

CRUD over `Asset`, with a derived current value. On create, `valuationMode` defaults from the asset type (see [[asset-valuation]]).

## Rules / flow

- **Discriminated form**: visible fields switch on the selected type's valuation mode. Per-mode conditional validation via `.superRefine`:
  - `manual` → requires `value`. For `cash` / `bank_account` the field is labelled **"Số dư"**, not "Giá trị ước tính": those hold a figure the user reads off an app, not an estimate.
  - `market_priced` → requires `symbol` + `quantity ≥ 0` + `purchasePrice` (original purchase price of 1 unit; see [[asset-valuation]]).
    - `stock` → `quantity` must be a **whole number** (a share is indivisible). The form drops anything after the decimal mark as it is typed; legacy fractional holdings still fail validation with an explicit message.
    - `gold` → `unit` is chosen from a fixed list (`chỉ` / `lượng` / `gram`), not typed. Free text produced "chỉ" / "Chi" / "chi vang" for one unit. A stored unit outside the list survives as an extra option when editing.
  - `formula_calculated` → requires `principal` + `startDate`, plus `interestRate ≥ 0` **unless the asset is an interest-free loan**.
    - `loan_receivable` → interest is **opt-in** (`AssetForm.hasInterest`, default **off**): money lent to family or a friend usually carries no rate. With the toggle off, no rate or payment-schedule field is shown and the term is stored as `interestRate: 0` + `interestPayment: 'end_of_term'`. Re-opening a stored 0% loan turns the toggle back off.
    - `loan_receivable` → `startDate` ("Ngày cho vay") is **required**; `maturityDate` ("Ngày đáo hạn") is **optional** — money lent to family often has no agreed due date, so the form must not block on one. Both fields stay in the main form section (not the disclosure) because the due date is what people reach for next. When a due date **is** given it must satisfy `maturityDate ≥ startDate`; a loan saved without one simply has `maturityDate: null` and cannot enter the forecast. Every other formula type also keeps `maturityDate` optional, but behind the disclosure.
- `toAsset()` converts raw form → typed `Asset`, returning `null` on incomplete inputs. `fromAsset()` does the reverse (seed the form for **edit**).
- **Edit / create share one form** (frontend-web): the same discriminated `AssetFormDialog`; edit re-seeds via `fromAsset` and PATCHes. Rows have an Edit/Delete actions menu.
- **Identity is fixed once the asset exists**: on edit, `type` — and for a
  market-priced holding its `symbol` — render as a **locked field** (the
  disabled-input recipe: `--divider` stroke, `--wash` fill, `--ink3` text),
  never a hidden one. The user still has to see what they are editing, and a
  disabled dropdown would invite a click that does nothing.
  - **Why:** the asset carries its own history — valuations, money events, goal
    claims, price points. Re-typing cash into a stock, or repointing FPT at HPG,
    would hang all of that off something the household never owned. The remedy
    is the act that happened: delete + re-enter a wrong record, or **sell** the
    position and **buy** the new one. Same reasoning as the read-only quantity
    on edit.
  - The server refuses a changed `type` / `symbol` with a 400
    (`assertIdentityUnchanged`); the form posts the whole record back, so an
    unchanged value still passes.
  - The §22.8 change summary no longer lists a type change (nothing can produce
    one), and `assets.form.changeType` is gone from both locales.
- **Counts towards flexible money**: a switch in the asset form, for **every**
  type, both directions. It sends `countsAsFlexible` (the ONE liquidity input a
  client may post); the server derives the bucket with
  `liquidityForAsset(type, countsAsFlexible)` and stores it in `liquidity`.
  - `true` → `usable_now` for any type (gold the household would genuinely sell).
    `false` on cash/bank → `not_immediately_usable` (money held for someone
    else), never `long_term`. `false` on a type that was never flexible changes
    nothing.
  - Defaults to the type's own bucket, and **resets to the new type's default
    when the type changes** (create only — the type is locked on edit) — a
    decision about cash says nothing about gold.
  - The form reads the switch back from `asset.liquidity === 'usable_now'`, not
    from the nullable flag: the bucket already folds in both the default and the
    override.
  - **The override is materialized into `liquidity`, never a second rule.** The
    forecast's starting liquid balance, the dashboard, the bucket totals and
    snapshots all keep reading that one column, so they cannot disagree — the
    failure mode the backend's CLAUDE.md warns about. §22.7/§22.8 copy states
    the consequence (`effectUsable` / `changeFlexibleOn|Off`).
- **Liquidity summary**: assets are grouped/summed into 3 buckets — "Có thể dùng ngay" (`usable_now`), "Tiết kiệm" (`not_immediately_usable`), "Dài hạn" (`long_term`). `snapshotTotal` = sum of the three (`computeLiquidityTotals` on backend).
  - **Do not label `not_immediately_usable` "dự phòng" / "reserve".** It used to
    be "Quỹ cần bảo vệ" / "Protected reserve" — the name the app also gave the
    household's emergency fund, so two unrelated numbers wore one word. The
    emergency fund has since been retired entirely, which makes the name free
    again; do not take it. The bucket is a classification of assets, and calling
    it "dự phòng" states a household intention that nobody recorded.
  - Only `usable_now` feeds `currentSharedLiquidMoney`, so money parked in a
    `saving_deposit` is already outside the spendable pool. Any future "set this
    aside" feature must ride on that same column rather than subtracting a second
    time somewhere else — that double subtraction is what sank the reserve.
- **Already owned vs. just bought** (`CreateAssetDto.fundingAssetId`) — two
  different acts that the create form must tell apart, because they move net
  worth differently:
  - **Đã có sẵn** (no funding wallet, the default) — the household is declaring
    something it holds, e.g. gold bought in 2020. Net worth **rises**: they are
    no richer, just newly honest about what they have. No money event, no wallet
    touched.
  - **Vừa mua** (a wallet id) — a purchase. Net worth **stays put**: money left
    the wallet and came back as the asset. Logs an `asset_purchase` **outflow**
    carrying `from_asset_id` and debits that wallet.

  Before this existed every entry behaved as the first, so buying 100tr of gold
  appeared to create 100tr out of nothing. Both create paths honour it — a
  brand-new asset (`logInitialPurchase`) and adding to an existing position
  (`logAdditionalPurchase`).

  - **The amount charged is the cost basis, not the live value**
    (`resolvePurchaseCost`): a market position costs `quantity × purchasePrice`.
    Buying 1 lượng at 80tr while the price says 82tr must take 80tr out of the
    wallet — charging market price would invent a loss that never happened.
  - **The wallet must cover it** (`assertFundingWalletCovers`, before the write
    transaction). Unlike an expense — recorded after the fact, possibly against
    a stale balance — a purchase is declared as it happens, so an amount the
    wallet cannot cover means the balance is out of date or the money came from
    elsewhere. Letting it through would hit the `Math.max(0, …)` floor in
    `debitManualAsset`, leaving the wallet at 0 while the asset kept its full
    value — re-inflating net worth, the very bug this removes. Spending a wallet
    to exactly 0 is allowed; only overspending is rejected.
  - **Not a column on `assets`** — it describes ONE acquisition, not the asset.
    Buying more of the same position later would have no single value to store.
    Purchase history lives in `money_events`, next to `asset_sale`.
  - Offered only for types a household actually buys (`canBePurchased`): gold,
    crypto, stock, real estate, foreign currency. Paying for a wallet out of a
    wallet is a transfer, and a saving deposit has its own funding flow.
  - Entry points: the asset form, and the **"Mua tài sản"** quick action on the
    events page — which opens that form already set to "vừa mua", mirroring
    "Bán tài sản". See [[money-events]].
- **Delete** = soft-delete (`deletedAt`) + also delete the asset's valuations + unlink the asset from any money events.
- **Status / lifecycle**: `status` (`active` | `sold` | `closed`, default `active`) + `soldAt`. Distinct from `deletedAt`: a **sold** asset is kept (quantity/value 0) for history, excluded from the liquidity buckets and net worth, but still listed (with a "Đã bán" badge; the list dropdown shows a "Bán" action for sellable, still-active assets). Selling is driven by an `asset_sale` money event — see [[asset-sale]].

## Sub-entities (backend)

- `AssetMarketPosition` — symbol / quantity / quoteCurrency / lastPrice (for market-priced).
- `AssetCalculationTerm` — principal / rate / dates / compounding (for formula-based interest instruments).
- `AssetValuation` — point-in-time value with method/confidence; optionally linked to a market price, FX rate, or calc term.

## Where it lives in code

- **frontend-web**: `src/features/assets/{model/assets.ts, model/assets.types.ts, model/assets-form.ts, api/assets.repository.ts, hooks/use-assets.ts, hooks/use-assets-page.ts}`.
- **backend**: `src/modules/assets/` (`assets.service.ts`, `entities/{asset,asset-valuation,calculation-term,market-position}.entity.ts`, `repositories/prisma-assets.repository.ts`).
- **mobile-app**: to be ported.

## Enums

`AssetType` (15), `ValuationMode`, `AssetLiquidity`, `AssetClass`, `CalculationType = saving_deposit | bond | loan_receivable | certificate_of_deposit`.

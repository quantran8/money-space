# What-if: fund a spend by selling part of an asset

- **Date**: 2026-09-03
- **Session folder**: `session/2026-09-03/whatif-funding-asset-sale/`
- **Status**: done

## What the task is

What-if starts its forecast from immediately-usable money only, so a household
with 500tr liquid + 600tr chứng khoán asking about an 800tr car got an answer
built on 500tr, with a shortfall reported and nothing to do about it.

Now: when money usable today cannot cover the spend, the result says so and
offers an optional second step — pick an asset, name an amount, re-run. The
re-run models the conversion (chứng khoán −300tr, ví +300tr) and then the spend,
and the goal block shows what selling a goal-backing asset costs that goal in
money and in time.

Nothing is persisted; no `asset_sale` money event is ever created.

## Changes made

**backend**
- `modules/assets/entities/asset.entity.ts` — `SELLABLE_ASSET_TYPES` moved here
  from `AssetsService` so the pure forecast engine can read it without importing
  a Nest provider. The service re-exports it; both names are the same set.
- `modules/forecast/domain/forecast.types.ts` — `ForecastLiquidSource.type`.
- `modules/forecast/repositories/prisma-forecast.repository.ts` — populate it
  (zero extra queries: the bundle already loads every active asset).
- `modules/forecast/domain/what-if.ts` — `applyAssetSale`, `pickReceivingWallet`,
  `isSellableForecastAsset`.
- `modules/forecast/dto/what-if.dto.ts` — optional `assetSale {assetId, amount}`;
  also dropped stale `earmark` comments.
- `modules/forecast/forecast.service.ts` — validation, a conditional third engine
  run, the two-map goal attribution, and `liquidity` / `fundingOptions` /
  `assetSale` / `afterSale` / `deltaWithSale` on the result.
- `domain/what-if.spec.ts` (new, 9 tests) + 20 service tests.

**core**
- `features/whatif/model/whatif.types.ts` — the new request/result types. The
  result additions are OPTIONAL so a client on an older backend degrades to "no
  funding step" rather than crashing.
- `features/whatif/model/whatif-asset-sale.ts` (new) — draft, options, validation.
- `features/whatif/hooks/use-whatif-asset-sale.ts` (new) — the step's state.
- `features/whatif/model/whatif-share.ts` — reports the after-sale side and names
  the sale.
- `i18n/resources.ts` — `whatif.shortfall.*`, `whatif.assetSale.*`,
  `whatif.blocks.goalTotalRow/goalDateRow`, `whatif.share.sale`, vi + en.

**web / mobile** — parallel implementations of the same three view states.
- `whatif-sheet.tsx` — question → answer → funding; "Thử số khác" now clears the
  sale as well as the result.
- `whatif-result-blocks.tsx` — shortfall line + CTA + applied-sale conversion in
  the funding-source block; per-goal before → after and dates when a sale applied;
  the after-sale side becomes "after" throughout.
- `whatif-asset-sale-step.tsx` (web) / `whatif-asset-sale-fields.tsx` (mobile).

## Key decisions

- **The sale is a t0 rebalance of `input.assets`, not a synthetic incoming
  event.** An inflow never reaches `startingLiquidBalance` (so flexible money
  would not move despite cash landing today) and would become
  `nextSufficientlyCertainInflow`, moving that figure for an unrelated reason;
  and `walletValuesAfterOutflows` deliberately never credits incoming, so the
  goals would pay for the spend AND the sale. Guarded by a test asserting
  `afterSale.flexibleMoneyToday − after.flexibleMoneyToday === proceeds`.
- **Wallet-only maps for spending, wallet-plus-sold-asset maps for goal
  attribution.** The sold asset must never reach `spreadAcrossWallets` or an
  illiquid asset pays for a purchase with no sale. Guarded by a test.
- **Goal impact keeps the existing `fixed` cap rule** (confirmed with the user):
  selling 300tr of a 600tr stock with a 400tr claim costs the goal 100tr, not
  300tr — the unclaimed 200tr sells first, the same "free money first" rule the
  spend uses. `percent` claims drop pro-rata on their own. Expect this to be
  re-reported as a bug; it is not.
- **No fee field** (confirmed): what-if reports no net-worth figure, and nobody
  knows the brokerage fee while exploring. `netProceeds` is kept distinct so
  adding one later is not a breaking change. A `noFee` assumption line says so.
- **Value only, no quantity, no sale date.** Goal progress is a function of
  value; a sale dated after the spend cannot fund it.
- **The asset picker is not the banned wallet picker** — the argument is written
  into `memory/what-if.md` and the component doc comments, because the next
  reader will flag it.
- **Trigger on `liquidity.shortfall`**, not `resultType` and not a negative low
  point: the spend is `planned`, so `obligationsCovered` can never flip from it,
  and a negative low point is a horizon fact where "sell your stock" is the wrong
  suggestion.
- **Plain `useState`, not RHF** for the step: two fields, one rule, and mobile's
  never-disabled button fights RHF's `isValid`.

## Mobile app parity notes

Mobile received the full feature in this task — it had already been ported to
answer-first, so it uses the same three view states as web rather than the
disclosure originally planned. Differences that are deliberate and must stay:

- The primary button is never disabled (§22.10); pressing with an incomplete
  draft sets inline field errors instead.
- `Select` (bottom sheet, auto-search past 8 options) instead of the web combobox;
  `Sunk` instead of the web's tint block for the preview and conversion rows.
- No CTA `Button` variant difference beyond `secondary` vs web's `outline`.

**Not verified by typecheck**: `mobile/node_modules` is empty in this workspace,
so `npx tsc --noEmit` cannot resolve `expo/tsconfig.base` or `react-native`
(2303 errors, all environmental). The three mobile files were syntax-checked with
esbuild and follow the web implementation exactly. Run the mobile typecheck after
`pnpm install`.

## Follow-up round (same day)

Four rounds of feedback after the first pass, all UI-truthfulness bugs:

**1. The sale was invisible in the wallet breakdown.** `wallet.before` was read
off the sale-topped-up map, so a wallet holding 13,6tr reported having held 100tr
and paid all of it. `before` is now the wallet's OWN money and `fromSale` is
reported beside it ("gồm 86,4tr từ bán tài sản"). Guarded by a mutation-tested
regression test.

**2. `shortfall` was stale after the sale covered it** — the header read "đủ tiền"
while a red line still said "Còn thiếu 86,4tr", and the CTA stayed on screen
after being used. It now nets off the proceeds.

**3. Value-only selling was not executable.** You cannot sell "86,4tr of gold",
you sell 6 chỉ. Market assets (anything with a `marketPosition`) are now sold by
`quantity` in their own `unit`; manual assets keep the value field. The quantity
is **pre-filled** with the smallest whole number of units covering the shortfall,
rounded UP (5,56 chỉ is not sellable; rounding down leaves them short). Selling
the whole position realises `currentValue`, so "bán tất cả" leaves no crumbs.
`seedUnitPrice` was moved from `use-asset-sale.ts` to the pure
`asset-sale-form.ts` so the what-if hook can reuse the same price precedence
without importing `useEvents`.

**4. The receiving wallet must be chosen.** The engine used to pick the
least-promised wallet. It cannot: which account holds the cash decides which
goals it sits in front of, and a real `asset_sale` names `to_asset_id`. Now a
required `assetSale.toAssetId`, validated `usable_now` and ≠ the asset sold.
`pickReceivingWallet` was deleted as dead code.

Also in this round:
- **The sale is no longer a slice of the funding chart.** That chart splits the
  spend by what KIND of money gave way; the sale is not a kind of money. It
  shows as the conversion block and the per-wallet `fromSale` line instead.
- **Block 5 (Dòng tiền) now shows the sold asset's before → after.** The balance
  bars only draw cash, so the asset side of the conversion was invisible.

### Decision worth re-reading

The receiving-wallet picker is a **narrow, deliberate exception** to
`memory/what-if.md`'s "No wallet picker" rule. That rule is about the SPEND's
routing, which is still never asked. The argument is written into the memory doc
and the component doc comments, because the next reader will flag it.

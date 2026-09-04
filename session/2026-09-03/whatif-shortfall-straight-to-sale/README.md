# What-if: not enough money goes straight to the sale form

- **Date**: 2026-09-03
- **Session folder**: `session/2026-09-03/whatif-shortfall-straight-to-sale/`
- **Status**: done

## What the task is

Reported flow problem: when the planned spend is bigger than the wallets hold
and the household would have to sell something, `Xem thử` dropped them on the
full five-block result and left them to scroll down to block 4 to discover the
`Thử bán một phần tài sản` button. The gap was the answer, and the one action
that addresses it was the hardest thing on the screen to find.

Now `Xem thử` decides, from the answer it just got, which question comes next:

1. Usable money covers the spend → the result, unchanged.
2. Short, and selling could close it → the funding step opens **immediately**,
   pre-filled, led by the shortfall line. Exit is `Xem kết quả không bán`.
3. Short, and selling everything still could not close it → the result, with
   the shortfall line replaced by one that says why there is no funding step.

Case 3 is the guard: the frontend already knows what the holdings add up to, so
it says the spend is out of reach today rather than offering an asset picker
whose every option leaves them short.

## Changes made

**core**
- `features/whatif/model/whatif-asset-sale.ts` — `totalSellableValue(options)`,
  the ceiling on what selling could raise.
- `features/whatif/hooks/use-whatif-asset-sale.ts` — exposes it as
  `sellableTotal`.
- `i18n/resources.ts` — `whatif.shortfall.lead` (the step's opening line),
  `whatif.shortfall.beyondAssets`, `whatif.shortfall.noAssets`,
  `whatif.assetSale.skip`. vi + en.

**web / mobile** — the same three changes on each.
- `whatif-sheet.tsx` — `runWith` returns the result so `handleRun` can branch on
  the shortfall synchronously; `openSaleStep(gap)` extracted; `saleWasOffered`
  picks the exit label; `saleCouldCover` now gates the result's CTA too;
  `shortfallNote` computed here.
- `whatif-result-blocks.tsx` — optional `shortfallNote` overrides
  `whatif.shortfall.line`.
- `whatif-asset-sale-step.tsx` (web) / `whatif-asset-sale-fields.tsx` (mobile,
  new `shortfall` prop) — the shortfall lead line above the first field.

## Key decisions

- **Branch on the value `run()` returns, not on `result` from state.** The
  decision has to be made in the same tick as the click; reading `result` would
  be one render behind and would need an effect to catch up.
- **The capacity check is client-side and needs no backend change.**
  `sale.options` comes from `useAssets`, which is already loaded before the run,
  and `currentValue` is all the ceiling needs. `fundingOptions` (undefined on a
  first run) only supplies the per-asset goal-claim figure, which the check does
  not read.
- **Case 3 states, never advises** (§Voice). "Khoản chi này chưa nằm trong khả
  năng hiện tại" reports a fact about the money; it does not say not to buy.
- **The exit label depends on how the step was reached.** Arrived unrequested it
  is a decision (`Xem kết quả không bán`); arrived from the CTA it is `Quay lại`.
  Same button, and `handleTryAnother` clears the flag with the sale.
- **A partial sale is still allowed.** When no single asset covers the gap but
  the total does, the step seeds the biggest holding and the existing
  `Chưa đủ bù khoản còn thiếu` dot line does the telling. Applying a sale that
  does not fully close the gap remains a legitimate hypothesis — the guard is
  about a gap NOTHING can close, not about an incomplete draft.

## Mobile app parity notes

Mobile received the change in the same task; both platforms have all three
states. Differences that are deliberate and must stay:

- The `BottomSheet` chrome title stays `whatif.title` in every state (mobile has
  one sheet title); the state is carried by the description line and the lead.
- The primary button is never disabled (§22.10), so mobile's `handleRun` reports
  a missing amount via `amountError` before it can reach the branch.

**Not verified by typecheck**: `mobile/node_modules` is empty in this workspace,
so `npx tsc --noEmit` cannot resolve `expo/tsconfig.base`. The three mobile files
were syntax-checked with esbuild and mirror the web implementation. Web +core
`npx tsc -b` is clean and `pnpm lint` reports 0 errors (the copy check passes on
the four new strings).

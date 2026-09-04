# What-if funding step: several assets, and a household with no wallet

- **Date**: 2026-09-04
- **Session folder**: `session/2026-09-04/whatif-multi-asset-sale-and-walletless/`
- **Status**: done

## What the task is

Two bugs in the what-if funding step ("thử bán một phần tài sản"):

1. Short of money, the step let the household pick **only one** asset to sell.
2. A household with **no cash/bank wallet** could not get past the step at all.

Both were dead ends rather than cosmetic: the first opened a form that could not
be completed, the second a required field with nothing in it.

## Changes made

### Core (`packages/core`)

- `features/whatif/model/whatif.types.ts` — `WhatIfAssetSale` is now
  `{ lines: {assetId, amount}[], toAssetId }`; `WhatIfAppliedSale` carries
  `lines[]` plus the summed `amount`. Added `UNASSIGNED_WALLET_ID`.
- `features/whatif/model/whatif-asset-sale.ts` — draft is a list of keyed lines
  with a shared `toAssetId`; errors are keyed per line. `receivingWalletOptions`
  falls back to the unassigned option when the household holds no wallet.
  `validateWhatIfAssetSale` checks every line (not just the first bad one) and
  refuses the same asset twice. Added `lineProceeds`, `hasAssetSaleErrors`,
  `soldAssetNames`, `emptyLineDraft`.
- `features/whatif/hooks/use-whatif-asset-sale.ts` — per-line setters,
  `addLine` / `removeLine`, `canAddLine`, and a `lines` view model carrying each
  line's option, proceeds and remainder. A new line is estimated against what
  the earlier lines still leave open.
- `features/whatif/model/whatif-share.ts` — names every sold holding.
- `i18n/resources.ts` — new keys (vi + en): `addLine`, `removeLine`,
  `assetDuplicate`, `lineRemaining`, `stillShort`, `unassignedWallet`.

### Web

- `features/whatif/ui/components/whatif-asset-sale-step.tsx` — rewritten around
  a `SaleLine` sub-component, a "Bán thêm tài sản khác" button, one shared
  wallet picker, and a total that says how much is still short.
- `features/whatif/ui/components/whatif-result-blocks.tsx` — the cashflow row
  and the applied-sale panel iterate `assetSale.lines`.

### Mobile

- `features/whatif/ui/whatif-asset-sale-fields.tsx` — same structure, RN
  primitives; remove control is a 44pt `Pressable`.
- `features/whatif/ui/whatif-result-blocks.tsx` — both sale sections iterate
  `lines`.

Neither sheet needed a logic change: `sellableTotal >= shortfall` is now an
honest gate, since several holdings really can be combined.

### Backend

- `dto/what-if.dto.ts` — `lines[]`; re-exports `UNASSIGNED_WALLET_ID`.
- `domain/what-if.ts` — owns the sentinel (keeps the engine free of DTO
  imports); `AppliedAssetSale` gains `lines[]` and a nullable
  `receivingAssetId`; `applyAssetSale` subtracts every line and, with no wallet,
  appends `unassignedProceeds` as a `usable_now` source.
- `forecast.service.ts` — per-line validation (sellable, within value, no
  duplicates), the sentinel accepted **only** when the household holds no
  `usable_now` asset, goal attribution over every sold asset, and a multi-line
  response.
- Specs — migrated to the new shape, plus new cases: selling two holdings to
  close a gap neither could, a walletless household, an empty `lines`, a
  duplicated asset, and the sentinel misused by a household that has wallets.
  147 tests pass.

### UI follow-ups (same session)

- `components/ui/dialog.tsx` — the close button had `p-1` and no flex centring,
  so at the sale step's `size-11` override the glyph sat in the corner of its
  hover circle. Added `flex items-center justify-center` at the primitive, which
  fixes every dialog that resizes it.
- `whatif-asset-sale-step.tsx` / `whatif-asset-sale-fields.tsx` — each line now
  has a header row ("Tài sản N" + a red circled `−`) instead of a bare `X`
  floating beside the asset dropdown, where it read as an action on the select.
  The circle is `bg-alert` (a fill) with `text-alert-ink` on it (readable).
- `whatif-sheet.tsx` — the sale step's scroll area had no right padding, so the
  scrollbar sat flush against the cards. `-mr-2 … pr-3` gives it a gutter while
  the content keeps the dialog's padding grid.
- New i18n key `whatif.assetSale.lineLabel` (vi + en).

### Out-of-reach spends state the reason first

A spend beyond *everything* sellable still landed the household on the funding
step. The gate was right in principle (`sellableTotal >= shortfall`) but read
two ways that both failed:

- `sellableTotal` is derived from the client's own asset list, which is a
  separate query. While it is loading the list is empty and the total is 0 —
  indistinguishable from "nothing can be sold", so the app answered a question
  it had not looked at yet.
- When the gate did refuse, the reason lived inside block 4 of the result,
  behind a ~2s-per-block reveal sequence and a scroll. A spend nothing could
  fund read as an ordinary answer until the household went hunting.

- `whatif-asset-sale.ts` — new `fundingVerdict(shortfall, sellableTotal,
  optionCount, isTotalKnown)` returning `none | canCover | noAssets |
  beyondAssets`, shared by both clients so they cannot disagree about when the
  step opens or why it did not.
- `use-whatif-asset-sale.ts` — exposes `isSellableTotalKnown` (from the assets
  query's loading state) so an unloaded list is never read as an empty one.
- Both sheets — gate and note both come from the verdict.
- Both `whatif-result-blocks.tsx` — `shortfallNote` is now the answer's FIRST
  panel instead of a line inside the funding-source block; block 4 shows its
  plain `shortfall.line` again, so nothing is said twice.

Considered and rejected: a toast at the moment of running. `notify` is
deliberately two calls (`success` / `error`) and widening it to a warning would
be the "second, competing way to talk to the user" its own contract warns
against — and a toast disappears, while this is a standing fact about the
answer that stays true as long as it is on screen.

### Seeded quantities were rounded DOWN below the gap they were filled for

Selling three holdings whole still reported "còn thiếu 50.626đ": the step opened
already short. `quantityForShortfall` returned the exact fraction
(0,005169…) and `formatQuantity` then rendered it at 4 decimals — rounding
DOWN. The household saw 0,0052 but the seeded number behind it was worth less
than the gap, so the sum of the lines landed just under the shortfall.

- `whatif-asset-sale.ts` — `quantityForShortfall` now rounds UP at the same
  precision the quantity is displayed with (`QUANTITY_DECIMALS = 4`), so the
  figure on screen IS the figure that gets sold. Whole-number holdings keep
  `Math.ceil`. The step is applied as an integer count of steps rather than
  `/ step * step`, which reintroduced binary error (0,0052 →
  0,005200000000000001).

Checked against gold (chỉ), stock (cổ), and BTC at both a partial and a
whole-position gap: every seeded line now realises at least what it was seeded
for, or the entire holding.

Note this was NOT a gate defect. `totalSellableValue` sums `currentValue`, and
`lineProceeds` returns `currentValue` for a full sale rather than re-deriving it
from a rounded quantity — so the ceiling the gate compares against is genuinely
reachable. Comment added to say so, since the two functions must keep agreeing.

### Amount-too-large is answered on the FORM

Asked for: say it at the input, not after a run and a screen.

- `whatif-asset-sale.ts` — `exceedsEverything(amount, liquidTotal,
  sellableTotal, isTotalKnown)`. Returns `null` while either figure is loading
  (an unknown ceiling must never read as a ceiling of zero). Compares against
  the RAW liquid total (`currentSharedLiquidMoney`), NOT flexible money —
  money a goal has claimed is still the household's, and calling a merely
  expensive spend impossible would be a verdict rather than a fact.
- `whatif-field.tsx` — `WhatIfField` gained an `error` prop (red border +
  message under the box), matching the sale step's field styling.
- Web sheet — message under `Số tiền`, `Xem ảnh hưởng` disabled. Mobile — same
  message via the existing `amountError`, button stays enabled (§22.10).

### The at-risk bill row said "−174,0 tr" with no label

Reported as "upcoming event shows negative money". The figure was correct —
`balanceAfter`, the running balance when the item comes due, which is exactly
what put it at risk — but nothing on the row said so, and a large red number
beside a bill's name reads as the bill itself. Verified against the backend:
`at-risk-occurrences.ts` documents it as the balance, and the screenshot's
figures reconcile (~26tr on hand → 200tr spend → −174tr → the 4tr bill short by
its full amount, since the balance is already below zero).

This turned out to have TWO causes, tracked separately below: the figure itself
was computed in the wrong world (a real backend bug), and the row was showing a
raw running balance where a plain statement belonged. `whatif.bills.need` became
unused and was removed.

### At-risk bills were judged in the wrong world (real bug)

The `−174,0 tr` on a bill row was not a formatting problem after all. With a
sale applied, `newlyAtRisk`, `resultType` and `obligationsCovered` were all
resolved against `afterForecast` — the spend WITHOUT the sale — while every
other field (`afterSale`, `deltaWithSale`, the wallet drain) and the entire
client already treat the after-SALE side as the answer.

So a bill the proceeds had already paid for was still listed as broken, and its
`balanceAfter` was walked from a starting balance that ignored every đồng
raised: ~26tr of wallets − a 200tr spend = −174tr, with the ~176tr of sale
proceeds nowhere in the walk.

- `forecast.service.ts` — one `answerForecast = afterSaleForecast ??
  afterForecast` now feeds `classifyResult`, `obligationsCovered` and
  `findNewlyAtRisk`, so the tone, the flag and the bill list cannot describe a
  different world from the figures beside them.
- `forecast.service.spec.ts` — `newlyAtRisk` had NO coverage, which is how this
  survived. New test: a 4tr bill against a 600tr spend is at risk without a
  sale and absent with one, and `obligationsCovered` agrees with the list.
  Verified it fails against the pre-fix code.
- `memory/forecast-and-flexible-money.md` — the rule written down.

On the UI side the running balance is now gone from the row entirely. Reordering
it or labelling it were both tried and both kept a figure on screen whose only
job was to be reasoned about; what the household needs is whether the item can
still be paid. The row says it: "Không đủ tiền để trả", with "thiếu 4,0 tr /
4,0 tr" beneath. `whatif.bills.short` and the balance line were removed.

### Memory

- `memory/what-if.md` (frontend), `memory/forecast-and-flexible-money.md`
  (backend) — the multi-line rule and the unassigned-wallet rule, with why each
  is bounded. `memory/asset-sale.md` (both) — dropped a stale "value only, no
  quantity" line.

## Key decisions

- **One shared receiving wallet, not one per line.** A household selling gold
  and stocks for a single purchase banks the proceeds together; per-line pickers
  would double the fields on a phone for a choice nobody makes differently. The
  shape is a list of lines plus one `toAssetId`, so per-line wallets remain
  addable later without another breaking change.
- **The unassigned wallet is offered only when there is no real one**, and the
  backend rejects it otherwise. It exists so a walletless household can model a
  sale — not as a way to park imagined money outside the reach of the goals
  sitting in front of a real account, which is the whole reason the caller names
  a wallet.
- **The same asset cannot appear twice.** Two lines each passing their own
  "not more than you hold" bound would together sell 200% of one holding.
  Enforced on both client and server.
- **A new line estimates against the REMAINING gap.** Estimating each against
  the full shortfall would pre-fill the second asset to cover a gap the first
  already closed.
- **No backward compatibility.** Web and mobile ship together against this
  backend, so the single-`assetSale` shape was replaced rather than bridged.

## Mobile app parity notes

Already done in this repo — `mobile/` was changed alongside `web/`, and both
typecheck and lint clean. Both clients read the same core hook, so the only
divergence is layout:

- Web wraps each line in a bordered card and uses a `lucide-react` `X` / `Plus`;
  mobile uses a 44pt `Pressable` with a text glyph and a `secondary` Button,
  since mobile's Button takes a plain string child (no icon slot).
- Mobile keeps its per-line `Sunk` preview (`assetSale.preview`) and the
  `goalClaimed` line; web shows a compact `lineRemaining` caption instead. Both
  are deliberate, pre-existing differences — do not unify.
- Mobile's primary button stays enabled (§22.10); validation still reports on
  submit.

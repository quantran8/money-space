# What-if

"If we spend this, what happens?" — the feature people pay for (spec §26D,
05 §5). Related: [[forecast-and-flexible-money]], [[goals]].


## What the result must say (not just "something breaks")

Four things, all resolved by the same code the rest of the app uses:

- **Goal cost per goal, in money AND in time.** "Mục tiêu giảm 3tr" says what
  leaves; "chậm 2 tháng" says what it costs, and the second is the half that
  decides anything. `null` months when the goal declared no pace — without a
  rate there is no honest way to turn money into time.
- **Which half gave way** — this month's contribution, or money already set
  aside. Different events, not equally serious. See [[goals]].
- **`newlyAtRisk`: WHICH bills stop being payable**, with dates and shortfalls.
  `obligationsCovered: false` alone is enough to worry someone and not enough to
  act on. Only items the spend actually breaks — one already going unpaid is not
  this purchase's doing.
- **`uncovered`**: the part no wallet could cover. The money is not there at
  all, which is a different sentence from a later bill going unpaid.

**No wallet picker.** What-if is a household-level question, so the spend is
taken in this order: genuinely free money in every wallet first, then goal money
by the household's own ranking (`low` → `medium` → `high`), with the amount
promised breaking ties inside a rank. **Priority outranks amount** — 1tr behind a
`high` goal is not more expendable than 50tr behind a `low` one. Asking which
account would make the cheapest exploration the most annoying, and the household
usually has not decided.

## The funding step, and why its pickers are not that picker

When money usable *today* cannot cover the spend, the result says so
(`liquidity.shortfall`) and offers one optional second step: pick an asset,
confirm how much of it to sell and which wallet the money lands in, then re-run.
A reader who knows the rule above will flag this as a violation, so the argument
lives here:

1. **A different question.** The banned picker asks which wallet the spend comes
   *out of* — routing, which the engine answers better than the household using
   their own goal ranking, and which this feature does not touch. This picker
   asks what to convert *into* usable money, which the engine cannot answer:
   gold vs stocks vs crypto is a preference, not a derivable fact.
2. **Optional, and second.** The banned picker would tax every exploration as a
   required field on the first question. This appears only after an answer, only
   on a shortfall, and can be ignored forever.
3. **A second premise, not routing.** "Chi 800tr" and "chi 800tr và bán 300tr
   chứng khoán" are two different hypotheses. Refusing the second does not
   protect the rule; it just means the app can only model one of the two things
   a household short of cash actually does.
4. **The receiving wallet IS picked, and that is the narrow exception.** The
   engine used to choose the least-promised wallet. It cannot: which account
   holds the cash decides which goals it is sitting in front of, and a real
   `asset_sale` names `to_asset_id` for the same reason. So the step asks — one
   dropdown of `usable_now` wallets, defaulted to the largest. The banned picker
   is about the SPEND's routing, which is still never asked.

All three invariants hold: nothing is persisted (**no `asset_sale` money event —
the hook must never call `createEvent`**), it stays a READ, and the copy names a
possibility ("Thử bán một phần tài sản") without ever saying selling is the
right move.

**The step sells in the asset's own unit, and estimates the quantity itself.**
Value-only was the first design and it was wrong: you cannot sell "86,4tr of
gold", you sell 6 chỉ. A market asset (one with a `marketPosition` — gold,
stock, crypto) is therefore sold by `quantity` in its own `unit`, and the money
figure is derived at `unitPrice`. Manual assets (investment, bond) have no unit
and keep the value field.

The quantity is **pre-filled** with the smallest whole number of units worth at
least the shortfall (`quantityForShortfall`), rounded UP — 5,56 chỉ is not
sellable, and rounding down would leave the household still short. A holding
that is not a whole number (crypto) keeps fractions. Changing the asset
re-estimates against the same gap, since 86tr is 6 chỉ of gold and a quite
different number of shares. The household is here because they are short a known
amount; making them do that arithmetic is work the app can do, and both fields
stay editable.

Selling the WHOLE position realises `currentValue` rather than
`quantity × unitPrice`, so "bán tất cả" leaves no rounding crumbs behind.

`unitPrice` comes from `seedUnitPrice` — the same today's-quote-first precedence
the real sale form uses (moved to `asset-sale-form.ts` so the what-if hook can
read it without importing `useEvents`). With no quote it falls back to the
position's own average, which keeps a priceless holding sellable in a hypothesis.

**Several holdings, one destination.** The step was single-asset at first, and
that made it unfillable for the household it exists for: short 500tr against
300tr of gold and 250tr of stocks, no single option closes the gap, yet
`sellableTotal >= shortfall` opened the step anyway. So the draft is a LIST of
lines (`assetSale.lines: {assetId, amount}[]`), each with its own asset and its
own quantity/value field, and `Bán thêm tài sản khác` adds one. Each new line is
estimated against what the earlier lines still leave open, not the whole
shortfall — otherwise the second asset pre-fills to cover a gap the first has
already closed. The same asset twice is refused on both sides: two lines each
passing their own bound would sell 200% of one holding.

The receiving wallet stays SHARED across the lines rather than per line. A
household selling gold and stocks to pay for one thing banks the proceeds
together, and asking twice would double the fields on a phone for a choice
nobody makes differently.

The proceeds land in a wallet the household names (`assetSale.toAssetId`),
validated `usable_now` and different from every asset being sold — the same two
rules the real sale enforces.

**A household with no wallet can still sell.** `receivingWalletOptions` filters
on `canSettleCashflow`, so a household tracking only gold and stocks has an
empty list — and used to hit a required picker with nothing in it, with no way
forward. The list then carries one option instead: `UNASSIGNED_WALLET_ID`, "tiền
mặt chưa gửi vào tài khoản". The backend treats it as a `usable_now` source of
its own (`unassignedProceeds`) rather than crediting an account, which is the
truth of an imagined sale: usable money that no goal is standing in front of.

It is offered **only** when there is no real wallet, and the backend rejects it
whenever the household holds one. Otherwise it becomes a way to park imagined
money outside the reach of the goals sitting in front of a real account — which
is exactly the fact point 4 above exists to preserve.

Still no fee and no sale date: nobody knows the brokerage fee while exploring,
and a sale dated after the spend cannot fund it. `real_estate` is hidden because
a partial property sale is priced by area. A `noFee` assumption line says what
was left out.

**Selling a goal-backing asset lowers that goal**, and by the existing rule: a
`fixed` claim is capped at the asset's live value, so the unclaimed part of a
position sells first — selling 300tr of a 600tr stock carrying a 400tr claim
costs the goal 100tr, not 300tr. A `percent` claim drops pro-rata. The picker
shows "Mục tiêu đang giữ {amount}" per asset so this is a choice made knowingly.
See [[goals]].

Still never a verdict: every one of these reports consequence. `resultType`
picks a colour and nothing more.

## Overview

The user names an amount and a date. The backend builds a synthetic outgoing
event **in memory**, re-runs the forecast, and returns before/after plus a
delta. Nothing is written.

## Three invariants

1. **Nothing is persisted.** There is no scenarios table and there must not be
   one (§2.12). So the UI has **no "Save scenario" action**, ever. The share
   action copies text to the clipboard — that is all.
2. **It is a READ.** A `view_summary` partner must be able to run one. It is a
   POST only because it needs a request body. Never gate it behind `edit`.
3. **It reports consequence, never a verdict.** It never says whether to buy.
   `resultType` (`comfortable | watch | tight | not_covered`) selects a colour
   and nothing else — never render it as "bạn nên / không nên mua".

## Placement

What-if is a **global contextual action, not a destination**. There is
deliberately no `/what-if` route. One `WhatIfSheet` is mounted in `AppShell` and
driven by `shared/stores/whatif-store.ts`; openers live on Home, `/upcoming`,
`/goals`, `/goals/:id`, and a mobile FAB.

## Mandated result-block order

1. **Impact summary** — how many things are affected, split into bills and goals
2. **Which bills** stop being payable, with dates and shortfalls
3. **Which goals** give way, and how much later they land
4. **Where the money comes from** — the evidence behind 2 and 3, and the home of
   the shortfall line, the funding CTA, and the applied-sale conversion
5. **The balance bridge** — before → after, where it bottoms out, and (with a
   sale) what the sold asset dropped to
6. **Assumptions**

Bills before goals because a bill going unpaid is an obligation and a goal
slipping is a promise the household made to itself (§16) — the same reason bills
carry `alert` and goals `attention`. Funding source sits at 4 rather than 1
because it is the answer's *evidence*: leading with it would open on bookkeeping.

The shortfall belongs in block 4, not a block of its own: "money usable today is
300tr short" is a statement about where the money comes from, and the CTA out of
it is a door, so it goes last inside that block. The applied-sale conversion sits
in the same block, above the split, because it is where that money came from.

**The sale is NOT a slice of the funding chart.** That chart splits the spend by
what KIND of money gave way — free, this month's pace, money set aside — and the
sale is not a kind of money, it is where some of it came from. It is stated as
the conversion block and as "gồm {amount} từ bán tài sản" on the wallet row that
received it. Block 5 carries the other half: the sold asset's own before → after,
since the balance bars only ever draw cash and the asset side would otherwise be
invisible.

`resultType` lost `watch` with the protected reserve: it fired only when the low
point stayed positive but dipped under the reserve. Now `not_covered | tight |
comfortable`, and the funding step deliberately adds no fourth variant — a
shortfall is a number (`liquidity.shortfall`), not a tone.

`takeFromGoal` distinguishes money coming out of what is already saved for the
goal (`currentAmount` drops) from money that displaces future contributions.

Per-goal `before → after` totals and projected dates render **only when a sale
was applied**. Then the goal's backing asset genuinely shrank, so its total
moved and the pair is the fact; without one the cost is a pace/set-aside
displacement, and a same-size pair would put the subtraction back on the reader —
which is what the answer-first rewrite removed.

## Where it lives in code

**core** (`packages/core/src/features/whatif/`) — shared by web and mobile:
- `model/whatif.types.ts` — request/result plus the `resultType` tone map.
- `model/whatif-share.ts` — the share summary. Reports the after-SALE side when
  one was applied, or it would paste figures nobody is looking at.
- `model/whatif-asset-sale.ts` — the funding draft, the sellable-asset options
  and their validation. Pure.
- `hooks/use-whatif.ts` — a mutation with **no cache invalidation**, because it
  writes nothing.
- `hooks/use-whatif-asset-sale.ts` — the funding step's state. Plain `useState`,
  not RHF: two fields with one rule, and mobile's never-disabled button (§22.10)
  fights RHF's `isValid` gating. **It has no mutation and must never gain one.**

**web** (`web/src/features/whatif/ui/`) and **mobile**
(`mobile/src/features/whatif/ui/`) are parallel implementations of the same
three view states — question → answer → funding — differing only where the
platforms must: mobile's primary button is never disabled and reports what is
missing on press, web's is gated. Both put the funding step in the sheet's one
place for questions rather than expanding it inside the result, which would
stack an asset picker under the hero and undo answer-first.

- `whatif-sheet.tsx` — outer shell keys the inner form on the prefill, so each
  question starts clean without a state-syncing effect. "Thử số khác" clears the
  sale as well as the result: carrying a sale into a different question would
  answer something the household did not ask.
- `whatif-result-blocks.tsx` — the six blocks, in order.
- `whatif-asset-sale-step.tsx` (web) / `whatif-asset-sale-fields.tsx` (mobile).

**backend**: `src/modules/forecast/domain/what-if.ts`, `POST /what-if`.

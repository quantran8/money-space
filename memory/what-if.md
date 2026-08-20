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

1. Upcoming Safety — lowest projected balance before → after, the change, and
   the "obligations not covered" line when it applies
2. Goal consequence (only when a goal was in scope)
3. Assumptions

It was five. "Reserve impact" went with the protected reserve, and "Flexible
money before/after" went with it: that block read `flexibleMoneyHorizon`, which
after the removal is `lowestProjectedBalance` — the same two numbers block 1 was
already showing. What survived (the delta sentence, the coverage warning) moved
up into block 1 rather than being deleted with its container.

`resultType` lost `watch` for the same reason: it fired only when the low point
stayed positive but dipped under the reserve. Now `not_covered | tight |
comfortable`.

`takeFromGoal` distinguishes money coming out of what is already saved for the
goal (`currentAmount` drops) from money that displaces future contributions.

## Where it lives in code

**frontend-web** (`src/features/whatif/`):
- `model/whatif.types.ts` — request/result plus the `resultType` tone map.
- `model/whatif-share.ts` — the clipboard summary.
- `hooks/use-whatif.ts` — a mutation with **no cache invalidation**, because it
  writes nothing.
- `ui/whatif-sheet.tsx` — outer shell keys an inner form on the prefill, so each
  question starts clean without a state-syncing effect.
- `ui/components/whatif-result-blocks.tsx` — the five blocks, in order.

**backend**: `src/modules/forecast/domain/what-if.ts`, `POST /what-if`.

# What-if

"If we spend this, what happens?" — the feature people pay for (spec §26D,
05 §5). Related: [[forecast-and-flexible-money]], [[protected-reserves]],
[[goals]].

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

1. Upcoming Safety (lowest projected balance, before → after)
2. Reserve impact
3. Flexible money before/after (`flexibleMoneyHorizon`)
4. Goal consequence (only when a goal was in scope)
5. Assumptions

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

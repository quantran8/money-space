# Forecast & flexible money

The calculation surface behind Clarity and Foresight (spec §26A–D). Related:
[[cashflow-events]], [[what-if]], [[goals]].

## Overview

The forecast expands cashflow events across a horizon (7/30/60/90 days, default
30) and produces a **running balance day by day**. From it come flexible money
(§26B) and the financial state (§26D).

The full domain rules live in the backend repo's
`memory/forecast-and-flexible-money.md` — canonical, do not fork. This file is
what the web client must respect.

## Non-negotiable client rules

- **Never clamp a balance or a flexible-money figure at zero.** No
  `Math.max(0, …)`. Negative is the signal the product exists to surface.
- **Never call flexible money a spending allowance** (design §12.3) — not
  "Ngân sách được phép tiêu", not "Số tiền bạn nên tiêu".
- **`estimated` incoming is displayed but not banked.** It must be visibly
  marked; presenting it as certain would break the conservative guarantee.
- **Red is only for an actual projected shortfall** (balance < 0); everything
  else is neutral. Encoded in `balanceTone`, which is now binary — the amber
  "near the protected reserve" tier went with the reserve, and bringing a
  warning band back would mean picking a threshold the household never gave us.
- **The backend never sends prose.** Assumptions and reasons are machine codes;
  the client renders every sentence.
- **Nothing is ever resolved on the household's behalf.** An overdue occurrence
  (`wasClampedFromPast`) is listed under day 0 and **stays counted** — it is
  still owed, so it remains inside `startingLiquidBalance` and everything
  projected from it, and it keeps accumulating into what is upcoming. What never
  happens automatically is marking it DONE: that is always a button somebody
  presses (`completeCashflowEvent`, §18). Because the amount is already inside
  the figures while still being unresolved, the UI must SAY so — hence the
  "Chưa xử lý" block inside §12.2. Copy must never claim an overdue item was
  "tính vào hôm nay" / "counted today", which reads as settled.

## Two flexible-money figures — not interchangeable

| field | meaning |
|---|---|
| `flexibleMoneyToday` | §26B conservative form: free before the next sufficiently-certain inflow |
| `lowestProjectedBalance` | the horizon form: spendable without the balance ever going negative — **what what-if compares** |

Both may be negative.

There were three. `flexibleMoneyHorizon` and `flexibleMoneyEndOfHorizon` existed
only to subtract the protected reserve from `lowestProjectedBalance` and
`endingProjectedBalance`; with the reserve retired they were those two numbers
under a second name, so they were dropped from the API rather than kept as
aliases.

## Financial state (§26D)

Enum is `on_track | watch | tight | incomplete`. **This is a v3.1 rename** from
`good | attention | tight | insufficient_data`. `incomplete` means "not enough
data to judge" — never "bad", and it must not be styled as a problem.

`reasons` carries EVERY reason that fired, not just the winning one.

## Running balance per row

The API gives a per-DAY `closingBalance`. The `/upcoming` timeline shows a
trailing `→ balance` after each row, so the client walks a day's occurrences in
order and accumulates only those with `countedInBalance: true`
(`runningBalancesForDay`). Occurrences that are not counted still render — at
reduced opacity — so the user sees them without them moving the number.

## Where it lives in code

**frontend-web** (`src/features/forecast/`):
- `model/forecast.types.ts` — mirrored from the backend entity.
- `model/forecast-presentation.ts` — **product rules**: tone thresholds, the
  running-balance derivation, occurrence markers.
- `hooks/use-forecast.ts` — `useForecast` / `useFlexibleMoney` /
  `useFinancialState`, each horizon-scoped.
- `ui/upcoming-page.tsx` — the `/upcoming` screen.

**backend**: `src/modules/forecast/`.

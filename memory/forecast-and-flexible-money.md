# Forecast & flexible money

The calculation surface behind Clarity and Foresight (spec §26A–D). Related:
[[cashflow-events]], [[protected-reserves]], [[what-if]], [[goals]].

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
- **Red is only for an actual projected shortfall** (balance < 0). Below the
  protected reserve is orange. Encoded in `balanceTone`.
- **The backend never sends prose.** Assumptions and reasons are machine codes;
  the client renders every sentence.

## Three flexible-money figures — not interchangeable

| field | meaning |
|---|---|
| `flexibleMoneyToday` | §26B conservative form: free before the next sufficiently-certain inflow |
| `flexibleMoneyHorizon` | spendable without breaching the reserve at ANY point in the horizon — **what what-if compares** |
| `flexibleMoneyEndOfHorizon` | end-of-horizon variant; must be labelled with its assumption when shown |

All three may be negative.

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

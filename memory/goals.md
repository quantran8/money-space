# Financial goals

Shared savings goals with progress. Related: [[money-events]] (goal_contribution), [[assets]] (linkedAsset).

## Overview

CRUD over `FinancialGoal` (name, category, targetAmount, **targetDate**, priority, status). The goal form has **no** source-wallet field. Every response is a card including a derived **currentAmount** and a computed **progress %**.

## Rules

- **The money source is chosen PER CONTRIBUTION, not on the goal.** Creating a
  goal never asks for a source wallet. Instead the goals-list quick-add row has a
  required "Nguồn tiền" `<Select>` **per goal**, listing only cash / bank_account
  assets (`walletOptions` in `use-goals-page.ts`, same filter the asset-sale
  wallet picker uses). It defaults to the first wallet;
  `contributionSources[goalId]` holds the pick. Update is disabled until a wallet
  is chosen (and `addContribution` blocks + toasts if somehow empty).
- **Contributing debits the chosen wallet.** `addContribution` sends the
  `goal_contribution` money event with `fromAssetId = contributionSources[goalId]`;
  the backend requires it (400 otherwise) and debits that wallet, so the money
  leaves the spendable pocket. `direction` stays `neutral` — a move between the
  household's own pockets, NOT counted in the thu/chi summary. See [[money-events]].
- **currentAmount is derived, NOT stored** (backend PR3 removed the
  `current_amount` column). The backend computes it on read as the sum of the
  goal's `goal_contribution` money events. Create/update goal payloads must NOT
  send `currentAmount` — it is ignored. `GoalRecord` (response) still carries the
  derived `currentAmount`.
- **Contributing** raises progress by creating a `goal_contribution` money event
  (`amount` = positive delta, `category: 'saving'`, `financialGoalId` = goal id),
  NOT by PATCHing the goal. See `addContribution` in `use-goals-page.ts`; it
  invalidates the goals query afterward so the derived progress refetches.
  `deriveDirection` maps `goal_contribution` → `neutral`; the total is a plain
  `SUM(amount)`.
- **Progress** (`computeProgress` / `computeGoalProgress`): `round(min(100, current / target × 100))`; `0` if `target ≤ 0`.
- The goal form has **no `current` field** anymore (removed with the stored
  column); there is no `current ≤ target` invariant on the form.
- **Suggested pace** (`suggestedPace`): remaining amount spread over ~4 months, floored at 1,000,000 VND when short.
- **Priority ordering** (`priorityRank`): high = 0 < medium = 1 < low = 2 (used to sort/allocate).
- `targetDate` defaults to the sentinel string `"No deadline"` when absent — the
  client must treat that value as "no date", not render it.

## v3.1: `deadline` → `targetDate` (Phase 8)

The API field is **`targetDate`**, on both read and write. The old `deadline`
alias that `toGoalCard` emitted has been removed.

This was a real bug, not just a rename: the web client used to *send*
`deadline` in create/update payloads, but `CreateFinancialGoalDto` only ever
accepted `targetDate` — so goal dates the user typed were silently dropped.
Any client still sending `deadline` has that bug.

## Projection (§26C)

`GET /financial-goals?include=projection` (and the per-goal
`/projection` route) attach a `GoalProjection`. The web client always requests
it, since every v3.1 goal surface shows one.

**When `plannedMonthlyContribution` is undeclared** the projection comes back
with `reason: 'no_contribution'` and there is no honest projected date. The UI
must then show **progress only** — inventing a date from past behaviour would
be a guess presented as a fact. `hasProjectedDate()` in
`model/goal-projection.types.ts` is the single check for this.
- **Delete**: soft-delete + unlink from money events.

## Where it lives in code

- **frontend-web**: `src/features/goals/{model/goals.ts, model/goals.types.ts, model/goals-form.ts, api/goals.repository.ts, hooks/...}`.
- **backend**: `src/modules/goals/` (`goals.service.ts`, `entities/financial-goal.entity.ts`, `repositories/prisma-goals.repository.ts`).
- **mobile-app**: to be ported.

## Enums

- `GoalPriority = high | medium | low`
- `GoalStatus = active | paused | completed | cancelled`
- `GoalCategory = emergency_fund | home | home_repair | children | travel | debt_repayment | investment | education | other`

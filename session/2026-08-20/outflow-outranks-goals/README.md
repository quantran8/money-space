# Outflow outranks the goals sharing its wallet

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/outflow-outranks-goals/`
- **Status**: done

## What the task is

Home's "Bức tranh hôm nay" hero showed **−2,0 tr**. Money must never read
negative for this reason.

Reported repro: every cash/bank wallet contributes to a goal (flexible = 0), then
an outflow event is added against a wallet that backs a goal → the hero goes
negative. The correct behaviour, per the user: **the goal shrinks instead**.

Follow-up requirement from the same discussion: the goal being eroded **must be
visible to the user when creating the outflow**, not discovered later.

## Root cause

`financial-picture-section.tsx` computed
`flexible = lowestProjectedBalance − goalCommitments`, but the two terms were
measured at **different points in time**:

- `lowestProjectedBalance` — the future low point; the timeline walk had already
  subtracted the outflow.
- `goalCommitments` — the goals' claim **today**, resolved against
  `forecast.liquidSources`, i.e. wallet values the outflow had *not* been taken
  out of.

So every outflow was charged **twice**. 81tr liquid, all behind goals, one 2tr
bill → `79 − 81 = −2tr`. `home-derivations.ts` had the same subtraction but a
`Math.max(…, 0)` floor, which hid it (bar read 100%/0%) while the hero exposed it.

Structural reason it was possible: `CashflowEvent.settlementAssetId` existed in
Prisma but was **never carried into the forecast domain**, so the forecast could
only subtract at the *total* level while goals claim per *wallet*.

## The rule implemented

An outflow **outranks** the goals sharing its wallet — a bill is an obligation, a
goal is a promise, and a promise yields. When an outflow settles from a wallet a
goal is saving into, the goal is counted as holding less. Order:

1. **this month's contribution** (the part of the pace that fit in free room), then
2. **what was already set aside**.

Worked example — TCB 22tr, 20tr set aside behind `car`, pace 20tr/month (only 2tr
fits this month):

| outflow | contribution | set aside | goal claim | flexible |
|---------|--------------|-----------|------------|----------|
| 0       | 2tr          | 20tr      | 22tr       | 0        |
| 2tr     | 0            | 20tr      | 20tr       | 0        |
| 5tr     | 0            | 17tr      | 17tr       | 0        |

**Lowering the wallet value IS the implementation** — no separate draining
routine. Both halves of `resolveGoalCommittedAmount` already read the wallet's
value (the pace is capped by free room; `allocationValue` caps a fixed claim at
the wallet's value), so the ordering falls out of the existing code. Verified by
test before writing any of it.

## Changes made

### Backend (`money-space-backend`)

- `src/modules/forecast/domain/forecast.types.ts` — `settlementAssetId` added to
  `ForecastCashflowEvent` and `ForecastOccurrence`.
- `src/modules/forecast/repositories/prisma-forecast.repository.ts` +
  `domain/forecast.ts` — carry it from the row through to the occurrence.
- `src/modules/forecast/domain/wallet-values-after-outflows.ts` — **new**. Wallet
  values with the horizon's counted outflows removed. Incoming ignored (money not
  yet arrived backs no goal); non-counted outflows ignored (so this map and the
  forecast's balances agree); floored at 0.
- `src/modules/forecast/forecast.service.ts` — `goalCommitments()` now resolves
  against that map instead of raw `liquidSources`. Fixes the hero for
  `flexibleMoney`, `financialState` and `forecastBundle` at once.
- `src/modules/goals/domain/spend-impact.ts` — **new**. `resolveSpendImpact`:
  before/after of `resolveGoalCommittedAmount` around one lowered wallet value,
  per goal, biggest loser first. Deliberately *not* a second implementation of
  the ordering rule, so the warning can never disagree with what saving does.
- `src/modules/goals/goals.service.ts` — `spendImpact()`, resolving goal names.
- `src/modules/goals/asset-goal-usage.controller.ts` —
  `GET .../assets/:assetId/spend-impact?amount=`.
- `src/modules/cashflow-events/cashflow-events.service.ts` — `assertValid` now
  **requires `settlementAssetId` for outgoing** (incoming stays optional).
- Tests: `wallet-values-after-outflows.spec.ts` (11), `spend-impact.spec.ts` (7),
  2 service-level regressions, cashflow validation tests updated/extended.
  **438/438 pass.**
- `memory/forecast-and-flexible-money.md`, `memory/cashflow-events.md` updated.

### Frontend (`money-space-frontend`)

- `src/features/goals/api/goals.repository.ts` — `getSpendImpact` + types.
- `src/shared/api/query-keys.ts` — `spendImpact` key (amount is part of the key).
- `src/features/goals/hooks/use-spend-impact.ts` — **new**, debounced 300ms.
- `src/features/cashflow/ui/components/goal-impact-notice.tsx` — **new**. States
  the consequence, names each goal `before → after`, never recommends.
- `src/features/cashflow/model/cashflow-form.ts` — `superRefine` requires a
  wallet for outgoing.
- `src/features/cashflow/ui/components/cashflow-event-form-dialog.tsx` — wires the
  notice, the field error, and a "no wallet exists" message so an outflow can't
  hit a silently-refusing submit button.
- `src/i18n/resources.ts` — `walletHintOut`, `walletRequired`, `goalImpact.*` in
  **vi + en**. Copy check passes.
- Comments in `financial-picture-section.tsx` / `home-derivations.ts` corrected —
  they described the old (wrong) reasoning.

## Follow-up in the same session

Testing the form surfaced three more things:

1. **The notice never appeared** — the wallet field (and the notice under it)
   lived inside the "Thêm chi tiết" disclosure, collapsed by default. Worse, the
   wallet is now *required* for an outflow, so the submit button was reporting an
   error about a field the household could not see. Both moved out into the
   always-visible part of the form. Incoming keeps its wallet in the disclosure —
   it stays optional there.

2. **Moved the calculation to the client.** The notice now computes the figures
   locally (`features/goals/model/spend-impact.ts`) instead of calling the
   endpoint. A round trip either lands after the household has already clicked
   save, or shows the previous amount's figure while in flight — and a stale
   money figure is worse than none. Nothing gates the submit button at any point;
   the required-wallet rule is pure client-side zod, so it never waits on the
   network either. The server endpoint stays as the figure of record and for the
   mobile client.

3. **Found a real bug in the backend while verifying that port.** Cross-checking
   the two implementations over 20 scenarios (percent claims, share splits,
   priority ordering, holding roles) showed **8 mismatches** — and the *backend*
   was the wrong one. `resolveSpendImpact` resolved goals one at a time
   (`[claim]`), so each measured its free room as if alone on the wallet: two
   goals on a 20tr wallet reported holding 15tr and 13tr, i.e. 28tr of money that
   does not exist. Fixed with `resolveGoalCommittedAmountByGoal`, which resolves
   the group together so priority and the declared shares actually apply. After
   the fix: **20/20 scenarios match.** Two regression tests added.

   This is the risk of duplicating the rule, and it argues for keeping the
   cross-check: **both implementations must change together.**

4. **The notice had to explain its own cause.** Shown on real data it read:
   "Mục tiêu sẽ giảm 3,0 triệu · car 36,0 → 34,5 · nhà 16,0 → 14,5" — true, but
   with the obvious objection unanswered: *the wallet clearly has money, why is a
   goal paying?* Because a balance is not free money. The notice now leads with
   the wallet's balance and how much of it is genuinely unassigned
   (`freeAmount`), with a distinct sentence for the fully-promised case
   (`freeAmount === 0`), which is the one that looks wrong until it is said.

5. **The wallet picker shows balances.** Choosing which wallet carries a spend
   cannot be done from names alone.

6. **Found a second, older bug via the notice.** On real data the asset page
   showed "32tr chưa dành cho mục tiêu nào" for a 52tr wallet whose whole balance
   the dashboard counted as committed — and the notice inherited it. Cause:
   `assetGoalUsage.freeAmount` subtracts only money SET ASIDE, ignoring the
   monthly paces. That is correct for the question it was written for (what a new
   allocation may take — a pace locks nothing away), but wrong for "how much has
   no job yet".

   Fixed by adding `committedAmount` / `unassignedAmount` (and per-goal
   `countedValue`) from the same resolver Home uses, rather than changing
   `freeAmount` — the write path still needs it as it is. The asset page's bar,
   its "đang tính" column, and the notice all moved to the new figures. This bug
   predates this task; the notice merely put the contradiction on one screen.

7. **The notice now distinguishes pace from set-aside.** It reported only a
   total ("mục tiêu sẽ giảm 4,0 triệu"), which cannot say whether a month of
   saving was paused or the goal moved backwards — not equally serious, and the
   household would have to open the goal to find out. Both sides now carry
   `paceReduction` / `setAsideReduction` per goal plus totals, split inside the
   existing resolver (`resolveGoalCommittedPartsByGoal`) rather than recomputed.
   A spend that fits inside this month's contribution reads as pace-only.

8. **Rewrote the notice: shorter, and no misleading pairs.** Two problems with
   what shipped in (7): the per-goal `36,0 triệu → 34,0 triệu` rows read as money
   being withdrawn from the goal — the same pair appeared whether the monthly
   contribution or set-aside money had moved, i.e. it contradicted the split line
   directly above it. And at 7 lines it was long enough to skim past, sitting
   between an amount field and a save button.

   Now: a headline carrying the decision, a `SpendImpactBar`, and one cause line
   — per-goal lines only when more than one goal is affected, each naming the
   part that shrank rather than a before/after pair. The "you can still record
   this" reassurance was dropped: nothing here blocks anything, so saying so
   invited the doubt it answered.

9. **Added a visual.** `SpendImpactBar` shows the wallet with the spend marked
   off — four slices in the order money gives way (pace, set aside in the alert
   colour, goal remainder, unassigned). It carries the proportion, which text
   cannot: 4tr out of 52tr and 4tr out of 5tr read identically as words. Coloured
   dots on the per-goal lines tie them to their slice, so the bar needs no legend
   (a legend would cost more lines than the bar saves).

10. **What-if brought up to the same rule, and made more detailed.** It had two
    bugs of its own: both sides called `computeFlexibleMoney` with **no goal
    commitments**, so it reported flexible money that ignored every goal (a
    larger figure than Home, from the screen whose job is being trusted); and it
    relied on a manual `takeFromGoal` flag for a single hand-picked goal.

    Now: the spend is spread across wallets by `spreadAcrossWallets` — **free
    money in every wallet first, then goal money by the household's own ranking
    (`low` → `medium` → `high`), amount breaking ties inside a rank** — one
    wallet drained before the next (no wallet picker: what-if is a
    household-level question). Priority deliberately outranks amount: 1tr behind
    a `high` goal is not more expendable than 50tr behind a `low` one. `goalImpact` reports every affected goal with money, the
    pace/set-aside split, and **how much later it lands**
    (`projectGoalDelayFromSpend`). `newlyAtRisk` names the bills that stop being
    payable with dates and shortfalls, diffed against before so a spend is never
    blamed for a problem that already existed. `uncovered` reports what no wallet
    could cover.

11. **Percent allocations were being re-derived on every spend.** Reported from
    real data: a 52tr wallet with 6tr unassigned, a 5tr outflow, and the notice
    said "mục tiêu giảm 2,5 triệu". The spend fits inside the unassigned money —
    nothing should have moved.

    Cause: a `percent` claim ("25% of this wallet") was re-read against the
    LOWERED wallet value, so both goals shrank proportionally regardless of the
    free money sitting there. That contradicts the core rule — an outflow takes
    unassigned money first. Fixed with a `percentBasis` threaded through
    `allocationValue`, `resolveGoalCommittedAmount(/…ByGoal/…PartsByGoal)`,
    `resolveWalletShareByGoal` and `sumAllocatedAgainstAsset`: the basis stays
    the unspent wallet, while the claim is still capped at what the wallet holds
    afterwards so an unaffordable spend does still cost the goals.

    All of them had to take it — free room is `value − set aside`, and measuring
    the halves against different bases makes them stop adding up. The parity
    cross-check caught exactly that: after fixing only the set-aside path, one of
    the 20 scenarios still disagreed.

## Key decisions

- **Outgoing must name a settlement wallet.** It used to be optional on both
  directions ("at planning time the household often does not know yet"). That
  does not survive the ranking: an outflow with no wallet would either drain no
  goal (understating its cost) or force a guess. Asking is also what makes the
  impact showable before saving. **Incoming stays optional** — money that has not
  arrived backs no goal.
- **The negative was arithmetic, not a signal.** "Never clamp flexible money to
  zero" still holds; a genuine over-commitment still shows negative. What was
  removed is double-counting, not the signal.
- **The warning reuses the calculation, never re-implements it.** A warning that
  can disagree with the write path is worse than none.
- **Not a block.** The household may well go ahead — a bill is a bill. The notice
  states a consequence, per the Voice rule (never say someone should/shouldn't
  spend).

## Verification

- Backend `npx jest`: **464/464 pass** (was 427 before), including regression
  tests for the group-resolution bug and for the pace-not-counted-as-committed
  bug (52tr wallet, two 20tr/month goals → `unassignedAmount` 0, not 32tr).
- **Frontend/backend parity cross-check**: 20 scenarios (percent, share splits,
  priority ordering, holding roles, over-spend) — all match. This repo has no
  test runner, so the check was run ad hoc; the worked examples live in the
  backend's `spend-impact.spec.ts` and in doc comments on the frontend copy.
- Frontend `npm run build`: passes. `npm run lint`: 13 problems, **all
  pre-existing** in files this task did not touch (`use-events-page.ts`,
  `router.tsx`, `data-table.tsx`, `motion.tsx`, assets hooks).
- Copy check: passes.
- **Not verified against a running app / real data** — no manual QA of the repro
  in the browser was done.

## Mobile app parity notes

- Port the rule itself: goal money must be measured against wallet values with
  outflows already removed. The double-subtraction is easy to reintroduce because
  both figures look like they are "current".
- Port the required-wallet validation for outgoing, and the spend-impact call in
  the outflow form.
- `GET .../assets/:assetId/spend-impact?amount=` is shared; only the presentation
  is web-specific.

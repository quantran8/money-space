# Running month's pace is now net of scheduled outflows

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/pace-net-of-scheduled-outflows/`
- **Status**: done

## What the task is

After creating a 2tr outflow against the `tcb` wallet, the goal's "Nhịp góp"
panel still read **"Đã góp 2,9 triệu"** — unchanged. The household had told the
app the money was leaving; the panel carried on as though it were still there.

Two things were wrong:

1. The figure was measured against **today's untouched balances**. A scheduled
   outflow is a decision already made, so the money behind it was never really
   available to the goal.
2. It was labelled **"Đã góp"** (past tense) for a month that has not ended.

## Changes made

### backend

- `src/modules/goals/domain/wallet-values-after-pending.ts` — **new**. Lowers
  wallet values by live outgoing cashflow events due within the month. Mirrors
  the existing `walletValuesAfterOutflows` (forecast) deliberately: the ordering
  the product wants falls out of a smaller wallet value, so no separate draining
  logic and no second place for the rules to drift.
- `src/modules/goals/domain/wallet-values-after-pending.spec.ts` — **new**, 15 cases.
- `src/common/utils/clock.ts` — added `endOfMonthIso` (+ 5 spec cases).
- `src/modules/goals/goals.service.ts` — `monthlyProgress` now reads cashflow
  events and measures the running month against the lowered values. Percent
  claims keep the ORIGINAL value as their basis.
- `src/modules/goals/goals.module.ts` — bound `CASHFLOW_EVENTS_REPOSITORY`.

### frontend-web

- `src/features/goals/ui/components/goal-monthly-progress-section.tsx` — the
  running-month card now reads `goals.monthly.projected`. Closed months below
  are untouched and still say "Đã góp".
- `src/i18n/resources.ts` — added `goals.monthly.projected` ("Dự kiến góp" /
  "Projected") in both locales; updated `monthProgressAria` to match.

### memory (both repos)

- `memory/goals.md` — new subsection "The running month is measured AFTER
  scheduled outflows"; corrected the headroom formula's `walletValue`.
- `memory/cashflow-events.md` — cross-reference to [[goals]].

## Key decisions

- **Repository injected, not `CashflowEventsService`.** Only a plain read is
  needed, and the service drags in MoneyEvents (which imports Goals) — a cycle.
  Cashflow knows nothing about goals, so the repository edge is one-way. Same
  pattern already used for `SNAPSHOTS_REPOSITORY` in this module.
- **Bounded to end-of-month.** A bill due in three months has taken nothing from
  THIS month's saving.
- **Live statuses only.** `completed` already moved the balance (counting it
  would charge it twice); `cancelled`/`postponed` must not move it at all.
- **Incoming never credited** — matches the forecast. Money that has not arrived
  cannot already be behind a goal.
- **Percent basis stays the pre-outflow value**, per `allocationValue`'s existing
  reasoning: otherwise every goal is shaved even when the bill fits inside
  unassigned money.
- **Only the running month is relabelled.** Closed months are settled
  observations and correctly keep "Đã góp".

## Verification

- Backend: `npx jest` — **484 passed, 34 suites**. Typecheck clean (non-spec).
- DI graph: compiled `AppModule` in a throwaway e2e test and resolved
  `GoalsService` — confirms the new injection has no cycle. (Test removed after.)
- Web: `npm run build` passes; `check-copy` passes.
- Pre-existing eslint problems in `router.tsx`, `data-table.tsx`, `motion.tsx`,
  `assets/*`, `events/*` are untouched and unrelated.

## Mobile app parity notes

- Port the label split: running month = "Dự kiến góp", closed months = "Đã góp".
- The calculation is entirely backend-side, so mobile gets the corrected figure
  from `GET /financial-goals/:goalId/monthly-progress` with no client work.

## Known follow-up (NOT done here)

`SpendImpactBar` in the create-outflow form still draws the spend slice against
the whole wallet while the headline talks about this month's contribution — 2tr
renders as ~7% of 28,8tr when the meaning is "69% of this month's room". Raised
with the user; awaiting a decision between rescaling the bar and reworking its
slices. See the previous session's notes.

# Scheduled outflow impact: one section, not a note per figure

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/scheduled-outflow-impact-section/`
- **Status**: done
- **Supersedes**: `session/2026-08-20/pace-net-of-scheduled-outflows/`

## What the task is

Started from "phần góp hàng tháng đã trừ upcoming event nhưng phần đã góp từ tài
sản lại chưa trừ". Two rounds of user direction reshaped it:

1. **Concept** — a scheduled event that has not happened must NOT be subtracted
   from pace/aside; the UI should instead show what they become afterwards.
   (This reverted the previous session, which subtracted straight from the figure.)
2. **Layout** — gather everything an upcoming event affects into ONE section
   rather than explaining it per component, which fragments the information.

User decisions: window = end of current month; show only what actually changes;
leave the long-range chart and finish date on the declared pace.

## Changes made

### backend

- `goals.service.ts`
  - **new** `scheduledOutflowImpact(householdId, goalId)` — assembles the whole
    picture: the events (name, date, wallet), the outflow total, and
    current→projected for both the goal total and this month's pace. Returns
    `null` when nothing is scheduled against this goal's wallets.
  - `monthlyProgress` and `listAllocations` reverted to plain ACTUAL figures.
  - `toAllocationCard` reverted (no per-card projection).
- `goals.controller.ts` — `GET :goalId/scheduled-outflow-impact`.
- `domain/goal-progress.ts` — `resolveGoalProgressAmount` gained an optional
  `percentBasis` (needed to project without shaving percent claims).
- `domain/wallet-values-after-pending.ts` — doc rewritten to the beside-not-
  instead-of rule; `pendingOutflowTotal` removed (the section computes its own).

### frontend-web

- **new** `ui/components/goal-scheduled-outflows-section.tsx` — the single
  section, placed directly under the hero.
- **new** `hooks/use-scheduled-outflow-impact.ts`, query key
  `goalScheduledOutflowImpact`.
- `goal-detail-page.tsx` — fetches and renders it.
- `goal-monthly-progress-section.tsx`, `goal-allocations-section.tsx` — the
  scattered projection lines added earlier were removed again.
- `goal-allocations-section.tsx` — **restored the `TotalRow`** that was missing
  in the working tree (it was breaking `tsc` with two unused-symbol errors).
- `goals.repository.ts` — `ScheduledOutflowImpact` type; per-field projection
  types removed.
- `i18n/resources.ts` — `goals.scheduledOutflows.*` in `vi` + `en`; the
  short-lived `afterOutflows` / `projected` keys removed.

### memory (both repos)

- `memory/goals.md` — section rewritten to the final design, including why the
  forecast hero legitimately does the opposite and must not be "fixed" to match.

## Key decisions

- **Actual everywhere; projected in one place.** Nothing on the screen is
  silently adjusted for a bill that has not been paid.
- **Only changed parts render.** Verified with the real household: pace line
  shows (2,88 → 0,88tr), total line suppressed (205,02tr unchanged) because the
  percent basis is pinned to the untouched wallet.
- **Chart/finish date stay on the declared pace** — a one-month squeeze must not
  become a multi-year pessimistic forecast.
- **Events are named in the section.** This is what a per-figure note could not
  carry, and it is what lets the household go change the spend.

## Verification

- Backend: `npx jest` **485 passed / 34 suites**; typecheck clean.
- Web: `npm run build` passes; typecheck **fully clean** (including the two
  pre-existing errors, now fixed); copy check passes.

## Mobile app parity notes

- Calculation is entirely backend-side — mobile calls the one endpoint and
  renders the section; do not recompute client-side.
- Render rule: skip the whole section on `null`; within it, draw a row only when
  its before/after differ.

## Still open (raised, not actioned)

- `SpendImpactBar` scale — bar measures the spend against the whole wallet while
  the headline talks about this month's contribution.
- Dashboard hero bar mixes time bases: `totalLiquid` uses today's balance while
  `flexible` uses `lowestProjectedBalance`.

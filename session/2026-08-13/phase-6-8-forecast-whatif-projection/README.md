# Phases 6–8 — forecast / `/upcoming`, reserves + what-if, goal projection

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/phase-6-8-forecast-whatif-projection/`
- **Status**: done

## What the task is

v3.1 Phases 6, 7 and 8 from `session/2026-08-13/v31-remaining-phases/README.md`.
Together these make the product's thesis visible for the first time: Clarity
(§26 forecast) → Foresight (`/upcoming`) → Decision (what-if).

## Phase 6 — forecast slice + `/upcoming`

- `src/features/forecast/model/forecast.types.ts` — mirrors the backend's
  `forecast.types.ts`: occurrences, days, totals, assumptions, financial state,
  flexible money.
- `api/forecast.repository.ts` — `/forecast`, `/flexible-money`,
  `/financial-state`, each horizon-scoped.
- `hooks/use-forecast.ts` — three query hooks; `hooks/use-upcoming-page.ts` for
  page state.
- `model/forecast-presentation.ts` — the tone rules and the per-row running
  balance derivation, kept out of components so they are auditable in one place.
- `ui/upcoming-page.tsx` + `ui/components/{summary-strip,forecast-timeline,assumptions-note}.tsx`.
- Route `/upcoming`, nav entry (temporarily an 8th item; 5+3 lands in Phase 10),
  `upcoming.*` i18n in both languages.

## Phase 7 — reserves + what-if

- `src/features/reserves/` — types, repository, `use-reserves` (exposes
  `activeReserveTotal`, since only `active` reserves constrain the forecast).
- `src/features/whatif/` — types, repository, `use-whatif`, the sheet, the five
  result blocks, and the clipboard share summary.
- `WhatIfSheet` mounted **once** in `AppShell`, driven by the Phase 0 zustand
  store. No `/what-if` route. `WhatIfTrigger` on `/upcoming`, `/goals`,
  `/goals/:id`; `WhatIfFab` on mobile.

## Phase 8 — goal projection

- `src/features/goals/model/goal-projection.types.ts` + `hasProjectedDate`.
- `ui/components/goal-projection-panel.tsx` — **progress only** when
  `plannedMonthlyContribution` is undeclared.
- `primary-goal-card.tsx` tiles extended to Target date · Theo tốc độ hiện tại ·
  Cần thêm ~X/tháng.
- Deleted `allocation-card.tsx`, `this-month-card.tsx`,
  `recent-updates-card.tsx` (client-only fake state, zero consumers).

## Key decisions

- **`deadline` → `targetDate` was a real bug, not just a rename.** The frontend
  was *writing* `deadline` in create/update payloads, but the backend's
  `CreateFinancialGoalDto` only accepts `targetDate` — so every goal date the
  user typed was being silently dropped. Migrating the read path and the write
  path fixed it. The backend's transitional alias in `toGoalCard` is now
  removed; all 248 backend tests still pass.
- **`listGoals` always requests `?include=projection`.** Every v3.1 goal
  surface shows a projection, so making it opt-in would just mean two requests.
- **Red is reserved for an actual projected shortfall** (`balance < 0`). Orange
  means "below the protected reserve". Encoded once in `balanceTone` rather than
  re-decided per component — escalating orange to red would turn a heads-up into
  an alarm.
- **The per-row running balance is derived client-side.** The backend gives a
  per-DAY closing balance; the trailing `→ balance` column needs a per-ROW
  figure, so `runningBalancesForDay` walks the day's counted occurrences in
  order. Non-counted occurrences still render (at reduced opacity) but do not
  move the number.
- **The what-if sheet resets via a React `key`, not an effect.** A
  state-syncing `useEffect` tripped the repo's `react-hooks/set-state-in-effect`
  rule (which is one of the 6 pre-existing errors elsewhere). Splitting into an
  outer `WhatIfSheet` that keys an inner `WhatIfSheetForm` on the prefill gives
  the same "fresh form per question" behaviour with no effect at all.
- **Three flexible-money figures, not one.** `flexibleMoneyToday`,
  `flexibleMoneyHorizon` and `flexibleMoneyEndOfHorizon` are distinct and not
  interchangeable; what-if compares `flexibleMoneyHorizon`. My first draft of
  the type collapsed them into a single `flexibleAmount`, which would have shown
  the wrong number — corrected against the backend source.
- **Several backend unions differed from the obvious guess** and were checked
  rather than assumed: `FinancialStateResult` carries only
  `{state, reasons, horizonDays, assumptions}`; recurrence is `once` (not
  `none`); `VisibilityLevel` has `detail` (not `shared`).

## Gate

- `npm run build` — **clean** at every phase boundary.
- `node scripts/check-copy.mjs` — **passes**.
- `npx eslint .` — **6 errors, 8 warnings**, identical to the pre-existing
  baseline. One error I briefly introduced (the what-if effect) was removed.
- Backend `npx jest` — **248 passed / 20 suites**, after removing the
  `deadline` alias.
- i18n: every new key verified to resolve in **both** `vi` and `en` via a
  runtime lookup, not just structurally.

**Not proven:** live rendering. The v3.1 migrations are still unapplied, so no
screen has been exercised against real data. Everything here is typecheck +
module-transform verified only.

**Pre-existing, not introduced:** the backend needs `npx prisma generate` for a
clean `nest build`, and `@nestjs/config` is absent from `node_modules` (1
remaining build error). Neither is related to this work.

## Mobile app parity notes

- Port `features/forecast/`, `features/reserves/`, `features/whatif/` and
  `goal-projection.types.ts` — the types, repositories and hooks are
  platform-agnostic.
- **`forecast-presentation.ts` carries product rules, not styling** — the
  never-clamp rule, the red-only-for-shortfall rule and the running-balance
  derivation must be ported as logic even though the Tailwind classes must not.
- What-if on mobile must also be a **contextual sheet, not a tab**, and must not
  offer a save action. The result-block order is mandated: Upcoming Safety →
  Reserve impact → Flexible before/after → Goal consequence → Assumptions.
- **`deadline` is gone.** Mobile must send and read `targetDate`; if it
  currently sends `deadline` it has the same silent data-loss bug fixed here.
- Goal surfaces must show **progress only** when there is no declared monthly
  contribution — never invent a projected date.

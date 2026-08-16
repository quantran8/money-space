# Remove the protected reserve concept

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/remove-protected-reserves/`
- **Status**: done (one follow-up named below)

## What the task is

The question that started it was about the `protect` segment on Home's money
composition bar — where that number comes from, and whether the app even has the
concept. It does: `protected_reserves`, a floor on the forecast, with
`flexibleMoney = <liquid figure> − Σ active reserves`.

The decision was to remove it entirely, across both repos.

## Why this was mostly deletion

The concept was never wired up:

- **One live write path**: step 5 of onboarding (`ReserveStep`). Type a number
  once, at setup.
- **No edit path at all.** `household-reserve-card.tsx` — the component that
  sets, changes and validates the reserve — was **not imported anywhere**.
  `household-page.tsx` mounts Overview / Categories / Data / Members and its own
  docstring still said "beside the reserve card", so the card had been pulled out
  and left behind. `PATCH` and `DELETE` on `/protected-reserves` had no caller.
- **Nobody could fix a mistake.** A household that typed the wrong figure was
  stuck with it permanently, while it kept subtracting from the single number
  Home leads with.
- The three `protected_reserve.*` audit actions were **never threaded to a write
  site** (backend `memory/activity-log.md` already said so).
- The table carried **both** `deleted_at` and an `archived` status — two
  disappearance mechanisms on one row, which the backend CLAUDE.md forbids.
- The backend module was a leaf: nothing imported it. The forecast read the rows
  through its own bundle query.

Same shape of task as `session/2026-08-15/remove-privacy-model/`.

## Changes made

### Backend (`money-space-backend`)

- `feat(db)!: retire protected reserves`
  - `src/modules/protected-reserves/` — deleted (8 files, no specs of its own);
    3 lines removed from `money-space.module.ts`.
  - `forecast/domain/forecast.types.ts` — dropped `ForecastProtectedReserve`, the
    `reserve_applied` / `no_reserve_declared` assumption codes, and
    `protectedReserveAmount` / `reserveProtected` from `ForecastResult`.
    `obligationsCovered` **stays** — it never depended on the reserve.
  - `forecast/domain/forecast.ts` — removed step 10 and its two assumption
    branches; steps renumbered.
  - `forecast/domain/flexible-money.ts` — the three subtractions are gone, and so
    are `flexibleMoneyHorizon` / `flexibleMoneyEndOfHorizon` (see decisions).
  - `forecast/domain/financial-state.ts` — three reasons and two thresholds
    removed; `tight` now has 2 triggers, `watch` 4.
  - `forecast/domain/what-if.ts` — `WhatIfResultType` down to
    `not_covered | tight | comfortable`.
  - `forecast/repositories/prisma-forecast.repository.ts` — the reserve query is
    gone from the parallel fan-out, so every forecast read is **one DB
    round-trip lighter**.
  - `attention/` — `reserve_at_risk` rule, its threshold and its dismissal
    allowlist entry.
  - `snapshots/` — `protectedReserveAmount` removed from the entity, the create
    input, both repository paths and `snapshot-financial-state.ts` (which lost
    two reasons and no longer needs `FINANCIAL_STATE_THRESHOLDS` at all).
  - `common/audit/audit.types.ts` — 3 actions, 1 entity type, 1 impact metric.
    Type-only: `audit_logs.action` is TEXT, not an enum.
  - `prisma/schema.prisma` — model, `ReserveStatus` enum, 3 relation fields, and
    `Snapshot.protectedReserveAmount`.
  - `prisma/migrations/20260816130000_drop_protected_reserves/` — drops the table
    and the enum, deletes orphaned `reserve_at_risk` attention tombstones, and
    rebuilds the composite `snapshots_foresight_nonneg` CHECK around the dropped
    column.
  - 8 spec files updated; 7 test cases removed as unreachable.
- `docs(memory)` — deleted `memory/protected-reserves.md`; rewrote `README.md`,
  `forecast-and-flexible-money.md`, `snapshots-and-networth.md`,
  `attention-items.md`, `activity-log.md`, `members-and-lifecycle-safeguard.md`.

### Frontend (`money-space`)

- `refactor(reserves)!: remove the protected reserve concept`
  - `src/features/reserves/` and
    `src/features/household/ui/components/household-reserve-card.tsx` — deleted.
    `queryKeys.reserves` removed.
  - `src/features/onboarding/` — `ReserveStep` gone; wizard is **9 screens**.
  - `src/shared/stores/household-store.ts` — `'reserve'` out of
    `OnboardingStep` / `ONBOARDING_STEPS`, plus `version: 1` + `migrate`
    (see decisions).
  - `src/features/onboarding/hooks/use-onboarding-wizard.ts` — defensive guard
    for any unrecognized persisted step.
  - `src/features/dashboard/model/home-derivations.ts` +
    `src/components/ui/money-composition-bar.tsx` — bar is **two segments**;
    the whole `unset` mechanism went with the protect segment (only it used it).
  - `src/features/dashboard/ui/components/financial-picture-section.tsx` — the
    aria label indexes segments **positionally**, so it changed in lockstep.
  - `src/features/forecast/model/forecast-presentation.ts` — `balanceTone` is
    binary and takes one argument.
  - `upcoming-page.tsx` / `forecast-timeline.tsx` / `summary-strip.tsx` — the
    `protectedReserveAmount` prop drilled 4 levels deep is gone.
  - `src/features/whatif/` — result blocks 5 → 3 (see decisions); `'watch'`
    removed from `WhatIfResultType` and `RESULT_TYPE_CLASS`.
  - `src/features/events/` — `buildEventEffect` lost `reserveAmount`; the
    safe/breach sentence variants are gone.
  - `src/features/activity/model/activity.types.ts` — unions narrowed, **copy
    kept** (see decisions).
  - `src/i18n/resources.ts` — reserve copy removed and reworded in `vi` **and**
    `en`. Untouched on purpose: `assets.*.reserve`, `goals.*.reserve`,
    `dashboard.sections.money.reserve*` — those are "Tiết kiệm"/"Savings", the
    asset liquidity bucket, an unrelated concept.
- `docs(spec)` — `family-finance-v3.1/`: `Backend-Tables` (§19C replaced with a
  removal note, §26A/B, snapshot columns, relationships, indexes, migration
  checklist), `design.md` (§5.4, §12.1, §12.2, §12.6, §14.4, §16.3, wireframes),
  `03-product-architecture.md` (§Protected Reserve replaced with why it was
  removed and what replaces it), `05-calculation-data-model.md`,
  `04-mvp-features-flows.md`, `08-brand-copy-wireframes.md`, `00-overview.md`.
  `01-icp-positioning.md` was **left alone deliberately**: its three mentions
  describe the household's real life, not the product, and listing "Quỹ dự phòng"
  as an example goal is now more accurate than before.
- `docs(memory)` — deleted `memory/protected-reserves.md`; rewrote `README.md`,
  `forecast-and-flexible-money.md`, `what-if.md`, `assets.md`,
  `households-and-onboarding.md`, `dashboard.md`.

## Key decisions

1. **Duplicate API fields were collapsed, not kept as aliases.** With the reserve
   at zero, `flexibleMoneyHorizon` **is** `lowestProjectedBalance` and
   `flexibleMoneyEndOfHorizon` **is** `endingProjectedBalance`. Both were dropped
   from the API. One figure under two names invites a client to treat them as two
   different things. Every caller now reads the forecast balance directly.

2. **What-if lost `'watch'`.** Its condition — low point positive but under the
   reserve — was already swallowed by the `'tight'` branch above it, so it became
   unreachable. Reviving it would mean inventing a threshold the household never
   stated, which is a new business rule, not a removal.

3. **What-if went 5 blocks → 3.** "Reserve impact" had nothing left to report;
   "Flexible before/after" was showing the same two numbers as block 1 under a
   different label. What survived — the delta sentence and the "obligations not
   covered" line, which was **nested inside** the reserve block — moved up into
   block 1 rather than being deleted with its container.

4. **The amber warning tier is gone, and that is a real loss.** `balanceTone` was
   `shortfall | near-reserve | normal`; it is now binary. The forecast timeline
   and Home no longer have any intermediate signal between "fine" and "negative".
   Restoring one needs a threshold the household gave us — out of scope here, and
   recorded so it is not mistaken for an oversight.

5. **The persisted onboarding step is versioned now.** The store had no
   `version`/`migrate`, and the TS union is compile-time only, so a household left
   mid-setup on `'reserve'` would have rehydrated onto `indexOf === -1`: empty
   wizard body, "Bước 0 / 9", dead Back, Next restarting at step 1, and
   `RequireHousehold` refusing to let them leave onboarding. `version: 1` +
   `migrate` moves them to `'recurring_income'`, keeping their progress; the
   wizard hook also falls back to `'household'` for anything else it doesn't
   recognize. **Any future change to `ONBOARDING_STEPS` must bump the version.**

6. **Activity journal copy was kept while the types were narrowed.**
   `activity-copy.ts` looks the key up dynamically and old `audit_logs` rows still
   carry `protected_reserve.*` strings — deleting the copy would render a raw key
   in somebody's history.

7. **Past snapshots reclassify.** `snapshots.protected_reserve_amount` was
   dropped rather than kept as frozen history, so a snapshot that read `tight` or
   `watch` because of a reserve now reads `on_track`. Chosen deliberately over
   keeping a column that freezes history about a concept the product no longer
   has.

8. **`--protect` the CSS token survives.** Two non-reserve consumers remain
   (`shared/constants/colors.ts`, `money-sources-section.tsx`) — it is the asset
   liquidity bucket colour. Only the composition bar's use of it went.

## Verification

- Backend: `pnpm build` clean; `pnpm test` **281/281 pass, 24 suites** (down from
  288 — 7 reserve tests removed).
- Frontend: `npm run build` (tsc -b + vite) clean; `npm run lint` copy check
  passes. The 14 remaining eslint problems are pre-existing and in files this task
  did not touch (`router.tsx`, `data-table.tsx`, `motion.tsx`, assets and events
  hooks) — the clean-tree backend baseline was likewise already failing lint
  (392 problems before, 332 after).

## Follow-up

**The migration has not been applied.** `20260816130000_drop_protected_reserves`
is written but `prisma migrate status` still lists it as pending; applying it
drops a real table on the shared Supabase instance, so it was left for a
deliberate run. Until then `prisma migrate diff` will report drift, and the
running backend will error on snapshot reads (the Prisma client no longer selects
a column the DB still has).

## Mobile app parity notes

Port all of it — this is a domain removal, not a web presentation change:

- Delete the reserves slice and any reserve screen/step.
- Onboarding drops to 9 steps; **the mobile store needs the same persisted-step
  migration**, and mobile persistence usually survives longer than a browser's
  localStorage, so this matters more there.
- Money composition is 2 segments; drop the `unset` handling with it.
- `flexibleMoneyHorizon` / `flexibleMoneyEndOfHorizon` / `protectedReserveAmount`
  / `reserveProtected` are gone from every API response — read
  `lowestProjectedBalance` / `endingProjectedBalance`.
- What-if: 3 blocks, 3 result types; keep the "obligations not covered" line.
- Balance tone is binary — no amber tier.
- **Keep** the `activity.action.protected_reserve.*` strings for old history.
- **Do not** rename the `not_immediately_usable` bucket to "dự phòng" now that the
  name is free — see `memory/assets.md`.

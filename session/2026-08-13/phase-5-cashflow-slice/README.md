# Phase 5 — cashflow slice; delete `features/payments`

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/phase-5-cashflow-slice/`
- **Status**: done

## What the task is

v3.1 Phase 5, per `session/2026-08-13/v31-remaining-phases/README.md`.

The backend route `/upcoming-payments` no longer exists — it was replaced by
`/cashflow-events` (§18), which is not an alias: the payload shape changed
(`dueDate` → `expectedDate`, plus `direction` / `certainty` / `requirement`).
The app's payments calls were therefore already dead against a migrated
backend. This phase is the cutover.

## Changes made

**New slice — `src/features/cashflow/`** (built on the `features/goals/` layering):

- `model/cashflow.types.ts` — `CashflowEvent` and its unions, mirrored from the
  backend entity. `LIVE_CASHFLOW_STATUSES` + `isLiveCashflowStatus`.
- `api/cashflow-events.repository.ts` — full CRUD over `apiRequest`, plus the
  three lifecycle actions (`complete` / `postpone` / `cancel`) and the §18
  server-side filters (`direction`, `status`, `requirement`, `certainty`,
  `from`, `to`, `limit`).
- `hooks/use-cashflow-events.ts` — TanStack Query hook; mutations invalidate
  the whole derived family (cashflow, events, dashboard, forecast,
  flexible-money, financial-state, attention).
- `model/legacy-payment-shim.ts` — `toLegacyPaymentItem` + the inverse
  `legacyStatusToAttentionLevel`. **Transitional; do not build on it.**
- `hooks/use-payments-compat.ts` — drop-in replacement for the deleted
  `usePayments`, so the four consumers needed an import swap and nothing more.

**Harvested before deletion:**

- `src/features/freshness/ui/components/calm-note-card.tsx` — the calm-list
  markup from `payments-gentle-card.tsx`, now taking `title` / `description` /
  `icon` as props instead of hardcoding its copy.

**Re-pointed consumers** (`usePayments()` → `usePaymentsCompat()`):

- `features/debts/hooks/use-debts-page.ts`, `features/debts/hooks/use-debt-detail.ts`
- `features/dashboard/hooks/use-dashboard-overview.ts`
- `features/events/hooks/use-events-page.ts` — the deepest consumer; it drives
  create / update / delete, not just reads.

Six UI files importing the `UpcomingPaymentItem` *type* now import
`LegacyPaymentItem as UpcomingPaymentItem` from the shim (4 in `debts/ui`,
1 in `dashboard/ui`, 1 in `debts/ui/debt-detail-page.tsx`).

**Deleted:**

- `src/features/payments/` — the whole slice (16 files).
- The `payments.*` i18n namespace, both `vi` and `en` (81 lines each).

## Key decisions

- **`usePaymentsCompat` rather than rewriting the consumers.** The README
  scoped Phase 5 as a mechanical re-point, and Phases 6/9 replace `/events`,
  `/debts` and the dashboard with real cashflow UI anyway. Rewriting them here
  would be work thrown away twice.
- **`attentionLevel`, not `status`, carries the legacy status triple.** The old
  `important | normal | pending` mixed urgency with lifecycle. `important` and
  `normal` are urgency → `attentionLevel`; only `pending_confirmation` is a
  genuine lifecycle state. Round-tripping through `status` would have corrupted
  the record.
- **The compat hook filters `{ direction: 'outgoing', status: 'live' }`** —
  that is what the old `/upcoming-payments` returned. Incoming events exist now
  but the legacy components cannot express them, so they are excluded rather
  than rendered as if they were bills.
- **`payload.owner` is dropped in the compat write path.** It was a display
  *name*; the backend wants `ownerMemberId`. Guessing an id from a name would
  silently mis-assign. The real owner picker lands with the Phase 6 form.
- **Two backend unions differed from the obvious guess** — checked against
  source rather than assumed: recurrence is `once` (not `none`), and
  `VisibilityLevel` is `summary_only | grouped | detail | private` (there is no
  `shared`).
- **`/payments` → `/events` redirect left alone.** Phase 10 re-points it to
  `/upcoming`; changing it now would just churn.

## Gate

- `npm run build` — **clean** (tsc -b + vite build).
- `node scripts/check-copy.mjs` — **passes**.
- `npx eslint .` — **6 errors, 8 warnings**, byte-identical to the documented
  pre-existing state. Nothing new introduced.
- Dev server boots; `/`, and every re-pointed module transforms 200.

**Not proven:** that `/`, `/debts` and `/events` render *live data*. That needs
a backend running against a migrated database, and the 15 v3.1 migrations are
still unapplied (the user's call — see the v31-remaining-phases README). Static
verification is the limit here.

## Mobile app parity notes

- Port the whole `features/cashflow/` slice: the types, the repository and the
  query-invalidation set are platform-agnostic and should be copied nearly
  verbatim.
- **Do NOT port `legacy-payment-shim.ts` or `use-payments-compat.ts`.** They
  exist only to keep this repo's pre-v3.1 components alive across one commit.
  The mobile app has no such legacy components — build its cashflow UI directly
  against `useCashflowEvents`.
- Mobile must also drop its `payments.*` i18n namespace and any
  `/upcoming-payments` calls; that route is gone server-side.
- `calm-note-card.tsx` is web markup (Tailwind + shadcn `Card`); port the
  *pattern* (tinted icon disc + title + soft paragraph), not the classes.

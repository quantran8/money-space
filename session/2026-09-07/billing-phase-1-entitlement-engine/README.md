# Billing Phase 1 — entitlement engine (read-only, gates nothing yet)

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-1-entitlement-engine/`
- **Status**: planned

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Phase 0 (pre-launch data and
> operations fixes) is done — see `../phase-0-pre-launch-fixes/`.

## What the task is

Stand up the entitlement layer without changing anyone's behaviour. After this
phase every household reads back `tier: 'free'`, nothing is blocked, and no
screen looks different except a new status card in Settings.

Shipping it separately is the point: the risky part of billing is the gating,
and this phase contains none of it.

## Planned changes

### Backend — new module `backend/src/modules/billing/`

Named `billing`, not `subscription`: it will hold entitlement, redeem codes and
payments together.

- `backend/prisma/schema.prisma` — enums `SubscriptionTier`,
  `SubscriptionStatus`, `EntitlementSource`; model `HouseholdSubscription`
  (1-1 with `Household`); relation on `Household`. Follow the file's
  conventions: `uuid(7)`, `@map` snake_case, `@db.Timestamptz(6)`.
- `constants/plan-limits.ts` — `PLAN_LIMITS` for `free` / `premium`. **The one
  source of truth for every quota.**
- `constants/plan-catalog.ts` — 39.000đ / 30 days · 299.000đ / 365 days ·
  699.000đ lifetime. `YEARLY_REFERENCE_VND` is computed as `12 × monthly`,
  never typed by hand.
- `config/billing.config.ts` (in `backend/src/config/`, matching
  `cache.config.ts`) — `lifetimeEnabled`, per-plan `discountPercent`,
  `discountLabel`, `discountStartsAt/EndsAt`, all from env.
- `domain/plan-pricing.ts` + `.spec.ts` — `buildPlanOffers(now)`, the only place
  a price is computed.
- `domain/entitlement.ts` + `.spec.ts` — `resolveEntitlement(row, now)`, pure.
- `entitlement.service.ts` — `forHousehold()`, two-tier cache (in-process 30s →
  Redis 900s).
- `entitlement.controller.ts` — `GET /households/:householdId/entitlement`.
- `plans.controller.ts` — `GET /billing/plans`, `@Public()` (the landing page
  reads it).
- `backend/src/common/cache/cache.keys.ts` — `entitlement` key **outside** the
  `hh:<id>:` prefix, plus its TTL.
- `backend/src/common/cache/cache.service.ts` — add `incr(key, ttl)`, fail-open
  like the rest of the service. Phase 3 needs it; adding it here keeps that
  phase to gating only.

### Frontend

- `packages/core/src/shared/api/query-keys.ts` — add `entitlement` and
  `paymentOrders` under a `['billing', …]` root; **delete the unused `payments`
  key** rather than repurposing it.
- `packages/core/src/features/billing/api/billing.repository.ts` (new)
- `packages/core/src/features/billing/hooks/use-entitlement.ts` (new)
- `web/src/features/settings/ui/components/` — a plan status card.

## Key decisions

- **`HouseholdSubscription` is 1-1, not a history table.** Entitlement is read
  often, so it must be a `findUnique`, not `ORDER BY … LIMIT 1`. History already
  lives in `RedeemCodeRedemption` and `PaymentOrder` (Phases 2 and 4).
- **A missing row means free.** No backfill migration; the row is created on
  first grant.
- **Lifetime is `tier: premium` + `currentPeriodEnd: null`.** No extra column,
  and the expiry cron's `currentPeriodEnd < now()` skips it naturally.
- **The cache stores the DB row; `now` is compared on every call.** A 900s TTL
  therefore cannot let anyone use an expired plan for 15 minutes.
- **The entitlement cache key sits outside `hh:<id>:`** — every household write
  does `delByPrefix` on that prefix, and recording an expense does not change
  anyone's plan.
- **`limits` ships inside the `GET /entitlement` response.** The frontend
  hardcodes no quota. Changing free from 2 goals to 3 is one backend line and
  needs no app-store release. Same for prices via `GET /billing/plans`.
- **Prices are constants in code; discounts are env.** Changing a price deserves
  review; running a campaign should not need a deploy.

## Verification

```bash
cd backend && pnpm prisma migrate dev && pnpm build && pnpm test
```

- `GET …/entitlement` returns `tier: free` with full `limits` for an untouched
  household.
- `GET /billing/plans` returns three plans; the yearly one shows
  `amountOriginal: 468000` and `savingsAmount: 169000`.
- `BILLING_DISCOUNT_YEARLY_PERCENT=20` + restart → yearly becomes 239.200đ.
- `BILLING_LIFETIME_ENABLED=false` → lifetime comes back `available: false`.
- Every existing page still works. Nothing is blocked anywhere.

## Mobile app parity notes

- `useEntitlement()`, the query keys and the repository are all in
  `packages/core` — mobile gets them for free.
- **To port**: a plan status row in the Gia đình tab. Read-only in this phase;
  the real subscription screen lands in Phase 2.

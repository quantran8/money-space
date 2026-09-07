# Billing Phase 1 — entitlement engine (read-only, gates nothing yet)

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-1-entitlement-engine/`
- **Status**: done

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Phase 0 is done — see
> `../phase-0-pre-launch-fixes/`.

## What the task is

Stand up the entitlement layer without changing anyone's behaviour. Every
household still reads back `tier: 'free'`, nothing is blocked, and the only
visible change is a plan status card.

Shipping it alone is the point: the risky part of billing is the gating, and
this phase has none of it.

## Changes made

### Backend

- `prisma/schema.prisma` — enums `SubscriptionTier`, `SubscriptionStatus`,
  `EntitlementSource`; model `HouseholdSubscription` (1-1 with `Household`).
- `prisma/migrations/20260907090000_household_subscription/` — written by hand
  (see Key decisions).
- `src/modules/billing/` (new):
  - `constants/plan-limits.ts` — `PLAN_LIMITS` + `hasFeature()`. The one source
    of truth for every quota.
  - `constants/plan-catalog.ts` — 39.000đ/30d · 299.000đ/365d · 699.000đ
    lifetime, plus `YEARLY_REFERENCE_VND` computed as `12 × monthly`.
  - `domain/plan-pricing.ts` + `.spec.ts` — `buildPlanOffers(now)`.
  - `domain/entitlement.ts` + `.spec.ts` — `resolveEntitlement(id, row, now)`.
  - `entities/entitlement.entity.ts`, `repositories/`, `entitlement.service.ts`,
    `entitlement.controller.ts`, `plans.controller.ts`, `billing.module.ts`.
- `src/config/billing.config.ts` — discounts, the lifetime switch, trial length.
- `src/common/cache/cache.keys.ts` — `entitlement` key + a 900s TTL, both
  outside the `hh:` prefix.
- `src/common/cache/cache.service.ts` — `incr(key, ttl)`, fail-open like the
  rest. Phase 3 needs it; adding it here keeps that phase to gating only.
- `src/modules/money-space.module.ts` — registers `BillingModule`.

New endpoints: `GET /households/:householdId/entitlement`,
`GET /billing/plans` (`@Public()`).

### Frontend

- `packages/core/src/shared/api/query-keys.ts` — `entitlement`, `plans`,
  `paymentOrders` under a `['billing', …]` root; **removed the unused
  `payments` key**.
- `packages/core/src/features/billing/api/billing.repository.ts` (new)
- `packages/core/src/features/billing/hooks/use-entitlement.ts` (new)
- `packages/core/src/features/billing/hooks/use-plans.ts` (new)
- `packages/core/src/i18n/resources.ts` — `settings.billing.*`, `vi` and `en`.
- `web/src/features/settings/ui/components/subscription-card.tsx` (new), placed
  above `DataCard` in `settings-page.tsx`.
- `mobile/src/features/billing/ui/subscription-section.tsx` (new), placed above
  `SignOutSection` in the Gia đình tab.

## Key decisions

- **`HouseholdSubscription` is 1-1, not a history table.** Entitlement is read
  constantly, so it must be a `findUnique`, not `ORDER BY … LIMIT 1`. History
  belongs to `RedeemCodeRedemption` and `PaymentOrder` in later phases.
- **A missing row means free**, so nothing had to be backfilled and every
  paid-plan column is nullable.
- **Lifetime is `tier: premium` + `currentPeriodEnd: null`.** No extra flag, and
  the expiry sweep's `currentPeriodEnd < now()` skips those rows on its own.
- **The cache stores the ROW; `now` is compared on every call.** This is what
  makes a 900s TTL safe — a plan stops working the second it expires, not
  fifteen minutes later. Verified against a live server (below).
- **The entitlement cache key sits outside `hh:<id>:`.** Every household write
  runs `delByPrefix` on that prefix, and recording an expense has not changed
  anyone's plan. Same reasoning on the client: `queryKeys.entitlement` is under
  `['billing', …]`, not `['households', id, …]`.
- **`limits` ships inside the response.** No client hardcodes a ceiling —
  `limits.goals`, never the literal 2 — so moving it is one backend line with no
  app-store release. Prices work the same way via `GET /billing/plans`.
- **Prices are constants in code; discounts are env.** Changing a price deserves
  review; running a campaign should not need a deploy.
- **A lapsed plan keeps `tier: 'premium'` and flips `status` to `'expired'`.**
  It lets the UI say "hết hạn ngày X" instead of "đang dùng gói Free" — a large
  difference for win-back. `limits` has already dropped to free, so nothing is
  actually granted.
- **The migration was written by hand.** `prisma migrate dev` wanted to **reset
  the whole database**: production carries a column
  (`asset_calculation_terms.base_principal_amount`) that no migration creates,
  so Prisma sees drift and offers only a reset. That drift predates this work.
  `migrate deploy` then applied just the new file — no data touched.
- **`billingConfig` fields are getters, not values.** Found by testing against a
  running server: a plain object captures `process.env` at import time, which is
  **before** `ConfigModule.forRoot()` loads `.env`, so a configured discount did
  nothing at all. The comment in `app.module.ts` warns about exactly this. The
  spec now sets real env vars instead of patching the object, so it also covers
  the indirection.

## Verification

```bash
cd backend && npx prisma migrate deploy && pnpm build && pnpm test
```

821 tests pass (18 new). One pre-existing failure remains in
`vnstock-commodity.provider.spec.ts` — confirmed by stashing that it fails on
`main` too, and unrelated to this work.

Against a live server with a real household:

- `GET /billing/plans` → 39.000đ · 299.000đ (`compareAtAmount: 468000`,
  `savingsAmount: 169000`, `monthlyEquivalent: 25000`) · 699.000đ.
- `BILLING_DISCOUNT_YEARLY_PERCENT=20` + `BILLING_DISCOUNT_LABEL` in `.env` →
  yearly becomes **239.000đ** with the badge; `BILLING_LIFETIME_ENABLED=false` →
  lifetime disappears (`total: 2`). Both reverted afterwards.
- `GET …/entitlement` on an untouched household → `tier: free`, full `limits`,
  and real usage counts (1 goal, 1 market-priced asset).
- Granted premium to 2027 by SQL → `goals: null`, horizons `[7,30,60,90]`,
  `daysRemaining: 480`.
- Moved `current_period_end` into the past → `status: 'expired'`, limits back to
  free, **`tier` still `premium`**. This is the cache-design proof.
- `current_period_end = NULL` → `isLifetime: true`, `daysRemaining: null`.
- Row deleted → back to `tier: free`. Test data cleaned up.

`cd frontend && pnpm verify` passes: build, copy check, design scale, eslint,
mobile typecheck, mobile lint. Warnings are pre-existing.

## Mobile app parity notes

- `useEntitlement()`, `usePlans()`, the repository, the query keys and every
  string live in `packages/core` — no porting needed.
- **Built for both platforms in this phase**: the plan status card (web
  Settings) and section (mobile Gia đình tab).
- `StatusChip` differs between the two kits — web takes children, mobile takes a
  `label` prop. Caught by `tsc`.
- Nothing on mobile links out to payment, and nothing will: that constraint
  starts in Phase 2 and holds through Phase 4.

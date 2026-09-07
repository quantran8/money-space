# Billing Phase 3 — turn the gates on (Free vs Premium becomes real)

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-3-enable-gates/`
- **Status**: planned

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phases 1 and 2.

## What the task is

The first phase where a Free household is told no. Everything before this was
additive; this one takes capability away, so it ships in small pieces that can
each be reverted alone.

**Free**: 2 active goals · 5 what-ifs per month · 2 auto-priced assets ·
7/30-day horizon · 3 months of history.
**Premium**: all unlimited, plus 60/90-day horizon and data export.

**Never gated**, however tempting: inviting a partner, sharing levels, the
activity log, and the what-if asset-sale funding step. The first three are the
core loop — a one-person household is a dead end, and the journal is what
replaces permissions in this product. The funding step only appears when a
household is short on money, which is exactly when they need the app most.

## Order of work — FE paywall first

**3a. Frontend paywall, before any backend gate.** Otherwise the first gate
switched on surfaces as a bare error toast.

- `packages/core/src/shared/stores/paywall-store.ts` — shaped like
  `whatif-store.ts`; `openPaywall({ reason, limit, used })`.
- `web/src/features/billing/ui/paywall-sheet.tsx` — mounted once in
  `app-shell.tsx` beside `<WhatIfSheet />`; uses `ResponsiveDialog`.
- `mobile/src/features/billing/ui/paywall-sheet.tsx` — mounted once in
  `app/(tabs)/_layout.tsx`.
- `packages/core/src/features/billing/hooks/use-premium-action.ts` —
  `run(action)`: allowed → run, otherwise open the paywall.
- **Global 402 handling** in both hosts' `QueryClient` — the safety net that
  matters most.

Then, each independently shippable:

- **3b. Goal quota** — `goals.service.ts` `createFinancialGoal()` (~line 884).
  `existingGoals` is already in the `Promise.all`, so this costs **no extra
  query**. Count `status === 'active'` only.
- **3c. Horizon** — move `parseHorizon` from the four `forecast.controller.ts`
  handlers down into the service, which is where `householdId` already is. It
  stays a single chokepoint. Do **not** put `@RequirePremium()` on
  `/forecast-bundle`: it serves Free at horizon 30 too.
- **3d. What-if quota** — `whatif-usage.service.ts`, Redis counter keyed
  `billing:whatif:<householdId>:<YYYY-MM>`, consumed in `forecast.service.ts`
  `whatIf()`.
- **3e. Auto-price quota** — new column `Asset.autoPriceEnabled`; a
  `PATCH /assets/:id/auto-price` toggle; `assets.service.ts` (~612 create,
  ~779 update); the cron's `findHouseholdsNeedingMarketValuation` filters on it.
- **3f. `EntitlementGuard`** registered as the **third** `APP_GUARD` in
  `auth.module.ts`, after `HouseholdAccessGuard` (it needs
  `request.membership`).
- **3g. 14-day trial** granted in `households.service.ts` on create.

## Key decisions

- **402, not 403.** 403 already means "you are not a member of this household"
  (`HouseholdAccessGuard`). If the paywall were also 403 the frontend could not
  tell "wrong household" from "needs upgrading", and `ApiError` only carries a
  status code.
- **The guard only handles boolean features; counted quotas are checked in the
  service**, using a `used` value the service has already queried. A guard
  cannot count without a second query.
- **The guard returns `true` immediately when a route has no decorator** — no
  cache read, no DB read. That is what makes it safe to register globally.
- **Only `status === 'active'` goals count.** Otherwise a Free household that
  completes two goals can never create a third, which punishes them for
  succeeding.
- **What-if usage lives in Redis, not a table.** What-if is a pure read and
  people re-run it constantly while adjusting an amount; a row per run would
  turn the cheapest operation in the app into a write. Losing the counter costs
  0đ, and it cannot be derived from the audit log because what-if deliberately
  writes no journal entry.
- **Creating a gold/stock/crypto asset is never blocked.** Only *automatic
  pricing* is limited. Blocking the asset type would stop a Vietnamese household
  recording gold on its own balance sheet — they would leave, not pay. What
  Premium sells is the automation.
- **Over quota does not throw 402 here** — the asset is created with
  `autoPriceEnabled: false` and a "Cập nhật tay" chip. The household picks which
  two are automatic, rather than "the first two you created".
- **Trial keeps `tier: premium` and flips `status: 'expired'`.** Lets the UI say
  "Gói Premium của gia đình đã hết hạn ngày X" instead of "đang dùng gói Free" —
  a large difference for win-back. `resolveEntitlement` still resolves it to
  Free limits.
- **Buttons stay enabled.** A disabled button explains nothing; a paywall
  explains exactly what was hit and what it costs. Horizon 60/90 stay visible
  with a badge, so people can see the product they do not have.

## Verification

With a Free household:

- Third goal → paywall says `goal_quota`, "2 mục tiêu" — **not an error toast**.
- Horizon 90 → `forecast_horizon`.
- Sixth what-if in a month → `whatif_quota`, "5/5".
- Third gold asset → **still created**, shows the "Cập nhật tay" chip.
- Toggle auto-price onto another asset → the previous one turns off.

New household → 14-day trial, `isTrial: true`. Set `trialEndsAt` into the past
directly in the DB → limits drop to Free on the **next call**, not after the
900s TTL. That single check is the most important proof the cache design is
right.

With a Premium household, every path above is open.

## Mobile app parity notes

- `paywall-store`, `usePremiumAction` and every string are in `packages/core`.
- **Built for both platforms in this phase**: the paywall sheet and the global
  402 handler.
- Mobile paywall shows prices and takes a code, but **no button to a payment
  page** (App Store rules). The renewal line points at the web app.
- The auto-price toggle needs a mobile equivalent on the asset detail screen.

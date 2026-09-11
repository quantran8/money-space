# Billing phase 6 — in-app purchase (RevenueCat)

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-6-revenuecat-iap/`
- **Status**: done (store products not yet configured; live purchase untested)

## What the task is

Let the mobile app actually sell Premium.

Phases 1–5 built entitlement, redeem codes and PayOS checkout, but the mobile
paywall deliberately had **no buy button** — Apple and Google reject apps that
steer to an outside payment flow for digital goods, so the PayOS checkout the
web uses was not an option. Mobile could show prices and take a code, nothing
more. This adds in-app purchase through RevenueCat.

## Changes made

### Backend

- `prisma/schema.prisma`, `prisma/migrations/20260907130000_revenuecat_iap/` —
  `PaymentProvider.revenuecat`, a `PurchaseStore` enum, IAP columns on
  `payment_orders` (`store`, `provider_user_id`, `product_id`,
  `store_expires_at`), and the new `revenuecat_subscribers` mapping table.
  `order_code` and `created_by` became nullable — an IAP has no PayOS order
  reference, and a store renewal has no actor.
- `constants/store-products.ts` — product id → plan, with the Play
  `:base-plan-id` suffix stripped.
- `domain/revenuecat-event.ts` — which events grant, which are refunds, and the
  idempotency key.
- `domain/revenuecat-auth.ts` — timing-safe check of the `Authorization` secret.
- `revenuecat.service.ts` — settles a purchase into `grantOrExtend`.
- `revenuecat-webhook.controller.ts`, `revenuecat.controller.ts` — the webhook
  and the subscriber-link endpoint.
- `config/billing.config.ts` — `REVENUECAT_WEBHOOK_SECRET`,
  `REVENUECAT_ENTITLEMENT_ID`, `REVENUECAT_ALLOW_SANDBOX`.
- Specs for all of the above: 40 new tests, 137 passing in `modules/billing`.

### Core (shared)

- `shared/store-purchases.ts` — the injected `StorePurchaseAdapter`, defaulting
  to an adapter that reports it cannot sell (the web's honest answer).
- `features/billing/hooks/use-store-purchase.ts` — buy, restore, and the
  entitlement poll that waits for the webhook.
- `features/billing/api/billing.repository.ts` — `linkRevenuecatSubscriber`,
  plus `provider` / `store` on `PaymentOrder`.
- `i18n/resources.ts` — `billing.paywall.store.*` in **vi and en**.

### Mobile

- `src/shared/native-purchases.ts` — RevenueCat behind core's adapter.
- `src/shared/bootstrap.ts` — wires it, and keeps `app_user_id` equal to the
  signed-in profile id by subscribing to the auth store.
- `src/features/billing/ui/paywall-sheet.tsx`, `app/subscription.tsx` — real buy
  buttons and a restore control.
- `src/features/billing/ui/purchase-status.tsx` — new.

## Key decisions

- **The client never grants itself anything.** A purchase only refetches
  `GET /entitlement`; the webhook moves the expiry. This is what makes the plan
  reach the PARTNER, since it is priced per household and only the server can
  hand Premium to somebody else's session. It also makes a forged local receipt
  worthless.
- **The subscriber → household mapping is written before the store sheet
  opens.** A renewal a year later carries only `app_user_id`, with no app
  running; without the mapping that money could not be attributed. The household
  is set on INSERT and never updated, so someone who changes household does not
  redirect their running subscription.
- **An IAP only ever adds time.** `CANCELLATION` and `EXPIRATION` are ignored
  (the expiry cron owns that), and refunds are logged for a person rather than
  revoked — deciding which days to remove from a stacked period can take away
  time somebody owns.
- **Store prices are displayed, not ours.** `product.priceString` verbatim; our
  đồng figure is only a fallback.
- Not put behind `PAYMENT_GATEWAY`: that token is for gateways we ask to create
  a checkout, and a store purchase is only ever reported after the fact.

Full nghiệp vụ: `backend/memory/billing-and-entitlement.md` and
`frontend/memory/billing.md`.

## Mobile app parity notes

This IS the mobile task. Web is deliberately untouched — it keeps PayOS, and
core's default adapter reports that the web cannot sell through a store, so
nothing there changed behaviour. Web typechecks clean.

## Before this can take money

1. Create the three products in App Store Connect and Play Console with the ids
   in `constants/store-products.ts`, and attach them to a `premium` entitlement
   in RevenueCat.
2. Set `REVENUECAT_WEBHOOK_SECRET` (backend) and the two
   `EXPO_PUBLIC_REVENUECAT_*` keys (mobile).
3. `REVENUECAT_ALLOW_SANDBOX=false` in production.
4. A **dev build** — the native module is not in Expo Go, where the paywall
   correctly falls back to prices with no buy button.
5. Apply `20260907130000_revenuecat_iap`. Two unrelated migrations were also
   pending on the shared database and were left alone.

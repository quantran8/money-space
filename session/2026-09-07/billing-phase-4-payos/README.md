# Billing Phase 4 — PayOS checkout

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-4-payos/`
- **Status**: done (code complete; live payment untested — no credentials yet)

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phases 1–3.

## What the task is

Self-service payment on the web, replacing the manual bank-transfer + code
handover that Phase 2 made possible. Codes stay — they are still how beta
testers, referrals and offline sales work.

**PayOS**, chosen over Casso and VNPay: 0đ per transaction (free model since
23/01/2026), a hosted checkout page with a QR already built, and a proper
HMAC-SHA256 webhook signature. Casso only reconciles transfers — no checkout.
VNPay needs a business licence and 2–4 weeks of approval, and charges 1.1–2.2%;
at 39.000đ every percent counts. VNPay stays deferred.

## ⚠ Two PayOS constraints that change the design

1. **`orderCode` must be an INTEGER and unique.** The `orderRef =
   "OSK4M2QX7T"` string in the original design **cannot be used**. Replaced with
   `orderCode BigInt`, generated as
   `(epochSeconds % 100_000_000) * 100 + random(0..99)`.
2. **`description` is capped at 9 characters** for bank accounts not linked to
   PayOS. Send the constant `"OURSIGHT"` (8).

The upside: the hardest part of the Casso approach disappears. Nobody types a
transfer memo, because they scan a QR on the hosted page — so there is no
free-text matching to get wrong.

## Planned changes

- `backend/prisma/schema.prisma` — enums `PaymentProvider` (`payos` first),
  `PaymentOrderStatus`; model `PaymentOrder` with `orderCode BigInt @unique`,
  `amountOriginal` / `discountAmount` / `amount` (all three, so an old order
  survives a price change and reconciles), and `providerTxnId String? @unique`.
- `backend/src/main.ts` — `NestFactory.create(…, { rawBody: true })`. Nest 11
  keeps the raw Buffer at `request.rawBody` **and still parses JSON**, so no
  existing route is affected.
- `backend/src/common/interceptors/raw-response.decorator.ts` (new) + an `if` in
  `response.interceptor.ts` — PayOS dictates the response shape and cannot take
  the `{ success, data, … }` envelope.
- `domain/payos-signature.ts` + **`.spec.ts` (required)** — sort the keys of the
  `data` object alphabetically, join as `key=value&…`, HMAC-SHA256 with the
  checksum key, compare with `crypto.timingSafeEqual`. Note it signs **`data`
  only**, not the whole body.
- `payments.service.ts` / `payments.controller.ts` /
  `payments-webhook.controller.ts` — the last one `@Public()` and
  `@NoCacheInvalidation()`.
- `config/billing.config.ts` — `payosClientId`, `payosApiKey`,
  `payosChecksumKey`, `payosReturnUrl`, `payosCancelUrl`.
- Frontend: plan buttons → create order → redirect to `checkoutUrl`;
  `packages/core/src/features/billing/hooks/use-payment-return.ts`.

## Key decisions

- **No `@payos/node` SDK.** Three HTTP calls and one HMAC. Writing
  `PayosGateway` against a `PaymentGateway` interface is fewer dependencies and
  easier to test — consistent with the hand-written vnstock and CoinMarketCap
  adapters. Adding VNPay later becomes one new file.
- **Idempotency in three layers**: `providerTxnId @unique` (the main one — a
  second delivery violates it and is swallowed); a conditional
  `UPDATE … WHERE order_code = $1 AND status = 'pending'`; and extending the
  period **inside the same transaction** as the status change, so "paid but not
  granted" cannot exist.
- **Prepaid, no auto-renew.** No Vietnamese gateway does real recurring billing
  at this price. Vietnamese copy says **"gói"** and **"gia hạn gói"**, never
  "đăng ký" — honest about what is actually bought.
- **A webhook never returns an error.** Catch everything, return 200 in the
  shape PayOS expects. A permanent failure answered with 500 gets retried
  forever. Genuine transient failures (DB down) do return 500, on purpose.
- **PayOS may call the webhook to verify the URL on registration** — that test
  payload must return 200 and not be treated as a failure.
- **Underpayment leaves the order `pending`**, records `rawPayload`, and does
  not auto-cancel.
- **Return polling is bounded**: every 2s for 30s, then a calm "đang xác nhận"
  message. An abandoned tab must not poll forever. The subscription page also
  sets `refetchOnWindowFocus: true`, which covers coming back from the banking
  app.

## Changes made

### Backend

- `prisma/schema.prisma` — enums `PaymentProvider`, `PaymentOrderStatus`; model
  `PaymentOrder` with `orderCode BigInt @unique` and `providerTxnId @unique`.
- `prisma/migrations/20260907120000_payment_orders/` — hand-written, purely
  additive (a new table, two enums). **Applied**; `migrate status` reports
  "Database schema is up to date".
- `src/modules/billing/domain/payos-signature.ts` + `.spec.ts` — 10 cases.
- `src/modules/billing/domain/order-code.ts` + `.spec.ts` — 5 cases.
- `src/modules/billing/gateways/payment-gateway.interface.ts` +
  `payos.gateway.ts` — hand-written, no `@payos/node`.
- `src/modules/billing/payments.service.ts` + `.spec.ts` — 11 cases, all of
  them about idempotency or about what must never grant.
- `src/modules/billing/payments.controller.ts`,
  `payments-webhook.controller.ts`.
- `src/common/interceptors/raw-response.decorator.ts` + the branch in
  `response.interceptor.ts`.
- `src/common/repositories/prisma-errors.ts` — `isUniqueViolation`, extracted
  from `redeem.service.ts`, which now shares it with payments. It is the
  idempotency barrier in both.
- `src/main.ts` — `rawBody: true`.
- `src/config/billing.config.ts` — the five PayOS fields plus
  `payosConfigured` and `payosOrderTtlMinutes`.

New endpoints: `POST …/payments/orders`, `GET …/payments/orders`,
`GET …/payments/orders/:orderCode`, `POST …/payments/orders/:orderCode/cancel`,
and `POST /billing/webhooks/payos` (`@Public()`).

### Frontend

- `packages/core/src/features/billing/api/billing.repository.ts` — the four
  payment calls.
- `packages/core/src/features/billing/hooks/use-checkout.ts` (new) — starts an
  order and redirects; remembers the order code in `sessionStorage`.
- `packages/core/src/features/billing/hooks/use-payment-return.ts` (new) — 2s
  polling, bounded at 30s.
- `packages/core/src/i18n/resources.ts` — `billing.checkout.*`, both languages.
- `web/src/features/billing/ui/paywall-sheet.tsx` — the CTA now opens a real
  checkout.
- `web/src/features/billing/ui/subscription-page.tsx` — plan rows are buy
  buttons; the return banner sits above the plan card.

## Notes from the build

- **PayOS signs the `data` object, not the request body.** The spec pins this
  explicitly, because HMAC-ing the whole body is what every other webhook
  scheme does and the resulting failure is indistinguishable from a forged
  request. `null`/`undefined` also serialize as the EMPTY string rather than
  `"null"` — get that wrong and genuine payments are rejected.
- **`rawBody: true` is not actually needed by PayOS,** since it signs the
  parsed object. Enabled anyway: Nest 11 keeps the parsed body alongside it so
  nothing is affected, and discovering the need after taking a payment is worse
  than one flag now.
- **`ResponseInterceptor` gained a `Reflector`.** It is registered with
  `useClass`, so Nest injects it — no registration change was needed.
- **`isUniqueViolation` was a private function in `redeem.service.ts`.**
  Extracted rather than duplicated: it is the same barrier doing the same job
  in both places, and a second copy could drift.
- **The checkout error is a boolean, not a message.** Every failure to OPEN a
  checkout reads the same to a household — the page did not appear — and the
  copy belongs in i18n rather than being whatever the gateway said.

## Verified

```bash
cd backend && pnpm test          # 906 pass (26 new), 1 pre-existing failure
cd frontend && pnpm verify       # build · copy · design scale · eslint · mobile
```

The 26 new cases cover the parts that decide whether money is handled
correctly: the signature scheme in full (including the sign-the-body trap, a
one-byte alteration, a wrong key, and lengths that would make `timingSafeEqual`
throw), the order code's range and salt, and every webhook outcome — replay,
lost settle race, unique-violation, forged signature, tampered amount, unknown
order, underpayment, and PayOS's registration ping. A transient failure is the
one case that still throws, so PayOS retries it.

## ⚠ Not yet done — needs credentials

`.env` has no PayOS keys, so **nothing has touched the real gateway**. Set:

```
PAYOS_CLIENT_ID=…
PAYOS_API_KEY=…
PAYOS_CHECKSUM_KEY=…
PAYOS_RETURN_URL=https://oursight.vn/settings/subscription
PAYOS_CANCEL_URL=https://oursight.vn/settings/subscription
```

Until they are set, `payosConfigured` is false and order creation refuses with
`payments_unavailable` — deliberately, at the button rather than mid-checkout.

Everything under *Verification* below still has to be run against the live
gateway: a real 39k payment, the webhook replay, the tampered-byte resend, the
registration ping, and cancelling mid-checkout. The unit tests assert the same
properties against a stub, which is not the same as PayOS actually agreeing
with our reading of its signature scheme.

## Verification

```bash
cd backend && pnpm test -- payos-signature
```

- Create an order → `checkoutUrl` opens, QR scans in a banking app.
- Pay one real 39k order → webhook arrives, period extends correctly.
- **Replay the same webhook with the same `data.reference`** → period extends
  **once**; the second returns 200 and logs "already handled".
- Alter one byte of `data` and resend → signature fails → 200, nothing granted.
- PayOS's registration test ping → 200, no error.
- Cancel mid-checkout → `cancelUrl` returns cleanly, order never becomes `paid`.

## Mobile app parity notes

- **Nothing to port.** Mobile deliberately stays status + redeem code only:
  Apple rejects apps that link out to a purchase flow. The renewal line points
  at the web app in plain words, without a tappable link to a payment page.
- `use-payment-return.ts` is in core but is only mounted by the web.

# Billing Phase 4 — PayOS checkout

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-4-payos/`
- **Status**: planned

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

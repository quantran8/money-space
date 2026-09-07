# Billing Phase 5 — lifecycle and retention

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-5-lifecycle-retention/`
- **Status**: planned

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phases 1–4.

## What the task is

What happens after the sale: expiry, the nudge to renew, order history, data
export, and referrals. Without this a plan lapses silently and the household
finds out by hitting a wall.

## Planned changes

- `backend/src/modules/billing/billing-expiry.cron.ts` — copy the shape of
  `assets-valuation.cron.ts`: `@Cron` + env kill switch
  (`BILLING_EXPIRY_CRON_ENABLED`) + `withAdvisoryLock` + a `running` flag +
  chunked processing where one household's failure does not abort the batch.
  Two jobs in one sweep: flip expired subscriptions to `status: 'expired'`
  (invalidating each entitlement), and mark `pending` orders past `expiresAt` as
  `expired`.
- `backend/src/modules/attention/` — a derived item for "gói sắp hết hạn",
  computed from `entitlement.daysRemaining`.
- Order history on `/settings/subscription`, reading `queryKeys.paymentOrders`
  (added in Phase 1).
- **Data export** — the `exportData` limit exists in `PLAN_LIMITS` from Phase 1
  but nothing implements it. This is where it gets built.
- *(Optional)* Referral: one code per household, `campaign: 'referral'`, high
  `maxRedemptions`, with days credited back to the referrer.

## Key decisions

- **The cron runs at 09:00 Asia/Ho_Chi_Minh**, not 23:45 like the valuation job.
  A notice has to land when people are awake.
- **Reminders go through the existing `attention` module — no new
  infrastructure.** There is still no email service and no push channel in the
  repo. `AttentionService` already derives "cần cập nhật" items the same way, so
  an expiring plan is one more derived item and costs nothing to add. Email
  waits until there is an independent reason to build it.
- **Expiry keeps `tier: premium` and only flips `status`.** Same reasoning as
  the trial in Phase 3: it lets the UI say "hết hạn ngày X" rather than "gia
  đình đang dùng gói Free", which is the difference between a win-back and a
  shrug. `resolveEntitlement` still resolves Free limits.
- **Lifetime is never touched by the cron** — `currentPeriodEnd IS NULL` falls
  outside `WHERE currentPeriodEnd < now()` naturally, with no special case.
- **Turning off `BILLING_LIFETIME_ENABLED` stops new sales only.** Households
  that already bought keep it forever. Worth watching: market-data API cost runs
  indefinitely against a single payment, so capping sales by flipping that
  config once a target is met is the lever.

## Verification

- Set a household's `currentPeriodEnd` into the past, run the cron by hand →
  `status: 'expired'`, entitlement drops to Free limits, and the attention item
  appears on Home.
- A lifetime household is untouched by the same run.
- A `pending` order past `expiresAt` becomes `expired`; a `paid` one does not.
- Run the cron twice concurrently → the advisory lock means the work happens
  once.
- Order history shows amount, plan and date for both redeem grants and payments.

## Metrics this phase finally makes answerable

The plan's §J cannot be evaluated without analytics, which is why the plan
recommends adding analytics + Sentry during **Phase 1**, not here. Once data
exists:

| Question | Worrying answer |
|---|---|
| Does anyone hit a limit? | <20% of Free households hit any quota in 30 days ⇒ Free is too generous |
| Do they hit it too early? | Before day 3 ⇒ blocked before they trusted the app |
| Which paywall converts? | Any `reason` under 2% ⇒ that axis is not worth paying for |
| Trial → paid | <5% ⇒ Premium is not differentiated enough |
| Plan mix | Yearly under 40% ⇒ savings not legible, or not enough trust in longevity |
| Renewal | <60% ⇒ the app is not giving a reason to come back monthly |

Do not A/B prices before ~100 real households. Until then every number in
`PLAN_LIMITS` is a hypothesis — cheap to change, since they live in one file.

## Mobile app parity notes

- The attention item is derived on the backend and rendered by whatever already
  renders attention items — it appears on mobile with no extra work.
- **To port**: the order-history section on `mobile/app/subscription.tsx`.
- Export is web-first; a mobile share-sheet version is optional and not part of
  this phase.

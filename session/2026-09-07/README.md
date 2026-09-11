# 2026-09-07 — Freemium subscription: the whole plan

Seven tasks, each shippable on its own. Full reasoning, pricing rationale and the
technical design live in `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`; these
folders are the working record.

| # | Task | Status |
|---|---|---|
| 0 | [`phase-0-pre-launch-fixes`](phase-0-pre-launch-fixes/) — frozen dates, error boundaries, forgot password, CORS | **done** |
| 1 | [`billing-phase-1-entitlement-engine`](billing-phase-1-entitlement-engine/) — read-only, gates nothing | **done** |
| 2 | [`billing-phase-2-redeem-code`](billing-phase-2-redeem-code/) — ★ **can sell after this** | **done** |
| 3 | [`billing-phase-3-enable-gates`](billing-phase-3-enable-gates/) — Free vs Premium becomes real | **done** |
| 4 | [`billing-phase-4-payos`](billing-phase-4-payos/) — self-service checkout | **done** (live payment untested) |
| 5 | [`billing-phase-5-lifecycle-retention`](billing-phase-5-lifecycle-retention/) — expiry, renewal, export | **done** (referral deferred) |
| 6 | [`billing-phase-6-revenuecat-iap`](billing-phase-6-revenuecat-iap/) — in-app purchase, so mobile can sell | **done** (store products not yet configured) |

## What was decided

**Two tiers, priced per household** (both people, not per seat):

```
39.000đ / tháng     299.000đ / năm  (468.000đ — tiết kiệm 169.000đ, ≈25k/tháng)
699.000đ lifetime
```

Discounts are per-plan env config; lifetime has an on/off switch. Prices are
constants in code — changing one deserves review; running a campaign should not
need a deploy. The struck-through 468.000đ is computed as `12 × monthly`, never
typed by hand.

**Free**: 2 active goals · 5 what-ifs/month · 2 auto-priced assets · 7/30-day
horizon · 3 months of history · 14-day trial on signup.

**Never gated**: inviting a partner, sharing levels, the activity log, the
what-if asset-sale funding step, and recording gold/stocks/crypto on the balance
sheet. The first three are the core loop; the last is what a Vietnamese
household opens the app for. What Premium sells is *automation and decisions*,
not the right to keep records.

## Why this order

The plan's own thesis decides it: **Clarity drives adoption → Foresight drives
retention → Decision support is what people pay for.** So the gates land on the
decision layer, and the phases are ordered so that the riskiest change (taking
capability away, Phase 3) happens after the paywall UI exists to explain it.

Two ordering rules worth keeping:

- **Phase 2 before Phase 4.** Redeem codes make revenue possible with no
  gateway, no contract and no approval wait. Selling can start weeks before
  checkout exists.
- **Inside Phase 3, frontend before backend.** The first gate switched on
  without a paywall sheet surfaces as a bare error toast.

## Superseded

`family-finance-v3.1/06-pricing-metrics-validation.md` is **out of date against
the code**. It prices things that no longer exist (Protected Reserve, the
`private` sharing level), gates partner sharing (which would kill activation —
a one-person household is a dead end), and sells scenario history from a table
that was never built. It also predates market pricing, 15 asset types,
multi-stage debt interest and the activity log. Treat this folder as current.

## Before charging anyone

Phase 0 fixed the data and operations blockers. Two gaps remain that are not
billing code but gate real money:

- **Analytics** — without it none of Phase 5's metrics can be answered, and
  every quota in `PLAN_LIMITS` stays a guess. The plan puts this in **Phase 1**.
- **Error monitoring (Sentry)** — charging money while blind to the errors
  people hit is not operable.

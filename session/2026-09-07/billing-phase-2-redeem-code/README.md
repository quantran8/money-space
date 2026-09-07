# Billing Phase 2 — redeem codes end to end ★ the phase that can sell

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-2-redeem-code/`
- **Status**: done

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phase 1.

## What the task is

Activation codes: `OURS-XXXX-XXXX`, redeemed by a household for Premium — N
days, until a date, or forever.

**This is the phase that makes money.** Selling now works with no gateway, no
contract and no approval wait: post an offer → the buyer transfers → check the
banking app → run `pnpm redeem:create` → send the code on Zalo. The same
mechanism covers beta testers and referral rewards.

## Changes made

### Backend

- `prisma/schema.prisma` — enums `RedeemCodeStatus`, `RedeemGrantType`; models
  `RedeemCode` and `RedeemCodeRedemption`; relations on `Household` and
  `Profile`. Also **declared the missing `@@index([householdId, categoryId])`
  on `CashflowEvent`** — see Key decisions.
- `prisma/migrations/20260907100000_redeem_codes/` — hand-written.
- `src/modules/billing/`:
  - `domain/redeem-code-format.ts` + `.spec.ts` — generate, normalize, checksum.
  - `domain/extend-period.ts` + `.spec.ts` — the stacking rules.
  - `subscription.service.ts` — `grantOrExtend()`, `startTrialIfEligible()`.
  - `redeem.service.ts` + `.spec.ts` + `redeem.controller.ts`.
  - `entitlement.errors.ts` — `PremiumRequiredException` (402).
  - `entitlement.service.ts` — added `assertQuota()` for Phase 3.
  - repository — `lockSubscription` (FOR UPDATE), `claimRedeemCodeSlot`,
    `insertRedemption`, `updateRedemptionOutcome`, `findHouseholdName`.
- `src/common/filters/http-exception.filter.ts` — forwards the `premium` field.
- `src/common/audit/audit.types.ts` — `subscription.redeemed` / `.activated` /
  `.expired`, entity type `household_subscription`.
- `scripts/create-redeem-codes.ts` + the `redeem:create` npm script.

New endpoints: `POST …/redeem-codes/preview`, `POST …/redeem-codes/redeem`.

### Frontend

- `packages/core/src/shared/api/http.ts` — `ApiError` carries `premium`.
- `packages/core/src/features/billing/model/redeem-code-format.ts` — the
  client-side copy, for catching a typo without a request.
- `packages/core/src/features/billing/hooks/use-redeem-code.ts` — the whole
  state machine.
- `packages/core/src/features/billing/api/billing.repository.ts` — preview and
  redeem.
- `packages/core/src/i18n/resources.ts` — a `billing` namespace plus
  `settings.billing.plan*`, both languages.
- `web/src/features/billing/ui/redeem-code-form.tsx`, `subscription-page.tsx`,
  routed at `/settings/subscription`; the Settings card links to it.
- `mobile/src/features/billing/ui/redeem-code-form.tsx`,
  `mobile/app/subscription.tsx`, reached from the Gia đình tab.

## Key decisions

- **Preview is a separate call.** A spent code cannot be recovered and codes are
  typed off a Zalo screenshot. The preview also names the household, which is
  what saves someone who belongs to two of them.
- **Codes are stored in plaintext, deliberately.** Support has to read a code
  back when a customer loses the message. It is not a password: one leaked code
  is worth 39k, `maxRedemptions` caps the damage, and brute force is answered by
  entropy plus rate limiting — hashing would slow an attacker over HTTP by
  nothing.
- **Crockford Base32**, with `O→0`, `I/L→1`, `U→V` folding **on the body only**.
  The prefix `OURS` contains two of those letters — see the bug below.
- **The checksum is UX, not security**: one mistyped character is caught
  client-side 31 times in 32, costing no request and no rate-limit attempt.
- **Race safety is three database barriers**, not app-level `if`s: a conditional
  UPDATE claims the slot, a unique index on (code, household) stops a second
  redemption, and `SELECT … FOR UPDATE` on the subscription row stops two grants
  extending from the same starting point. `withAdvisoryLock` was **not** used —
  its own docs say "advisory only, not exactly-once", which is right for a cron
  and wrong for money.
- **A grant that changes nothing rolls the transaction back**, so the code is
  not spent. Verified: the code stays `active`, `0/1`.
- **No `@nestjs/throttler`.** Rate limiting rides on `CacheService.incr` — 10
  failures/hour, keyed by userId **and** householdId, fail-open. Vietnamese
  mobile IPs are heavily NAT-ed, so an IP key would block real people.
- **Only failures count**, so buying five codes at once is never penalised, and
  a preview never counts at all.
- **`invalid` covers every code-side failure** — missing, malformed, disabled,
  withdrawn. Only `expired` / `exhausted` / `already_used` differ, because
  someone holding a genuinely expired code needs to know that or they will
  retype it and conclude the app is broken.
- **Any member may redeem.** `@RequireHouseholdCreator()` guards the three
  operations that change *who is in the room*; redeeming only adds capability,
  for both people.
- **Admin is a CLI, not a UI.** Prisma Studio already covers lookups.

## Two bugs the tests caught

- **Normalization destroyed its own prefix.** Folding the whole string turned
  `OURS…` into `0VRS…`, so **no code would ever have matched**. Caught by
  "a generated code survives its own normalization". Fixed by folding the body
  only. This is exactly why the plan made specs mandatory here.
- **Schema drift, finally diagnosed.** `migrate dev` had been demanding a full
  database reset. Two separate causes: (1) migration `20260904090000` creates
  `cashflow_events_household_id_category_id_idx` but `schema.prisma` never
  declared it — `MoneyEvent` has the matching index, `CashflowEvent` did not;
  (2) **`_prisma_migrations` did not exist at all**, so Prisma saw all 73
  migrations as unapplied. Declared the index and baselined the history with
  `migrate resolve --applied`. `migrate status` now reports *"Database schema is
  up to date"*, and `migrate dev` works normally. No data was touched.

## Verification

```bash
cd backend && pnpm test          # 860 pass (39 new)
pnpm redeem:create -- --campaign=test --count=3 --grant=duration_days --days=30
```

One pre-existing failure remains in `vnstock-commodity.provider.spec.ts`,
confirmed to fail on `main` too.

Against a live server:

| Case | Result |
|---|---|
| Preview `ours-9syv-nrfq` typed by hand | normalized to `OURS9SYVNRFQ`, +30 days, names the household |
| Redeem, then redeem a second 30-day code | **stacks** 30 → 60 days |
| Same code twice (1 slot) | `409 exhausted` |
| Same code twice (50-slot campaign) | `409 already_used` |
| Expired code · bad checksum · unknown code | `409 expired` · `400 invalid` · `404 invalid` |
| Lifetime code | `expiresAt: null`, `isLifetime: true` |
| Any code after lifetime | preview `no_effect`; redeem refused and **the code stays unused** |
| **Two households, one 1-slot code, simultaneous** | exactly one wins; `1/1`, one receipt |
| Full flow: preview → redeem 90 days | Premium, `goals: null`, horizons `[7,30,60,90]`, journal entry written |

Rate limiting is unit-tested rather than live: Redis is not running locally and
Docker was unavailable, so the live run exercised the fail-open path instead —
which is itself the documented contract.

`cd frontend && pnpm verify` passes: build, copy check, design scale, eslint,
mobile typecheck, mobile lint.

## Copy

`check-copy.mjs` passes. Traps avoided: the submit button is **"Xem mã"**, never
"Kiểm tra" (`kiểm tra ngay` is banned); no `mua được` anywhere, which is matched
as a substring; expiry uses "Cần chú ý" rather than `cảnh báo`.

## Mobile app parity notes

- `use-redeem-code.ts`, the format helpers and every string are in
  `packages/core`.
- **Built for both platforms in this phase**: the redeem form and the
  subscription screen (`mobile/app/subscription.tsx`, outside the tabs — the bar
  stays at five).
- **Mobile shows prices but sells nothing.** No button to a payment page (App
  Store rules); the renewal line names the website in plain words. A code field
  is fine — entering one is not a transaction.
- The two kits differ: web `Button` takes `disabled`, mobile takes `loading` and
  never disables the primary action (§22.10). Web `StatusChip` takes children,
  mobile takes `label`. Both caught by `tsc`.

# Billing Phase 2 — redeem codes end to end ★ the phase that can sell

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-2-redeem-code/`
- **Status**: planned

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phase 1.

## What the task is

Activation codes: `OURS-XXXX-XXXX`, redeemed by a household to get Premium for
N days, until a date, or forever.

**This is the phase that makes money.** After it ships, selling works with no
gateway, no contract and no 2–4 week approval: post an offer → the buyer
transfers → check the banking app → run `pnpm redeem:create` → send the code on
Zalo. The same mechanism covers beta testers and referral rewards.

## Planned changes

### Backend

- `backend/prisma/schema.prisma` — enums `RedeemCodeStatus`, `RedeemGrantType`
  (`duration_days | until_date | lifetime`); models `RedeemCode` and
  `RedeemCodeRedemption`; relations on `Household` and `Profile`.
- `domain/redeem-code-format.ts` + `.spec.ts` — generate, normalize, checksum.
- `domain/extend-period.ts` + `.spec.ts` — the stacking rules.
- `redeem.service.ts` + `redeem.controller.ts` — `POST …/redeem-codes/preview`
  and `…/redeem`, both household-scoped.
- `subscription.service.ts` — `grantOrExtend()`, the only writer of
  `HouseholdSubscription`.
- `repositories/` — `claimRedeemCodeSlot()` as a conditional UPDATE.
- `entitlement.errors.ts` — `PremiumRequiredException` (402). Not needed for
  redeem itself, but Phase 3 depends on it and the two shared files it touches
  are better reviewed on their own.
- `backend/src/common/filters/http-exception.filter.ts` — forward the `premium`
  field (it currently only forwards `message` and `error`).
- `backend/src/common/audit/audit.types.ts` — `subscription.redeemed`,
  `subscription.activated`, `subscription.expired`; entity type
  `household_subscription`.
- `backend/scripts/create-redeem-codes.ts` + a `redeem:create` npm script.

### Frontend

- `packages/core/src/shared/api/http.ts` — `ApiError` carries `premium`.
- `packages/core/src/features/billing/model/redeem-code-format.ts` — a ~20 line
  copy of normalize + checksum for client-side validation. Specs live on the
  backend copy.
- `packages/core/src/features/billing/hooks/use-redeem-code.ts` — the whole
  state machine: normalize → preview → confirm.
- `web/src/features/billing/ui/redeem-code-form.tsx`,
  `web/src/features/billing/ui/subscription-page.tsx`, route
  `/settings/subscription`.
- `mobile/src/features/billing/ui/redeem-code-form.tsx`,
  `mobile/app/subscription.tsx`, reached from the Gia đình tab.
- `packages/core/src/i18n/resources.ts` — a `billing` namespace, `vi` and `en`.

## Key decisions

- **Preview is a separate call from redeem.** People type codes off a Zalo
  message and mistype them; a code, once spent, cannot be recovered. Preview
  also shows the **household name**, which is what saves someone who belongs to
  two households from redeeming into the wrong one. Same shape as the existing
  invite preview.
- **Codes are stored in plaintext, on purpose.** Support has to be able to read
  a code back when a customer loses the message. This is not a password: one
  leaked code is worth 39k and `maxRedemptions` caps the damage. Brute force is
  answered by entropy + rate limiting, not hashing — hashing slows an attacker
  over HTTP by nothing.
- **Crockford Base32** (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`): no `I`/`L`
  (confusable with 1), no `O` (with 0), no `U` (avoids accidental words).
  Normalization maps `O→0`, `I/L→1`, `U→V`, so someone typing what they *see*
  in a screenshot still matches. **This is the single most important detail for
  Vietnamese users copying a code by hand.**
- **The checksum is for UX, not security.** One mistyped character is caught
  client-side 31 times out of 32 — no request, and no rate-limit attempt burned.
- **No `@nestjs/throttler`.** A dependency, a global module and a Redis store
  for exactly one endpoint. Rate limiting rides on `CacheService.incr()` from
  Phase 1 instead: 10 **failures** per hour, keyed by `userId` (Vietnamese
  mobile IPs are heavily NAT-ed — keying by IP would block real people), and
  fail-open when Redis is down.
- **Race safety is a conditional UPDATE, not `withAdvisoryLock`.** That helper's
  own docs say it is "advisory only … not exactly-once" — fine for a cron, not
  for money. `redemption_count < max_redemptions` inside the WHERE clause makes
  Postgres do it. `@@unique([redeemCodeId, householdId])` is the second barrier,
  and `SELECT … FOR UPDATE` on the subscription row is the third (without it,
  two codes redeemed at once both read the old `currentPeriodEnd` and one grant
  is lost).
- **`'invalid'` covers every code-side failure** — nonexistent, malformed,
  disabled, deleted. Only `expired` / `exhausted` / `already_used` differ,
  because someone holding a genuinely expired code needs to know that, or they
  will retype it and conclude the app is broken. An attacker only sees those
  three after already guessing a real code.
- **Extension never loses a day and never shortens.** `base = max(periodEnd,
  now)`; an `until_date` code that lands earlier than the current expiry changes
  nothing (otherwise a gift becomes a penalty); lifetime absorbs everything
  after it and preview says so **without spending the code**.
- **Any member can redeem, not just the creator.**
  `@RequireHouseholdCreator()` guards three operations that change *who is in
  the room*. Redeeming only adds capability for both people. Making one partner
  wait for the other to open the app is friction for nothing — the journal
  records who did it.
- **Admin is a CLI script, not a UI.** Prisma Studio already covers lookups. An
  admin page needs its own route, auth and gate — hundreds of lines for
  something a terminal command does in five seconds.

## Verification

```bash
cd backend && pnpm test -- extend-period redeem-code-format
pnpm redeem:create -- --campaign=test --count=3 --grant=duration_days --days=30
```

- Typing `OURS-O1I2-3456` (with letter O) still matches code `OURS01123456`.
- Redeem → "Premium đến ngày X" appears without a refresh.
- The same code again → `already_used`.
- Ten wrong codes in a row → 429.
- Redeeming a second code while Premium **stacks**, never resets.
- A lifetime code → `expiresAt: null`, `isLifetime: true`; any code after it →
  preview says already lifetime and **does not consume it**.
- `cd frontend && node web/scripts/check-copy.mjs && pnpm verify`

## Copy traps

`pnpm lint` fails the build on banned vocabulary. For this phase specifically:

- **`"mua được"` is matched as a substring** — "chưa mua được", "sẽ mua được"
  both fail.
- **`"kiểm tra ngay"` is banned** — do not label the button "Kiểm tra"; use
  **"Xem mã"**.
- **`"cảnh báo"` is banned in context** — for an expiring plan say **"Cần chú
  ý"**.
- The subject is **"gia đình"**, not "bạn", matching `nav.household`.

## Mobile app parity notes

- `use-redeem-code.ts`, the format helpers and every string are in
  `packages/core`.
- **Built in this phase for both platforms**: the redeem form and the
  subscription screen (`mobile/app/subscription.tsx`, outside the tabs — the bar
  stays at five).
- **Mobile shows status and takes codes, but never sells.** No button linking to
  a payment page: Apple rejects apps that link out to purchase. A code field is
  fine — it is not a transaction.

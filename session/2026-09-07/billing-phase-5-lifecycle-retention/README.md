# Billing Phase 5 — lifecycle and retention

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/billing-phase-5-lifecycle-retention/`
- **Status**: done (referral deferred — see below)

> Part of the freemium plan. Full reasoning:
> `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`. Depends on Phases 1–4.
> Backend nghiệp vụ now lives in `backend/memory/billing-and-entitlement.md`
> and `backend/memory/data-export.md`.

## What the task is

What happens after the sale: expiry, the nudge to renew, order history, data
export, and referrals. Without this a plan lapses silently and the household
finds out by hitting a wall.

## Changes made

### The expiry sweep

- `backend/src/modules/billing/billing-expiry.cron.ts` — **new**. 09:00
  Asia/Ho_Chi_Minh, `BILLING_EXPIRY_CRON_ENABLED` kill switch,
  `withAdvisoryLock`, an in-process `running` flag, and a batch limit
  (`BILLING_EXPIRY_BATCH_LIMIT`, default 500). Two independent halves in one
  sweep; either can fail without aborting the other.
- `backend/src/modules/billing/repositories/billing.repository.interface.ts`
  and `prisma-billing.repository.ts` — `expireLapsedSubscriptions` (returns the
  households it touched, so the cache invalidation is exact rather than a
  guess) and `expireStalePaymentOrders`. Both are a single
  `UPDATE … WHERE id IN (SELECT … LIMIT … FOR UPDATE SKIP LOCKED) RETURNING`.
- `backend/src/modules/billing/billing.module.ts` — registers the cron.
- `backend/src/modules/billing/billing-expiry.cron.spec.ts` — **new**, 10 tests.

The schema already carried both indexes (`@@index([tier, currentPeriodEnd])`,
`@@index([status, expiresAt])`) from Phases 1 and 4, so **no migration**.

### The renewal nudge

- `backend/src/modules/attention/domain/attention-rules.ts` — new derived rule
  `plan_expiring_soon` plus `ATTENTION_THRESHOLDS.planExpiringSoonDays: 14`.
- `backend/src/modules/attention/attention.service.ts` — reads the entitlement
  in the existing `Promise.all` fan-out (a cache read in the common case) and
  maps it to the rule's input.
- `backend/src/modules/attention/attention.module.ts` — imports `BillingModule`.
  Safe: `BillingModule` imports nothing but `CommonModule`, and `ForecastModule`
  already depends on it the same way.
- Specs updated; 7 new tests for the rule.

### Order history

- `frontend/packages/core/src/features/billing/hooks/use-payment-orders.ts` —
  **new**. Reads `queryKeys.paymentOrders`, which Phase 1 added and the payment
  return page already writes into.
- `frontend/web/src/features/billing/ui/order-history.tsx` — **new**.
- `frontend/web/src/features/billing/ui/subscription-page.tsx` — renders it.
- i18n: `settings.billing.orders.*` in both `vi` and `en`.

The backend endpoint (`GET …/payments/orders`) already existed from Phase 4 —
only the UI was missing.

### Data export

- `backend/src/modules/export/` — **new module**: `domain/csv.ts`,
  `export.service.ts`, `export.controller.ts`, `export.module.ts`, and a
  repository. JSON (everything, one file) and CSV (one dataset per file).
- `backend/src/modules/money-space.module.ts` — registers it.
- `frontend/packages/core/src/shared/api/http.ts` — `apiFileRequest`, a sibling
  of `apiRequest` that returns a Blob.
- `frontend/packages/core/src/features/export/` — **new**: repository + the
  `useExportData` hook.
- `frontend/web/src/features/settings/ui/components/data-card.tsx` — the export
  button existed and did nothing; it is now wired.
- i18n: `settings.data.exporting` / `exportFailed` in both languages.
- 25 new tests.

### Quota warnings and the what-if gate (added after review)

A review of the shipped UI found two gaps that Phase 3 ("bật gate") left behind:
what-if was not gated on the client at all, and no screen showed a quota before
it was hit.

- `frontend/packages/core/src/features/billing/hooks/use-quota.ts` — **new**. A
  read-only counterpart to `usePremiumAction`, whose `check()` opens the paywall
  as a side effect and so cannot be called during render.
- `frontend/packages/core/src/features/whatif/hooks/use-whatif.ts` — now gates
  through `usePremiumAction` and invalidates the entitlement key `onSettled`.
  Gated in the hook rather than the sheet so both callers (first run, and the
  re-run with an asset sale) are covered, and so mobile inherits it.
- `frontend/web/src/features/whatif/ui/whatif-sheet.tsx` — quota line above the
  run button; `handleApplySale` no longer closes the funding step when the
  paywall opened instead of running.
- `frontend/web/src/features/goals/ui/goals-page.tsx` — `2/2 mục tiêu` beside
  the create button, at the ceiling only.
- i18n: `whatif.quota.*` and `goals.quota.used`, both languages.

**Counts show only at the ceiling** (`isLastOne` / `isExhausted`). Counting from
1/5 on an empty page turns a tool for thinking into a meter.

The auto-price quota was the third gap, and fixing it meant removing behaviour
rather than adding a warning. `setAutoPrice` used to swap at the ceiling: it
moved automation off the oldest asset and returned `turnedOff` so the UI could
name it — except no screen ever did, so an asset the household had chosen
silently stopped updating and looked broken.

The whole control is now gone. Automation is decided when an asset is created:
under the ceiling it lands automatic, over it lands manual with the "Cập nhật
tay" chip, and making room means deleting an asset they no longer hold. Deleted
with it: the `PATCH :assetId/auto-price` route, `AssetsService.setAutoPrice`,
and `setAutoPriceEnabled` / `findAutoPricedAssetIds` in the repository.
`AutoPriceRow` is now a statement, not a switch.

**Free `marketPricedAssets` also drops from 2 to 1.** One is enough to show what
automation feels like, and a household holding both gold and stocks meets the
ceiling on their second asset — which is where the value of automating is
easiest to see. It is one number in `plan-limits.ts`; every client reads it from
the server, so no copy hardcodes it.

Found but **not** changed: `forecast.service.ts` spends a what-if slot on every
successful run, so exploring one question through the asset-sale funding step
can cost three of five. Defensible (each run is a real engine execution) but
invisible until the UI started counting — written up in
`backend/memory/billing-and-entitlement.md` rather than fixed, since charging
per question needs a scenario id the API does not have.

## Key decisions

- **The cron runs at 09:00 Asia/Ho_Chi_Minh**, not 23:45 like the valuation job.
  A notice has to land when people are awake.
- **Reminders go through the existing `attention` module — no new
  infrastructure.** There is still no email service and no push channel in the
  repo. `AttentionService` already derives items the same way, so an expiring
  plan costs nothing to add. Email waits until there is an independent reason
  to build it.
- **Expiry keeps `tier: premium` and only flips `status`.** Same reasoning as
  the trial in Phase 3: it lets the UI say "hết hạn ngày X" rather than "gia
  đình đang dùng gói Free", which is the difference between a win-back and a
  shrug. `resolveEntitlement` still resolves Free limits.
- **Lifetime is never touched by the cron** — `currentPeriodEnd IS NULL` falls
  outside `WHERE currentPeriodEnd < now()` naturally, with no special case.
- **`plan_expiring_soon` is `important`, never `urgent`.** Nothing is lost when
  a plan lapses — the household keeps every record and only the automation
  stops. `urgent` is reserved for the household running out of money; putting a
  billing reminder at that weight would be selling, not helping.
- **An already-lapsed plan raises no attention item.** The subscription page
  states it in full; repeating it on Home would nag about something Home cannot
  fix.
- **A failed cache invalidation in the cron is logged, not retried.** The row is
  already flipped and `resolveEntitlement` re-checks the period on every read,
  so the cost is a stale entry until TTL — never Premium nobody paid for.
- **The export needs `@RawResponse()`.** A downloaded file has to *be* the file;
  the standard `{ success, data }` envelope would make the CSV unopenable.
- **CSV carries a UTF-8 BOM and neutralises formula-leading cells.** Without the
  BOM, Excel on Windows renders "Tiền điện" as mojibake — and Vietnamese names
  are the point of the file. Without the tab prefix, a note beginning `=`
  executes on open.
- **`ExportModule` imports no domain module.** An export is one read across every
  table; hanging it off Assets would put a cross-domain read inside a module
  that owns one of them.
- **Turning off `BILLING_LIFETIME_ENABLED` stops new sales only.** Households
  that already bought keep it forever. Worth watching: market-data API cost runs
  indefinitely against a single payment, so capping sales by flipping that
  config once a target is met is the lever.

## Deliberately not done

- **Referral** (marked *optional* in the plan). It is a growth feature, not a
  lifecycle one, and it needs a decision this phase cannot make on its own: what
  a referrer gets, and whether a referred household's own code can stack. The
  redeem-code machinery it would use (`campaign`, `maxRedemptions`) already
  exists from Phase 2, so it stays a small, self-contained follow-up.
- **Rendering attention items on the web.** `AttentionItem` is typed in core but
  no screen lists them yet — a pre-existing gap, not one this phase introduced.
  The backend signal is complete and appears in `GET /attention-items` today;
  whatever eventually renders attention items will pick it up with no backend
  change, and it will need copy keyed by `ruleCode` when it does.

## Verification

Run from `backend/`:

```bash
npx jest src/modules/billing src/modules/attention src/modules/export
```

- 947 of 948 backend tests pass. The one failure
  (`vnstock-commodity.provider.spec.ts`, gold price names) **pre-exists** —
  confirmed identical with these changes stashed, and market-data was not
  touched.
- `pnpm build` (the frontend typecheck gate, covering `packages/core`) passes.
- `pnpm lint` reports 0 errors; the 13 warnings are all in files this phase did
  not touch. The banned-copy check passes on the new Vietnamese strings.

Still to check by hand, against a real database:

- Set a household's `currentPeriodEnd` into the past, run the cron → `status:
  'expired'`, entitlement drops to Free limits, attention item appears.
- A lifetime household is untouched by the same run.
- A `pending` order past `expiresAt` becomes `expired`; a `paid` one does not.
- Run the cron twice concurrently → the advisory lock means the work happens
  once.
- Open a CSV export in Excel on Windows and confirm Vietnamese renders.

## Metrics this phase finally makes answerable

Moved to `backend/memory/billing-and-entitlement.md` so it lives with the rest
of the billing nghiệp vụ rather than in a session log. The short version: none
of it is answerable without analytics, which is still not in the repo, and no
price should be A/B tested before ~100 real households.

## Mobile app parity notes

- **The attention item needs nothing.** It is derived on the backend and will be
  rendered by whatever renders attention items — on both clients at once.
- **The what-if quota gate needs nothing.** It lives in `useWhatIf` in
  `packages/core`, so the mobile sheet is gated the moment it next builds.
  `useQuota` is also core and platform-neutral; only the two lines of markup
  that render it are web-side.
- **To port**: the order-history section, onto `mobile/app/subscription.tsx`.
  `usePaymentOrders` is already in `packages/core`, so the port is UI only.
- **Export is web-first and should NOT be ported as-is.** `useExportData` calls
  `document.createElement('a')` and `URL.createObjectURL`, neither of which
  exists on Hermes. A mobile version wants `expo-file-system` plus the share
  sheet, and is out of scope for this phase. The repository
  (`features/export/api/`) is platform-neutral and can be reused.
- `apiFileRequest` lives in `packages/core/src/shared/api/http.ts` and uses only
  `fetch` + `Blob`, so it is safe on mobile.

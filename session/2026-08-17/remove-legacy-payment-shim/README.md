# Remove the legacy payment compat shim

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/remove-legacy-payment-shim/`
- **Status**: done

## What the task is

The user asked whether the "cash flow" and "money event" tabs should be merged,
since both feel like "creating an event". The answer was **no** — they are the
same shape but different *tense*: a cashflow event is an **expectation** (the
sole input to the forecast), a money event is a **fact** (the ledger). Merging
them would collapse the Clarity → Foresight split the product is built on.

That discussion surfaced the real cause of the felt overlap: the Phase 5
transitional compat shim, which made `/events` render cashflow events as
pre-v3.1 "upcoming payments" in the same timeline as recorded events. The user
then asked to remove the shim.

## Changes made

**Deleted**

- `src/features/cashflow/hooks/use-payments-compat.ts`
- `src/features/cashflow/model/legacy-payment-shim.ts`
- `src/features/events/ui/components/upcoming-record-form.tsx`

**`/debts` — read `CashflowEvent` directly** (behaviour unchanged)

- `hooks/use-debts-page.ts`, `hooks/use-debt-detail.ts` — `usePaymentsCompat()`
  → `useCashflowEvents({ direction: 'outgoing', status: 'live' })`.
- `ui/debt-detail-page.tsx` — dropped the `paymentDate()` helper (it only chose
  between `dueDate` / `due`, two aliases of one field); now `expectedDate`.
- `ui/components/{debts-summary-strip,debts-insights-section,debts-list-section,debt-list-item}.tsx`
  — `LegacyPaymentItem` → `CashflowEvent`; `amountValue` → `amount`,
  `dueDate ?? due` → `expectedDate`.
- `debts-insights-section.tsx` — added a `readiness()` helper deriving
  ready/priority/awaiting from `attentionLevel` + `status`, replacing the legacy
  `important | normal | pending` triple.

**`/events` — now a pure ledger**

- `hooks/use-events-page.ts` — removed the upcoming half: the merged timeline,
  the upcoming form + schema, `markPaid`, `postponePayment`,
  `togglePaymentAttention`, and the upcoming-in-30-days summary figures.
- `ui/events-page.tsx`, `ui/components/{events-timeline-card,record-card,event-form-dialog,actual-record-form}.tsx`
  — dropped the "upcoming" tab, the upcoming branch of the row dropdown, the
  "link to an upcoming payment" select, and the mark-paid banner.
- `ui/components/quick-action-picker.tsx` — the "upcoming" entry is **kept** but
  now navigates to `/upcoming` via a new `onPlanUpcoming` prop, the same pattern
  `debt_borrow` / `sell_asset` already used.
- `model/events-form.ts` — deleted `LocalUpcomingPayment`, `UpcomingRecordForm`,
  `upcomingDefaults`, `buildUpcomingSchema`, `toUpcomingPaymentSeed`,
  `arePaymentsEqual`, `getPaymentAttentionLevel`, `getPaymentRecordStatus`,
  `getUpcomingDescription`; removed every `sourceType === 'upcoming_payment'`
  branch and the `sourceType` field itself.
- **Renamed `upcomingPaymentId` → `cashflowEventId`** across the events slice to
  match the backend (its DTO accepts both and prefers `cashflowEventId`).
- `i18n/resources.ts` — removed now-dead keys in both `vi` and `en`
  (`upcomingChanges`, `types.upcoming`, `history.status.*`, `actions.paid`,
  `actions.postpone`, `markPaidFor`). `events.form.action.upcoming` is **kept**
  — the picker still renders it as a navigation entry.

## Key decisions

- **Do not merge the two tabs.** Cashflow event = expectation (forecast input,
  can be wrong, recurring = one record that advances). Money event = fact
  (ledger, immutable history). They are linked by an *action* (completing an
  expectation produces a fact), not by being two flavours of one thing.
- **Removing the shim from `/events` necessarily removes its "upcoming" tab.**
  This is a user-visible UX change, confirmed with the user before doing it. No
  capability is lost: `/upcoming` already has the timeline, the form, and the
  full complete/postpone/cancel lifecycle.
- **The old "mark paid" flow was a real bug, not just legacy framing.** It did
  `createEvent()` then `deletePayment()`. That bypassed the server-side
  completion transaction and, for a **recurring** event, deleted the entire
  series instead of advancing `expectedDate`. `/upcoming`'s
  `POST …/complete` (idempotency-guarded by `occurrenceDate`) is the correct
  path, so removing the flow fixed the bug.
- A `payment_paid` money event stays a valid type — only its coupling to a live
  cashflow event was removed. Its `superRefine` rule requiring a linked payment
  was deleted too: with the picker gone that validation could never be
  satisfied, so `payment_paid` would have failed submit unconditionally.
- `cashflowEventId` is **not** copied by `duplicateEvent` — only one money event
  can settle a given cashflow event.

## Verification

- `npx tsc -b --noEmit` — clean.
- `npm run build` — passes (includes the typecheck gate + banned-copy check).
- `npm run lint` — 4 errors, all pre-existing; the baseline on a clean tree is
  **5**, so this change removes one and introduces none. (Remaining ones are in
  `assets.repository.ts` and a `set-state-in-effect` on the pre-existing
  `setEvents` sync effect.)
- `grep` confirms zero remaining references to `legacy-payment-shim`,
  `usePaymentsCompat`, `LegacyPaymentItem`, `LocalUpcomingPayment`,
  `UpcomingRecordForm`, or `upcoming_payment`.

## Mobile app parity notes

- Port the same split: the ledger screen must not host expected movements, and
  must not implement "mark paid" as create-event + delete-payment. Call
  `POST /cashflow-events/:id/complete` with `occurrenceDate`.
- Port the `upcomingPaymentId` → `cashflowEventId` rename; the backend accepts
  both spellings, so this can land independently of a backend change.
- Derive row urgency from `attentionLevel` + `status`, never the legacy
  `important | normal | pending` triple.
- Keep an "upcoming" entry in the create picker if the mobile app has one, but
  wire it to navigate to the forecast screen rather than opening a form.

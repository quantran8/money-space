# Money events & upcoming payments (Events feature)

The central ledger. Recorded financial events **and** upcoming payments live in one unified timeline. The old standalone Payments page now **redirects to `/events`**. Related: [[assets]], [[debts]], [[goals]], [[dashboard]].

## Overview

Two record source types unified into `FinancialRecordItem`:
- `upcoming_payment` — planned.
- `money_event` — actual, the central transaction log.

`MoneyEvent` fields: title, type, category, amount, currency, eventDate, direction, and optional links to fromAsset, toAsset, upcomingPayment, debt, financialGoal, snapshot.

**`category` is a free-form CODE**, not a fixed enum — backed by the
`money_event_categories` table (seeded system rows with `household_id IS NULL` +
per-household custom rows). Adding a category is a data insert, not a schema
change. Existence is validated on the backend; `normalizeMoneyEventCategory` keeps
any non-empty code (falls back to `other` only when blank). The `interest` code
(saving-deposit interest events) is a seeded system category — the old enum
omitted it, so it was silently rewritten to `other` (fixed).

## Direction derivation (`deriveDirection` / `getDirectionFromEventType`)

Auto-derived from event type unless explicitly overridden (explicit wins):
- income → `inflow`
- expense, payment_paid, debt_update → `outflow`
- adjustment → `neutral`
- else → `neutral`

`adjustment` is used by a debt **balance reconcile** ([[debts]]): a neutral,
debt-linked bookkeeping event that records the outstanding delta **without moving
a wallet or auto-reducing the debt** (both are outflow-gated). An additional
disbursement instead reuses `debt_update` with explicit `direction: 'inflow'`.

## Per-event-type link rules (`.superRefine` in `buildActualSchema`)

- **Requires a source asset** (`eventRequiresFromAsset`): expense, transfer, payment_paid, goal_contribution, asset_purchase, asset_sale.
- **Requires a destination asset** (`eventRequiresToAsset`): income, transfer, asset_purchase, asset_sale.
- **from ≠ to** for transfer / asset_purchase / asset_sale.
- `payment_paid` **must link** to an upcoming payment.
- `goal_contribution` **must link** to a goal.
- Amount must be **> 0**.

## Upcoming payments

- `UpcomingPayment`: name, amount, dueDate, frequency, `autoCreateNext` flag, owner member, optional `debtId` link, status, attention level/flag.
- **Payment status state machine** (`PaymentStatus`): unpaid → paid / pending_confirmation / postponed / overdue.
- **Status derivation** (`getPaymentRecordStatus`): past due date → `overdue`; pending → `pending_confirmation`; else `unpaid`.
- **Recurring rule** (`buildUpcomingSchema`): `autoCreateNext` can only be enabled when `frequency ≠ once`. Recording a payment captures `paidAt`, `paidBy`, `paidAmount`, `paidFromAssetId`.

## Recording a repayment reduces the linked debt

Marking a debt-linked upcoming payment as paid ("Đánh dấu đã trả" on a "Tra no: ..." reminder) must reduce that debt's remaining balance:

- **Frontend** (`onSubmitActual` in `use-events-page.ts`): the `payment_paid` event payload copies the paid payment's `debtId` (via `relatedPayment.debtId`). The `LocalUpcomingPayment` type + `toUpcomingPaymentSeed` mapper carry `debtId` through from the API.
- **Cache**: `useEvents` create/update/delete mutations invalidate the **debts** query (plus events + dashboard) so the debts view refetches the new outstanding.
- **Where the balance actually changes**: the **backend** decrements `outstandingAmount` by the event amount, floored at 0, in the same transaction as the event insert — only for debt-linked **outflow** events (the borrow inflow is excluded). See [[debts]] and the backend memory. The frontend does not compute the new outstanding itself.

## Selling an asset (`asset_sale`)

A sale is a single `asset_sale` money event (`direction = neutral`), created from the assets-list "Bán" action (primary) or the events quick-action "Bán tài sản" (secondary, navigates to `/assets`). The frontend posts: `amount` = gross proceeds, `feeAmount` = fee, `fromAssetId` = sold asset, `toAssetId` = receiving wallet, plus `soldQuantity` (market assets) / `soldValue` (manual assets — the resolved amount that left the position; a "bán toàn bộ" sends the current quantity/value). The **backend** credits the wallet net (`amount − feeAmount`), reduces the sold asset's position, and on a full sale sets the asset `status = 'sold'`. The events mutations invalidate the **assets** query so the reduced position/status shows. Full rules: [[asset-sale]].

## Timeline grouping (`getTimelineGroupKey`)

Upcoming payments → "upcoming"; else by date → today / this-week / this-month / older. Week is Mon–Sun. Uses hardcoded `TODAY = '2026-07-08'` (see [[domain-overview]]).

## Attention rule (`isAttentionRecord`)

Flagged if `isAttentionNeeded`, OR level important/urgent, OR status overdue / pending_confirmation / postponed.

## Where it lives in code

- **frontend-web**: `src/features/events/{model/events.ts, model/events.types.ts, model/events-form.ts, model/events-month.ts, api/events.repository.ts, hooks/...}`. Legacy: `src/features/payments/model/` (due-bucket logic `PaymentGroupKey = overdue|next7|next30|later`).
- **backend**: `src/modules/money-events/`, `src/modules/payments/` (separate modules).
- **mobile-app**: to be ported.

## Enums

`RecordType` (10 event types: expense, income, transfer, asset_purchase, asset_sale, asset_update, payment_paid, goal_contribution, debt_update, adjustment/other), `RecordDirection = inflow | outflow | neutral`, `RecordStatus = unpaid | paid | overdue | recorded | pending_confirmation | postponed`, `MoneyEventStatus = recorded | pending_confirmation | cancelled`, `frequency = once | weekly | monthly | quarterly | yearly`, `AttentionLevel = normal | important | urgent`.

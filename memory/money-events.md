# Money events & upcoming payments (Events feature)

The central ledger. Recorded financial events **and** upcoming payments live in one unified timeline. The old standalone Payments page now **redirects to `/events`**. Related: [[assets]], [[debts]], [[goals]], [[dashboard]].

## Overview

Two record source types unified into `FinancialRecordItem`:

- `upcoming_payment` — planned.
- `money_event` — actual, the central transaction log.

`MoneyEvent` fields: type, category, amount, currency, eventDate, direction, `note` (description), and optional links to fromAsset, toAsset, upcomingPayment, debt, financialGoal, snapshot.

**No `title` field.** The free-text `title` was dropped from money events — the
**note** is now the descriptive label and `category` is the classification. The
record form no longer has a "Nội dung" field; the note carries the description
(the form auto-fills a sensible note for transfer / goal_contribution /
payment_paid when the user leaves it blank, e.g. `Chuyển từ … sang …`, `Đã trả
…`). Everywhere the UI used to show `title` (events timeline / `record-card` /
data table, dashboard recents, debt & asset history rows) it now shows the note,
falling back to the translated category label when the note is empty. The
timeline's `FinancialRecordItem` keeps a derived `title` (payment name for
upcoming payments; note-or-category for events) purely as the display label — it
is not a stored event field.

**`category` is REQUIRED and a free-form CODE**, not a fixed enum — backed by the
`money_event_categories` table (seeded system rows with `household_id IS NULL` +
per-household custom rows). Adding a category is a data insert, not a schema
change. It is mandatory: the record form requires the "Danh mục" picker for
expense/income (`buildActualSchema` superRefine — the auto-classified types
derive it), and the backend rejects a blank category with a 400.
`normalizeMoneyEventCategory` keeps any non-empty code (falls back to `other`
only for internal auto-classified flows). The `interest` code
(saving-deposit interest events) is a seeded system category — the old enum
omitted it, so it was silently rewritten to `other` (fixed).

**Category UI (not free-text).** The record form's "Danh mục" field is a
`<Select>` bound to the category **code**, sourced from the
`money_event_categories` table via `useEventCategories` → `categoryOptions` in
`use-events-page.ts` (system rows + this household's custom rows). The **display
label always follows the user's language via the code**:
`t('options.eventCategory.<code>', { defaultValue: dbLabel })` — the DB `label` is
only a fallback for custom codes with no i18n key. Households manage their own
categories (add / edit label / delete) from the **Settings page**
(`settings/ui/components/categories-card.tsx`); system rows are read-only. Backend
CRUD lives at `/api/households/:id/money-event-categories`
(GET = any member, POST/PATCH/DELETE = `edit` capability). The **code is
immutable** on update — renaming would orphan events pointing at it; create a new
category and re-tag instead.

**Default category (`isDefault`).** A household can mark **one** category as its
default; the create form auto-selects it (`defaultCategoryCode` memo in
`use-events-page.ts` prefills `category` on the create reset). Each
`EventCategoryItem` carries `isDefault` (computed by the backend from the
household's config pointer — works for system OR custom codes; see backend
memory). The Settings → Categories card (`categories-card.tsx`) shows a **star
toggle** per row: clicking sets that code as default (clearing the previous),
clicking the current default clears it — via `PUT
/money-event-categories/default` with `{ code }` / `{ code: null }`
(`setDefaultEventCategory` → `useEventCategories().setDefaultCategory`).

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

### goal_contribution requires a wallet source (and debits it)

A `goal_contribution` moves cash from a spendable wallet **into a savings goal**
([[goals]]). Its `fromAssetId` is **mandatory** and must be a cash / bank_account
asset — the backend rejects a missing / non-wallet source with a **400** on
create + update, then **debits** that wallet (money leaves the pocket). The goals
page sends `fromAssetId = contributionSources[goalId]` from `addContribution`
(`use-goals-page.ts`) — a wallet chosen **per contribution** in the quick-add
row's required picker (the goal stores no source wallet). `direction` stays
`neutral`, so it debits a wallet without counting as thu/chi (like a transfer).
Fixes the old bug where a contribution raised progress with no money moving.

### Wallet-only link rule (income / expense / transfer)

For **income, expense, transfer** every linked asset (source `fromAssetId` and,
where present, destination `toAssetId`) must be a spendable **wallet** — `cash`
or `bank_account` only. Money only flows in/out of a free cash balance; a valued
asset (gold, stock, saving deposit, …) changes hands through its own flow (sell /
revalue), never a generic cash move.

- **Frontend**: `useEventsPage` builds `sourceAssetOptions` (assets filtered to
  cash / bank_account) alongside the full `assetOptions`. The events forms use
  `sourceAssetOptions` for the "nguồn tiền" source select (`fromAssetId`,
  `expectedFromAssetId`) **and** the income/transfer destination select
  (`toAssetId`). Only goal_contribution's destination still lists all assets.
  Default source/destination selection also seeds from `sourceAssetOptions`.
- **Backend** enforces the same as a **400** (`assertWalletLinks`, gated by
  `WALLET_ONLY_EVENT_TYPES = {income, expense, transfer}`) on create + update.
- **`asset_sale` is the exception**: its `fromAssetId` is the _sold_ asset (a
  non-wallet), so it is excluded. The sold asset is **view-only** — asset_sale
  edits via the dedicated `AssetSaleDialog`, where the sold asset is fixed
  context (header only, never a form field), so it can be seen but not changed.

## Monthly summary (thu / chi / net) — backend is source of truth

The events page summary card's **Tổng thu / Tổng chi / Net** come from the
backend, **not** re-computed on the client. `useEventsSummary` calls
`GET /api/households/:householdId/money-events/summary?month=YYYY-MM` →
`{ recordedCount, totalIncome, totalOutcome, netChange }`.

- Only `inflow` / `outflow` events count; `neutral` (asset_update, transfer,
  goal_contribution, sale bookkeeping) are excluded server-side. A `neutral`
  event can still move a wallet balance (transfer, and now goal_contribution,
  debit a wallet) — neutral means it doesn't change the household's total money,
  so it stays out of thu/chi even when a wallet balance changed.
- `use-events-page` feeds these into the `summary` object (defaults to 0 while
  loading). `upcomingIn7Days*` and `attentionCount` stay client-derived from the
  payments / timeline lists (the summary endpoint doesn't cover them).
- Query key `['households', id, 'events', 'summary', month]`. Event
  create/update/delete invalidate the `['households', id, 'events']` prefix so
  both the list and the summary refetch.

## Upcoming payments

- `UpcomingPayment`: name, amount, dueDate, frequency, `autoCreateNext` flag, owner member, optional `debtId` link, status, attention level/flag.
- **Payment status state machine** (`PaymentStatus`): unpaid → paid / pending_confirmation / postponed / overdue.
- **Status derivation** (`getPaymentRecordStatus`): past due date → `overdue`; pending → `pending_confirmation`; else `unpaid`.
- **Recurring rule** (`buildUpcomingSchema`): `autoCreateNext` can only be enabled when `frequency ≠ once`. Recording a payment captures `paidAt`, `paidBy`, `paidAmount`, `paidFromAssetId`.
- **Source wallet required** (`buildUpcomingSchema`): `expectedFromAssetId` is required ("Vui lòng chọn ví nguồn"). It's an always-visible field in `upcoming-record-form.tsx` (not inside the "Thêm chi tiết" collapsible) and defaults to the first wallet on open.

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

# Debts / liabilities

Loans the household still owes, with repayment estimation. Related: [[money-events]], [[assets]], [[snapshots-and-networth]].

## Overview

CRUD over `Debt` (name, **lenderType**, lenderName, original/outstanding amount, borrowedAt, expectedFinalDueDate, status, owner member, optional `receivedToAsset` link).

## Lender type — the single classification (drives repayment rules)

A debt is classified by **one** field, `lenderType`, with three values (the old dual `debtType` + `lenderType` was collapsed; `debtType` is gone). `isFixedScheduleLender(lenderType)` (`model/debts.types.ts`) is the single predicate the rules key on:

- **`bank_institution`** — a *fixed-schedule* loan. The form (`buildDebtSchema` `superRefine`) **requires** an interest rate (interest switch on + a stage rate), an `expectedFinalDueDate` (its term), and a positive `fixedPaymentAmount`; the backend enforces the same via `assertLenderTerms` (400 otherwise). The fixed monthly payment can't be changed by editing the linked repayment money event — the backend **locks** those events (edit/delete → 400); update the debt record to change the schedule.
- **`relative`** / **`other`** — interest and a fixed term are **optional**. When the user sets an amount + schedule, editing a repayment money event rebalances the next unpaid installment by the over/under-payment (backend `applyDebtRepaymentEffects`): **overpay → next installment shrinks; underpay → it grows** (total owed & installment count unchanged).

The quick-pick chips (`quickLenderTypes`) and the "Loại khoản vay" select both map 1:1 to these three `lenderType` values. UI labels: Người thân / Ngân hàng · Tổ chức / Khác.

## Key invariant: borrowing does not inflate net worth

A debt links to the asset that received the money (`receivedToAssetId`). Borrowing raises an asset **and** a debt equally → **net worth unchanged**. See [[domain-overview]].

**`receivedToAssetId` can only be a spendable wallet — `cash` or `bank_account`.** Borrowed money lands in a wallet, never in a valued asset (gold, stock, savings…). The create/edit form's "Nhận nợ vào đâu?" select filters assets to these two types (same rule the events page applies to its "nguồn tiền" source select). The create default seeds from the first such wallet.

## Repayment terms live on the `debts` row

**Repayment terms are columns directly on `debts`** (folded in from the former
`debt_terms` table, which was a 1:1 singleton — backend migration
`..._fold_debt_terms`): `payment_frequency`, `fixed_payment_amount`,
`minimum_payment_amount`, `interest_type`, `interest_calculation`.
`repayment_type` / `has_interest` are derived on read. There is no
`upsertDebtTerms` / `DebtTerm` child table anymore — the only remaining child
table is `debt_interest_periods` (staged rates).

## Interest modeling

- **Interest stages**: a debt has one or more `InterestPeriod` (annual `ratePct` + `months`). An empty-`months` stage absorbs the remaining term. Stage length persists in the real `debt_interest_periods.term_months` column (previously smuggled into `note` as `"months:N"` — migrated to a real column).
- `monthsBetween` → term in months.
- `totalInstallments(frequency, termMonths)` = `round((termMonths/12) × periodsPerYear)`, min 1.
  - `periodsPerYear`: monthly = 12, quarterly = 4, yearly = 1, none = 0.
- `averageAnnualRate` = **term-weighted average** of the stage rates.

## Repayment estimation (`estimateRepayment`)

Two models (`InterestCalc = fixed | reducing`):

- **`fixed` (annuity)** — `PMT = P·r / (1 − (1+r)^−n)` (standard bank annuity); interest on the shrinking balance.
- **`reducing` (flat on principal)** — principal split evenly `P/n`; interest on outstanding. Returns the **first (largest)** installment as the conservative planning figure.
- **Zero-rate** → straight `P/n` split.

Backend enum bridge (`calcToBackendEnum`): `fixed → reducing_balance`, `reducing → flat_rate`. Stages serialize to/from `debt_interest_periods` DTOs.

## Backend interest enums (richer than frontend)

`DebtInterestCalculation = simple_interest | reducing_balance | flat_rate | custom`. Repayment terms are **columns on `debts`** (folded in from the dropped `debt_terms` table — see "Repayment terms live on the `debts` row" above). Remaining child table: `DebtInterestPeriod` (staged/floating/promotional rates over date ranges).

## Validation invariants (`buildDebtSchema`)

- original & outstanding both **> 0**.
- **outstanding must not exceed original.**

## Summary metrics

Outstanding total, active count, overdue count, monthly-planned repayment.

## Detail page + repayment history (frontend)

A debt has a dedicated **detail page** at route `/debts/:debtId` (`DebtDetailPage`), replacing the old `DebtDetailDialog` modal. "Xem chi tiết" / clicking a debt name navigates there (`openDetail` → `navigate('/debts/:id')`). Its "Chỉnh sửa" button routes back with `navigate('/debts', { state: { editId } })`, which the debts page's location-state effect uses to open the edit dialog (alongside the existing `openCreate` state).

The page shows the debt summary (còn nợ, tổng vay, **đã trả**, terms, interest stages, note) plus history timelines (`useDebtDetail`). History is derived client-side from money events linked to the debt (`event.debtId === debt.id`), split by direction into three buckets: **inflow** = "Nhận tiền nợ" (borrow), **outflow** = "Lịch sử trả nợ" (repayment), **neutral** = "Điều chỉnh" (an `adjustment` balance reconcile — only rendered when present). `totalRepaid` sums the outflow entries. See [[money-events]] — recording a repayment reduces `outstandingAmount`.

## Updating a debt with history: mode gate (frontend)

When the user submits an edit for a debt that **has money-event history** (`hasHistory(id) = events.some(e => e.debtId === id)` in `use-debts-page`), the form does **not** submit directly. It stashes the built payload (`pendingUpdate`) and opens `DebtUpdateModeDialog` (rendered at both `debts-page` and `debt-detail-page`), which asks:

- **Correction** ("Sửa thông tin đã nhập sai", with the warning *"Thay đổi này sẽ cập nhật lại lịch sử và số dư khoản nợ."*) vs **Effective-from-now** ("Thay đổi áp dụng từ bây giờ" + a date "Áp dụng từ ngày nào?").
- If the loan amount changed, a **3-way intent** instead: "Sửa số tiền vay ban đầu" (→ correction), "Ghi nhận vay thêm" (→ effective, `additional_disbursement`), "Cập nhật dư nợ hiện tại" (→ effective, `reconcile_balance`).

The dialog shows a **before → after preview** ("Xem trước thay đổi") reactive to the chosen mode/intent, so the user sees the effect before confirming. `use-debts-page` captures at submit time a `before` snapshot (from `editingDebt` + a `beforeEstimate`), an `after` snapshot (from the payload + live `repaymentEstimate`), and `totalRepaid` (sum of the debt's outflow events). The dialog computes the new **outstanding** per mode (correction: `max(0, correctedOriginal − totalRepaid)`; additional disbursement: `+delta`; reconcile: the typed value; effective-no-balance: unchanged). Rows self-hide when unchanged. The repayment figures (trả mỗi kỳ / lãi suất / số kỳ) are shown **only under correction** — effective mode appends a period rather than rewriting, so an exact preview isn't possible. The dependent per-period amount is already recomputed live in the form (`repaymentEstimate` → `fixedPaymentAmount` auto-sync unless the user typed one).

`confirmUpdateMode(choice)` maps the choice onto `payload.updateMode` and, for **reconcile**, moves the typed loan amount to `outstandingAmount` and drops `originalAmount` (so the backend leaves original unchanged). The backend does the actual work + audit — see the backend [[debts]] memory. `useDebts` mutations now also invalidate the **events** query so the detail timeline (incl. the new adjustment event) refetches.

## Delete

Soft-delete + unlink from upcoming payments and money events.

## Where it lives in code

- **frontend-web**: `src/features/debts/{model/debts-interest.ts, model/debts-form.ts, model/debts.types.ts, api/debts.repository.ts, hooks/use-debts.ts, hooks/use-debts-page.ts, hooks/use-debt-detail.ts, ui/debts-page.tsx, ui/debt-detail-page.tsx, ui/components/debt-update-mode-dialog.tsx}`. Route `/debts/:debtId` in `src/app/router.tsx`.
- **backend**: `src/modules/debts/` (`debts.service.ts`, `entities/debt.entity.ts`, `repositories/prisma-debts.repository.ts`).
- **mobile-app**: to be ported.

## Enums

`LenderType = relative | bank_institution | other` (the sole debt classification — `DebtType` was dropped), `DebtStatus = active | paid_off | paused | overdue | cancelled`, `PaymentFrequency = none | monthly | quarterly | yearly`, `InterestCalc = fixed | reducing`.

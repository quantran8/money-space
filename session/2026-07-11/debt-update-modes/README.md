# Debt update flow: correction vs. effective-from-now

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/debt-update-modes/`
- **Status**: done

## What the task is

Editing a debt that already has money-event history used to silently overwrite
fields (original/outstanding amount, interest periods) with no notion of *why*.
Add two explicit update modes when history exists:

1. **Correction ("Sửa thông tin đã nhập sai")** — data was wrong. Recompute
   outstanding (`max(0, correctedOriginal − Σ recorded repayments)`), rewrite the
   interest schedule, keep recorded events untouched, audit-log it.
2. **Effective-from-now ("Thay đổi áp dụng từ bây giờ")** — change effective from
   a date. Append a new interest period, update only unpaid future reminders, and
   for a balance change log a money event. Audit-log it.

Plus a 3-way intent when the loan amount changes (fix original / vay thêm /
reconcile). A no-history debt keeps the simple direct-overwrite path.

## Changes made

### frontend-web
- `api/debts.repository.ts` — `updateMode?` on `DebtPayload` (discriminated union).
- `ui/components/debt-update-mode-dialog.tsx` (new) — the mode gate: correction vs effective (+ date), or the 3-way intent when the loan amount changed. Inline Vietnamese, `ResponsiveDialog` + `CALC_OPTIONS`-style button grid. **Also shows a before → after preview** ("Xem trước thay đổi") reactive to the chosen mode: recomputed outstanding, and (correction only) trả mỗi kỳ / lãi suất / số kỳ. Rows self-hide when unchanged.
- `hooks/use-debts-page.ts` — at submit for a history-ful debt, captures `before`/`after` snapshots + `totalRepaid` and exposes them (`updateModeBefore/After/TotalRepaid`) for the preview. The dependent per-period amount is already recomputed live in the form (`repaymentEstimate` + auto-sync of `fixedPaymentAmount`).
- `hooks/use-debts-page.ts` — `useEvents()` + `hasHistory(id)`; on submit for a history-ful debt, stash `pendingUpdate` and open the gate instead of mutating; `confirmUpdateMode(choice)` maps choice → `updateMode` (reconcile moves the typed amount to `outstandingAmount`, drops `originalAmount`).
- `ui/debts-page.tsx` + `ui/debt-detail-page.tsx` — render `DebtUpdateModeDialog` (mounted only while open).
- `hooks/use-debt-detail.ts` + `ui/debt-detail-page.tsx` — third **"Điều chỉnh"** history bucket for neutral `adjustment` events (kept out of totals).
- `hooks/use-debts.ts` — invalidate the **events** query on debt mutations so the detail timeline refetches.

### backend (ported separately)
- `dto/update-debt.dto.ts` — `updateMode` discriminated union.
- `debts.service.ts` — `updateDebt` branches: no-history simple path; `applyCorrection`; `applyEffective` (interest append, unpaid-payment update, 3-way originalAmount, audit). 400 when history + no `updateMode` or effective + originalAmount change + no `balanceIntent`.
- New repo methods: `writeAuditLog` (actor from `households.created_by`), `closeLatestInterestPeriodAt`, `appendInterestPeriod`; `PaymentsService.updateUnpaidUpcomingPaymentAmounts`; `MoneyEventsService.findMoneyEventsByDebt`.
- `MoneyEventType` TS union gains `'adjustment'` (already in DB enum) + `deriveDirection` maps it to neutral.

## Key decisions

- **Correction outstanding** = `max(0, correctedOriginal − Σ recorded repayment outflows)`. Not proportional scaling.
- **`adjustment` (neutral)** for reconcile (no migration — the enum already existed), **`debt_update` inflow** for additional disbursement. Neither auto-reduces outstanding (that's outflow-only), so the debt balance is set explicitly. Never make these outflow events.
- **Additional disbursement raises `originalAmount`** to the new total (per user), plus outstanding + inflow event.
- **Mode gate is a post-submit dialog** (form stays a pure editor; interception in the hook).
- **Audit** actor resolved from `households.created_by` (debt endpoints have no request user).

## Mobile app parity notes

- Port the two-mode update + 3-way intent gate, the adjustment history bucket, and the events-query invalidation. The balance math + audit + period-append live server-side; mobile mainly builds the mode-gate UX and sends `updateMode` (with the reconcile→`outstandingAmount` remap). Web-specific: react-query invalidation keys, the `ResponsiveDialog` component.

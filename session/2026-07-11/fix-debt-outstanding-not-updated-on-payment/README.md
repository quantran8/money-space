# Fix: paying a debt-linked payment does not update the debt's remaining amount

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/fix-debt-outstanding-not-updated-on-payment/`
- **Status**: done

## What the task is

Bug: when marking a payment item that is linked to a debt as paid ("Đánh dấu đã trả" on a "Tra no: ..." upcoming payment), the debt's remaining balance (`outstandingAmount`) was **not** updated.

## Root cause

Two gaps:

1. **Frontend** — the `payment_paid` money-event payload built in `onSubmitActual` did not include the paid payment's `debtId`, so the backend had no link to the debt. (`LocalUpcomingPayment` didn't even carry `debtId`.)
2. **Backend** — `MoneyEventsService.createMoneyEvent` only inserted the event; it had no side effect to reduce the linked debt's outstanding.

Additionally, the events mutations did not invalidate the **debts** query, so even a correct backend update wouldn't show until a hard refresh.

## Changes made

### frontend-web

- `src/features/events/model/events-form.ts` — added `debtId?: string` to `LocalUpcomingPayment` and to the `toUpcomingPaymentSeed` param type; the mapper now copies `payment.debtId` through.
- `src/features/events/hooks/use-events-page.ts` — `onSubmitActual` now sets `debtId: relatedPayment?.debtId` on the money-event payload for the mark-paid flow.
- `src/features/events/hooks/use-events.ts` — `invalidate` (shared by create/update/delete event mutations) now also invalidates `queryKeys.debts(...)` so the debts view refetches the reduced outstanding.
- `memory/money-events.md` — documented the repayment → debt-reduction flow.

### backend (for reference — ported separately)

- `MoneyEventsService.createMoneyEvent` reduces the linked debt's `outstandingAmount` by the event amount when the event is a **debt-linked outflow**, in the same transaction as the insert. Borrow inflow (`debt_update` inflow from `createDebt`) is excluded.
- New repo method `reduceDebtOutstanding` (floored at 0 via `GREATEST`).
- `memory/money-events.md` updated.

## Key decisions

- **Balance change lives in the backend**, applied atomically with the event insert — correct for all clients (web + mobile), avoids non-atomic drift. The frontend only forwards `debtId` and invalidates the debts cache.
- **Reduce by the event `amount`** (what was actually paid), not the original scheduled amount — matches user-edited amounts and floors at 0 so overpaying settles the debt.
- **Only outflow + debtId** reduces the debt, so the borrow inflow event is not mistaken for a repayment.
- **Asymmetry**: deleting a repayment event does not restore the outstanding (no un-pay flow exists yet).

## Mobile app parity notes

- Mirror the same two-part fix: forward the paid payment's `debtId` into the `payment_paid` event, and invalidate/refetch the debts view after recording a payment. The actual outstanding decrement happens server-side, so mobile mainly needs to pass `debtId` and refresh debts.

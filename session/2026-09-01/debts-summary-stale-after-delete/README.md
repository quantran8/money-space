# Debts summary stale after deleting the last debt

- **Date**: 2026-09-01
- **Session folder**: `session/2026-09-01/debts-summary-stale-after-delete/`
- **Status**: done

## What the task is

On the net-worth page's debts tab, deleting every debt left "Tổng quan nợ" wrong:
"Dư nợ còn lại" and the "0 khoản" count dropped to zero, but "Nghĩa vụ 30 ngày"
still read 121,1 tr / "1 kỳ trả đã được xác nhận".

## Changes made

- `packages/core/src/features/debts/hooks/use-debts.ts` — the shared `invalidate`
  used by create/update/delete now also invalidates `queryKeys.cashflowEvents`
  and `queryKeys.attentionItems`. The strip's "Nghĩa vụ 30 ngày" is derived from
  the cashflow-events query, which was never dropped on a debt write, so the
  deleted debt's scheduled payments stayed in cache. The backend already deletes
  them (`deleteCashflowEventsByDebt` in `debts.service.ts`) — the data was only
  stale client-side.
- `web/src/features/debts/ui/components/debts-summary-strip.tsx` — the 30-day
  filter now requires the payment's `debtId` to belong to a still-active debt,
  not merely to be present.
- `mobile/src/features/debts/debts-tab.tsx` — same filter fix (see parity notes).

## Key decisions

- `queryKeys.cashflowEvents(householdId)` is used as a **prefix** key. The debts
  page subscribes with `[...cashflowEvents(id), { direction, status }]`, so the
  unfiltered key invalidates every filtered variant.
- Fixed both layers rather than just the cache. Invalidation alone fixes the
  reported delete case, but the strip would still over-count a payment left
  pointing at a paid-off debt; the id check makes the component correct
  regardless of what the events query returns.
- `attentionItems` was added alongside for consistency with the cashflow hook's
  own invalidation set — a debt write moves the same derived data.

## Mobile app parity notes

- The `use-debts.ts` fix is in `packages/core`, already shared — nothing to port.
- The strip fix was applied to `mobile/src/features/debts/debts-tab.tsx` in this
  repo (the mobile app lives in this monorepo). Its `nextPaymentByDebt` map did
  not need the guard: it is keyed by debt id and only read per rendered debt row,
  so orphaned entries were never displayed.
- Pre-existing, unrelated: `mobile` typecheck fails on a `repaymentEstimate` prop
  missing from `DebtFormSheetProps` (`app/debts/[debtId].tsx`, `debts-tab.tsx`).
  Not introduced here and not fixed here.

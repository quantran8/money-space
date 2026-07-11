# Debt detail page with repayment history

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/debt-detail-page-with-repayment-history/`
- **Status**: done

## What the task is

Create a dedicated **detail page** for viewing a debt (replacing the previous modal dialog), and add a **repayment history** ("lịch sử trả nợ") section to it.

## Changes made

- `src/features/debts/ui/debt-detail-page.tsx` (new) — full-page debt detail at `/debts/:debtId`. Shows summary (còn nợ, tổng vay, **đã trả**, dự kiến trả xong), terms (tần suất, mỗi kỳ, phụ trách, tiền nhận vào), interest stages, note, and a **repayment history** timeline. Back button → `/debts`; edit button → `/debts` with `state.editId`.
- `src/features/debts/hooks/use-debt-detail.ts` (new) — resolves the debt by id and derives its history from money events linked to `debtId`: inflow = borrow ("Nhận nợ"), outflow = repayment ("Trả nợ"); computes `totalRepaid`.
- `src/app/router.tsx` — added route `{ path: 'debts/:debtId', element: <DebtDetailPage /> }`.
- `src/features/debts/hooks/use-debts-page.ts` — `openDetail` now navigates to the detail page instead of opening a dialog; removed `viewingId`/`viewingDebt`/`closeDetail`; the location-state effect now also handles `editId` (from the detail page's edit button) to open the edit dialog.
- `src/features/debts/ui/debts-page.tsx` — removed the `DebtDetailDialog` usage and its now-unused props/locals.
- `src/features/debts/ui/components/debt-detail-dialog.tsx` — **deleted** (superseded by the page).
- `memory/debts.md` — documented the detail page + repayment history derivation.

## Key decisions

- **Page, not dialog**: viewing a debt is now a route (`/debts/:debtId`), so it's linkable and has room for the history timeline. The old modal was removed entirely.
- **Repayment history is derived client-side** from the existing money-events list (`event.debtId === debt.id`), split by direction — no new API. Borrow inflow vs repayment outflow are distinguished visually (orange "Nhận nợ" ↓ vs green "Trả nợ" ↑). This reuses the same debt↔event link that reduces `outstandingAmount` when a repayment is recorded (see the earlier debt-outstanding fix).
- **Edit round-trip via location state** (`state.editId`), mirroring the existing `openCreate` pattern, rather than adding query-param dialog handling.

## Mobile app parity notes

- Port a debt detail screen with the same repayment-history section. History can be derived the same way (filter money events by `debtId`, split by direction, sum outflows for "đã trả"). No backend change needed — the data already flows through the money-events list. Navigation/edit-return mechanics are web-specific (react-router `location.state`); adapt to the mobile navigator.

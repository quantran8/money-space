# Cho vay: trừ ví khi vừa cho vay, đánh dấu đã trả

- **Date**: 2026-10-09
- **Session folder**: `session/2026-10-09/loan-receivable-lend-and-collect/`
- **Status**: done

## What the task is

Tài sản `loan_receivable`: (1) thêm lựa chọn "Vừa cho vay" để trừ tiền từ ví cash/bank;
(2) nút "Đánh dấu đã trả" để cộng tiền về ví (mặc định ví tiền mặt) và đóng khoản vay.

## Changes made

- `packages/core/.../assets/model/assets-form.ts` — `loan_receivable` vào `purchasableTypes`; thông báo thiếu tiền riêng cho khoản vay.
- `web/.../assets/ui/components/asset-form-dialog.tsx` — `AcquisitionFields` nhận `isLoan`, đổi nhãn ("Đã cho vay từ trước" / "Vừa cho vay").
- `packages/core/.../assets/hooks/use-loan-collection.ts` (mới) — state + submit tạo money event `loan_collection`.
- `web/.../assets/ui/components/loan-collection-dialog.tsx` (mới) — số tiền, ví nhận, ngày, ghi chú.
- `web/.../assets/ui/asset-detail-page.tsx` — nút "Đánh dấu đã trả", badge "Đã thu hồi".
- `packages/core/.../assets/model/assets.ts` — `computeCurrentValue` trả 0 cho asset `closed`.
- Events: thêm `loan_collection` vào `MoneyEventItem.type`, `RecordType`, zod enum, `EventPayload`, icon `HandCoins`.
- i18n vi/en: `assets.form.loan.*`, `assets.loanCollection.*`, `options.eventType.loan_collection`.

## Key decisions

- Xem `memory/loan-receivable.md`.

## Mobile app parity notes

- Mobile cần: nhãn "Vừa cho vay" trong form tài sản, nút + sheet "Đánh dấu đã trả" dùng `useLoanCollection` (core), badge "Đã thu hồi".

## Follow-up (cùng ngày)

- `use-assets-page.ts` — `filteredAssets` bỏ asset `closed` (khoản vay đã thu hồi không hiện trong danh sách).
- `use-loan-collection.ts` — `openCollection(asset)` nhận khoản vay lúc mở, dùng chung cho list và detail.
- `asset-source-row.tsx` / `assets-list-section.tsx` / `networth-page.tsx` — menu ⋯ có "Đánh dấu đã trả".
- Mobile: thêm cùng mục menu.

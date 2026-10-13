# Bank transaction reconciliation (spec 11, P0)

- **Date**: 2026-10-13
- **Session folder**: `session/2026-10-13/bank-transaction-reconciliation/`
- **Status**: done (web); mobile pending

## What the task is

Nối giao dịch ngân hàng (iPhone Shortcut) với cashflow event đã lên lịch để
không double-count: gắn tay từ event, tự khớp theo nội dung CK, thay khoản đã
ghi tay, phát hiện lệch số dư.

## Changes made

- `packages/core/src/features/cashflow/api/cashflow-events.repository.ts` — link/unlink/replace-manual, candidates, settlements, match-rules API.
- `packages/core/src/features/cashflow/hooks/use-cashflow-settlement.ts` — hooks + `postBankAndLink`.
- `packages/core/src/features/bank-sync/*` — event có `note`/`matchStatus`/`suggestedCashflowEventId`; resolve `replace_manual`; `useWalletDrift`.
- `packages/core/src/shared/api/query-keys.ts`, `i18n/resources.ts` (`settlement.*`, vi + en).
- `web/src/features/cashflow/ui/components/link-bank-transaction-dialog.tsx` — mới.
- `web/src/features/bank-sync/ui/components/match-rules-panel.tsx` — mẫu nhận diện trong Cài đặt → Đồng bộ ngân hàng.
- `web/src/features/forecast/ui/*` — menu "Gắn giao dịch ngân hàng"; hoàn tất dùng chung `handleComplete`.
- `web/src/features/bank-sync/ui/*` — chọn khoản để gắn trong inbox; `WalletDriftNotice` (inbox + trang ví).

## Key decisions

- Xem `memory/cashflow-settlement.md`. Mẫu nhận diện quản lý tập trung ở Cài đặt (theo yêu cầu user), không ở menu từng khoản.

## Mobile app parity notes

- Port dialog gắn giao dịch vào `app/(tabs)/upcoming.tsx` và panel mẫu nhận diện vào cài đặt; mobile chưa có màn bank inbox nên `WalletDriftNotice` và chọn khoản trong inbox chờ tới khi có.
- Sửa cùng lỗi: mục quá hạn trên mobile gửi complete không kèm `assetId`.

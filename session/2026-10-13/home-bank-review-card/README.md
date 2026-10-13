# Home: card giao dịch chờ xác nhận

- **Date**: 2026-10-13
- **Session folder**: `session/2026-10-13/home-bank-review-card/`
- **Status**: done

## What the task is

Đưa các thông báo ngân hàng cần user xác nhận (tab "Cần xác nhận" của hộp thư) lên Home.

## Changes made

- `web/src/features/bank-sync/ui/components/bank-event-row.tsx` — tách dòng thông báo ra dùng chung.
- `web/src/features/bank-sync/ui/bank-inbox-page.tsx` — dùng `BankEventRow`.
- `web/src/features/dashboard/ui/components/bank-review-section.tsx` — card mới, ẩn khi không có gì chờ.
- `web/src/features/dashboard/ui/dashboard-page.tsx` — đặt card dưới Quá hạn.
- `packages/core/src/i18n/resources.ts` — `bankSync.inbox.home.*` (vi + en).
- `memory/bank-sync.md` — quy tắc hiển thị.

## Key decisions

- Chỉ tab `review`; `unmapped`/`parse_failed` ở lại hộp thư.
- Tối đa 3 dòng + link "Mở hộp thư"; xác nhận ngay trên Home qua `EventDetailDialog`.

## Mobile app parity notes

- Mobile chưa port bank-sync; khi port, Home cũng cần card này với cùng điều kiện ẩn.

## Follow-up

- Card Home gộp thêm `WalletDriftNotice` (cảnh báo lệch số dư); hiện khi có thông báo chờ hoặc có drift. Tiêu đề đổi thành "Từ ngân hàng · cần xác nhận".

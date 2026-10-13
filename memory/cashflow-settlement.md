# Cashflow settlement — gắn giao dịch ngân hàng vào khoản đã lên lịch

## Overview

Một kỳ của cashflow event được ghi nhận bằng đúng một money event: hoàn tất
thủ công, gắn giao dịch ngân hàng, hoặc tự khớp theo nội dung CK. Toàn bộ
nghiệp vụ: backend `memory/cashflow-settlement.md`. Related: [[cashflow-events]],
[[bank-sync]], [[money-events]].

## Rules / flow

- **Gắn ≠ ghi thêm tiền.** Gắn một giao dịch ngân hàng đã ghi chỉ đánh dấu kỳ;
  ví không đổi. Dòng inbox chưa ghi thì "Ghi nhận và gắn" = post + gắn một lần.
- **Chỉ nội dung CK được tự gắn.** Client không đề xuất theo số tiền/ngày;
  danh sách ứng viên chỉ lọc theo chiều và 45 ngày, user tự chọn.
- **Mẫu nhận diện nằm ở Cài đặt → Đồng bộ ngân hàng** (`MatchRulesPanel`),
  một chỗ cho cả household, không ở menu từng khoản. Cụm từ do user nhập; server từ chối cụm < 4 ký tự (400) hoặc
  trùng khoản khác (409) — UI nói rõ hai trường hợp. Không tự học sau khi gắn tay.
- **Bỏ gắn chỉ ở kỳ gần nhất**, và không áp dụng cho kỳ hoàn tất thủ công
  (muốn huỷ thì xoá money event).
- **Thay khoản đã ghi tay**: khi kỳ gần nhất hoàn tất thủ công rồi ngân hàng
  mới báo, dùng nút "Thay khoản đã ghi tay" để số dư chỉ đổi một lần.
- **Lệch số dư** không còn hiển thị: backend tự đồng bộ ví theo số dư ngân hàng
  mỗi lần post (backend memory/bank-sync.md, mục Số dư).
- Hoàn tất từ timeline và mục quá hạn dùng chung `handleComplete`: không có ví
  trên event thì mở dialog chọn ví (trước đây timeline gửi thiếu ví → 400).

## Where it lives in code

- core: `features/cashflow/hooks/use-cashflow-settlement.ts`,
  `features/cashflow/api/cashflow-events.repository.ts`
- web: `features/cashflow/ui/components/link-bank-transaction-dialog.tsx`,
  `features/bank-sync/ui/components/match-rules-panel.tsx`,
  `event-detail-dialog.tsx`, `features/forecast/ui/upcoming-page.tsx`
- mobile: chưa có (P1)

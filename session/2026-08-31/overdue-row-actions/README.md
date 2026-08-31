# Menu ⋯ cho hàng quá hạn

- **Date**: 2026-08-31
- **Session folder**: `session/2026-08-31/overdue-row-actions/`
- **Status**: done

## What the task is

Các hàng trong card "Khoản quá hạn" chỉ có nút **Đã xong**, không có menu hành
động như hàng trên dòng thời gian (`ForecastTimeline`). Không sửa hay xoá được
khoản quá hạn ngay tại chỗ.

## Changes made

- `web/src/features/forecast/ui/components/overdue-section.tsx` — thêm `onEdit` /
  `onDelete` vào `OverdueSection` và `OverdueRowItem`, render `DropdownMenu` ⋯
  (Sửa / Xoá) dùng lại đúng key `upcoming.rowActions.*` của timeline. Layout hàng
  chuyển sang grid placement tường minh theo breakpoint (mobile 2 cột × 3 hàng,
  từ `sm` là 5 cột một hàng) để menu có ô riêng thay vì đè lên cột tuổi/số tiền.
- `web/src/features/forecast/ui/upcoming-page.tsx` — nối `cashflowForm.openEdit` /
  `handleDelete` vào `OverdueSection`.
- `web/src/features/dashboard/ui/dashboard-page.tsx` — thêm `useCashflowForm` +
  `CashflowEventFormDialog`, nối cùng hai handler, để card quá hạn trên Home
  hành xử y hệt trên `/upcoming`.

## Key decisions

- **"Đã xong" ở lại là nút riêng, không gộp vào menu.** Đây là hành động duy nhất
  đưa khoản ra khỏi danh sách (§18) và cả card tồn tại vì nó — giấu sau ⋯ là hạ
  cấp việc chính. Sửa/xoá là hành động sửa dữ liệu nên vào menu.
- **`sourceEventId` là id của cashflow event gốc**, khớp với thứ `openEdit` tra
  cứu trong `cashflowEvents`, nên dùng thẳng được. Lưu ý phân biệt với `row.date`
  (day 0 — khoá idempotency của complete) và `row.dueDate` (chỉ để hiển thị).
- **Home cũng được nối**, không chỉ `/upcoming`: cùng một component, người dùng
  không nên phải sang trang khác để sửa một khoản sai ngày. Đổi lại Home nay có
  `CashflowEventFormDialog`.
- Không đụng luồng `CompleteCashflowDialog` của Home — complete vẫn qua dialog
  chọn ví như cũ.

## Mobile app parity notes

- `mobile/src/features/forecast/ui/forecast-timeline.tsx` đã có action sheet với
  `complete / edit / postpone / cancelEvent / delete`. Cần thêm edit + delete vào
  phần overdue tương ứng bên mobile, dùng chung key i18n (không cần thêm key mới).
- Grid placement bằng class Tailwind là web-only; bên RN dựng lại bằng flex.

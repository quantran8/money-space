# Section Dòng tiền trên Home: thêm nửa "đã xảy ra"

- **Date**: 2026-08-22
- **Session folder**: `session/2026-08-22/home-cashflow-recorded-block/`
- **Status**: done

## What the task is

Section "Dòng tiền" ở Home trước đây chỉ có phần dự kiến (30 ngày tới). Thêm khối
"Tháng này · Đã xảy ra" phía trên để section kể trọn câu chuyện:

**đã xảy ra gì → kết quả dòng tiền hiện tại → sắp xảy ra gì**

```
Dòng tiền                                        Xem timeline
[khối quá hạn, nếu có]

Tháng này · Đã xảy ra
+45,0 tr        −28,5 tr        +16,5 tr
Đã nhận         Đã chi          Ròng

30 ngày tới                          13/08 — 12/09 · 8 khoản
Thấp nhất dự kiến …                  [bảng event như cũ]
```

## Changes made

- `src/features/dashboard/ui/components/upcoming-section.tsx` — thêm component
  `RecordedThisMonth` + `Figure`, render giữa `OverdueBlock` và khối "30 ngày tới".
  Nhận prop mới `eventsSummary?: EventsSummaryResponse`.
- `src/features/dashboard/hooks/use-dashboard-page.ts` — gọi `useEventsSummary()`
  (không tham số ⇒ tháng hiện tại), thêm `eventsSummaryLoading` vào gate skeleton
  và trả `eventsSummary` ra ngoài.
- `src/features/dashboard/ui/dashboard-page.tsx` — truyền `eventsSummary` xuống
  `UpcomingSection`.
- `src/i18n/resources.ts` — thêm `home.cashflow.recordedEyebrow` / `received` /
  `spent` / `net` cho cả `vi` và `en`.

## Key decisions

- **Thứ tự trong section là chủ ý**: quá hạn (việc đang chờ người) → đã xảy ra
  (sự thật) → 30 ngày tới (dự kiến). Khối "đã xảy ra" đặt sau overdue vì overdue
  vẫn là thứ duy nhất đang chờ ai đó bấm, còn lại đều là số để đọc.
- **Không tự tính lại thu/chi/ròng.** Đọc thẳng từ `/money-events/summary` —
  cùng một endpoint mà tab Sự kiện dùng, nên hai màn không bao giờ lệch số.
- **Không có summary thì ẩn hẳn khối**, không render 3 số 0. "Chưa biết" và
  "tháng này không có gì chạy" là hai điều khác nhau; ba số 0 sẽ nói điều thứ hai.
  Query lỗi ⇒ `isLoading` false + `data` undefined ⇒ Home vẫn hiện bình thường,
  chỉ thiếu khối này (không treo skeleton).
- **"Ròng" là bản lề**: mang dấu, âm thì `text-alert`, dương thì `text-accent`.
  Đây chính là con số mà phần "30 ngày tới" ngay bên dưới đi tiếp từ đó.
- Dùng `formatVndScale` (─ "45,0 tr" / "1,81 tỷ") cho đồng bộ với số "Thấp nhất
  dự kiến" ngay dưới, không dùng `formatMoney`.

## Mobile app parity notes

- Cùng một endpoint `/money-events/summary`, cùng quy tắc ẩn khối khi không có data.
- Key i18n `home.cashflow.*` cần copy sang mobile resources.
- Thứ tự ba phần trong section (quá hạn → đã xảy ra → sắp tới) phải giữ nguyên —
  đó là nội dung câu chuyện, không phải lựa chọn layout.
- Layout 3 cột chia bởi `border-hair` là web; mobile xếp dọc nhưng giữ thứ tự
  Đã nhận → Đã chi → Ròng.

# Summary strip đầu trang Sự kiện, theo khoảng thời gian đang chọn

- **Date**: 2026-08-22
- **Session folder**: `session/2026-08-22/events-period-summary/`
- **Status**: done

## What the task is

Thêm summary ở đầu tab Sự kiện, tóm tắt theo khoảng thời gian (tháng) đang chọn:

```
Tháng 8
Đã nhận: +85M     Đã chi: −62M     Dòng tiền ròng: +23M
12 sự kiện đã xảy ra
```

## Changes made

- `src/features/events/ui/components/events-summary-strip.tsx` — **mới**. Panel +
  `PanelHeader` (title = "Tháng 8", meta = "N sự kiện đã xảy ra") + 3 metric
  Đã nhận / Đã chi / Dòng tiền ròng, theo đúng khuôn `DebtsSummaryStrip`.
- `src/features/events/model/events-form.ts` — thêm `hasHappened`,
  `summarizeRecords()` và type `PeriodSummary`.
- `src/features/events/hooks/use-events-page.ts` — nâng `selectedMonth` /
  `selectedMember` từ trong timeline card lên hook; `filteredRecords` giờ lọc luôn
  theo tháng + người; thêm `periodSummary`; `useEventsSummary(selectedMonth)` để
  gọi summary theo tháng đang xem thay vì luôn tháng hiện tại.
- `src/features/events/ui/components/events-timeline-card.tsx` — thành controlled
  component: nhận `selectedMonth` / `onMonthChange` / `selectedMember` /
  `onMemberChange` qua props, bỏ state nội bộ và bỏ phần tự lọc tháng + người
  (đã lọc ở trên).
- `src/features/events/ui/events-page.tsx` — render `EventsSummaryStrip` phía trên
  `EventsTimelineCard`.
- `src/i18n/resources.ts` — `events.summary` được thay nội dung: bỏ 5 key chết
  (`eyebrow`/`title`/`inflow`/`outflow`/`net` — grep không chỗ nào dùng), thêm
  `received` / `spent` / `net` / `recordedCount` cho cả `vi` và `en`.

## Key decisions

- **Nâng filter tháng/người lên page hook.** Trước đó hai filter này là state riêng
  của timeline card. Summary bắt buộc phải mô tả đúng những dòng đang hiện bên dưới,
  mà không thể làm được nếu filter còn nằm kín trong card.
- **"đã xảy ra" ≠ số dòng.** Chỉ đếm record có status `recorded` / `paid`. Các status
  còn lại (`unpaid`, `overdue`, `pending_confirmation`, `postponed`) là tiền chưa
  chạy — gộp vào sẽ báo cáo một tháng chưa thực sự diễn ra. Vì vậy con số ở summary
  có thể nhỏ hơn `changeCount` trên header của timeline, và đó là chủ ý.
- **Backend vẫn là source of truth cho thu/chi/net.** Khi đang xem nguyên một tháng
  (không lọc người / loại / tìm kiếm) thì đọc thẳng từ `/money-events/summary`.
  Endpoint này không có tham số người, nên khi có filter thu hẹp thì mới tính lại từ
  chính các dòng đang hiện — nếu không, headline sẽ nói về cả nhà trong khi list bên
  dưới chỉ hiện một người.
- **`neutral` không vào thu cũng không vào chi.** Transfer giữa hai ví của chính nhà
  mình có `direction: 'neutral'`, nên `summarizeRecords` bỏ qua — chuyển tiền từ túi
  này sang túi kia không phải là đã nhận hay đã chi.
- Màu: dòng tiền ròng âm dùng `text-alert`, dương dùng `text-accent`; "Đã chi" giữ
  màu ink mặc định, theo đúng quy ước `RecordCard` (chỉ inflow được tô accent).

## Mobile app parity notes

- `summarizeRecords` / `hasHappened` / `PeriodSummary` là domain logic, port nguyên.
- Key i18n `events.summary.*` cần copy sang mobile resources.
- Quy tắc "backend summary cho nguyên tháng, tự tính khi có filter thu hẹp" phải giữ
  giống nhau, nếu không hai app sẽ ra số khác nhau trên cùng một tháng.
- Layout 3 cột chia bởi `border-hair` là web; mobile nên xếp dọc nhưng giữ nguyên
  thứ tự Đã nhận → Đã chi → Dòng tiền ròng.

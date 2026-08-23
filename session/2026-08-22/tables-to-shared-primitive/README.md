# Chuyển các bảng còn hand-roll sang Table component của app

- **Date**: 2026-08-22
- **Session folder**: `session/2026-08-22/tables-to-shared-primitive/`
- **Status**: done

## What the task is

Vẫn còn ba chỗ dựng `<table>/<thead>/<tr>/<td>` bằng tay thay vì dùng
`@/components/ui/table`. Chuyển hết sang primitive chung.

## Changes made

- `src/features/forecast/ui/components/forecast-timeline.tsx` — bảng timeline
  (`<table>` + nhiều `<tbody>` theo tháng + `OccurrenceRow`) → `Table` /
  `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell`.
- `src/features/goals/ui/components/goals-list-section.tsx` — bảng danh sách
  mục tiêu → primitive.
- `src/components/ui/source-freshness-list.tsx` — bảng nguồn tiền trong
  coverage strip → primitive.

## Key decisions

- **`px-0 py-0` ở gần như mọi cell.** `TableCell` mặc định `px-4 py-3`, nhưng ba
  bảng này đều có nhịp riêng (grid xuống dòng ở mobile, `py-2.5` trong sunk block).
  Ghi đè padding chứ không sửa primitive — primitive đang đúng cho các bảng khác.
- **Giữ `<th scope="row">` thô cho tên nguồn tiền** trong freshness list.
  `TableHead` gắn `.label` (mono uppercase), mà mono không được chạm text tiếng
  Việt có dấu (§10.1) — tên nguồn là "Sổ tiết kiệm chung". Primitive không có
  ô row-header nên chỗ này để `<th>` thường là đúng ngữ nghĩa.
- **Sửa luôn một lỗi §10.1 có sẵn**: header của freshness table ("Nguồn",
  "Cập nhật", "Số tiền") đang dùng `.label` mono. Đổi sang `.label-vi` — cùng
  cỡ, cùng tracking, nhưng font sans để giữ dấu.
- **`hover:bg-transparent` trên header row và trên row đã tự lo hover.**
  `TableRow` mặc định có `hover:bg-sunk`; bảng mục tiêu tô hover ở cell
  (`group-hover:bg-sunk`) để bo góc rơi đúng cell đầu/cuối, còn freshness list
  dùng `hover:bg-panel` vì nó nằm TRONG sunk block nên hover phải sáng lên.
- **Wrapper `overflow-x-auto` của `Table` không gây scroll ngang trên mobile**
  ở forecast timeline: dưới `lg` các row là grid `minmax(0,1fr)` + `truncate`,
  nội dung không thể vượt bề ngang container.

## Mobile app parity notes

- Thuần web (markup + Tailwind). Không có thay đổi domain logic hay i18n.
- Riêng quy tắc §10.1 — mono chỉ chạm ASCII, text tiếng Việt có dấu dùng sans —
  thì áp cho cả mobile.

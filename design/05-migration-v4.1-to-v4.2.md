# 05 — Migration v4.1 → v4.2

## 1. Không đổi

Giữ:

```txt
App / panel / sunk visual language
Panel radius 14
No shadow on page surfaces
Be Vietnam Pro primary typeface
IBM Plex Mono cho ASCII metadata
Flexible Money là Home hero
Forecast-first product direction
One datum, one place
No false precision
Privacy clarity
```

## 2. Token changes

### `--ink3`

```diff
- #868D96
+ #707780
```

Lý do: tăng contrast cho 10–12px metadata/table header.

### Accent naming

```diff
- --accent
- --accent-soft
+ --interactive
+ --interactive-soft
```

Có thể alias tạm trong code migration:

```css
--accent: var(--interactive);
--accent-soft: var(--interactive-soft);
```

Không dùng interaction accent mặc định cho raw incoming money.

## 3. Typography migration

### Remove semantic coupling

```diff
-.label { font-family: IBM Plex Mono; ... }
+.ui-label { font-family: Be Vietnam Pro; ... }
+.meta-mono { font-family: IBM Plex Mono; ... }
```

Audit toàn app cho `.label` có chuỗi tiếng Việt.

## 4. Layout migration

Thay fixed rule:

```txt
Desktop section luôn 380px + 1fr
```

bằng:

```txt
2 cột khi primary answer available và detail đủ density
1 cột khi metric unavailable hoặc detail chỉ 1–2 items
```

Các section cần audit đầu tiên:

```txt
30 ngày tới
Mục tiêu chính ở account mới
Tiền đang ở đâu khi chỉ có 1 source
Cần cập nhật khi chỉ có 1 stale item
```

## 5. Table migration

Home time-based view:

```txt
1–2 rows → grouped rows
3–6 rows → grouped rows hoặc table tùy comparison need
7+ rows → preview top rows + detail CTA
```

Detail/management page vẫn ưu tiên dense table.

## 6. State migration

Thêm enum/concept:

```ts
type DataState =
  | 'ready'
  | 'stale'
  | 'dependency-missing'
  | 'empty'
  | 'error'
```

Không dùng `empty` cho trường hợp domain data đã tồn tại.

Cash-flow dependency missing example:

```txt
upcomingEvents.length > 0
&& !startingBalance
→ dependency-missing
```

## 7. Chart migration

Không mount forecast chart khi:

```txt
!startingBalance
meaningfulPoints < 2
```

Chart không là placeholder cho empty space.

## 8. Color migration

Audit nơi `text-accent` đang gắn với static money values.

Keep accent:

```txt
CTA
active nav
action link
focus
Flexible Money composition segment
```

Move to neutral:

```txt
raw incoming amount
normal positive number
normal status
```

## 9. Sunk migration

Không đổi background token, nhưng tách semantic variants trong component API:

```ts
<Sunk variant="summary" />
<Sunk variant="field" />
<Sunk variant="notice" />
<Sunk variant="visualization" />
```

Variant quyết định padding/interaction, không thêm surface level mới.

## 10. Header migration

Home:

```txt
title + metadata OR action
```

Detail page có thể:

```txt
title + metadata + action
```

nếu cả hai thật sự cần thiết.

## 11. Suggested implementation order

```txt
1. Token + typography rename
2. Add dependency-missing state
3. Adaptive section layout primitive
4. GroupedRow + density switch
5. Cash-flow 30-day recipe
6. Audit accent semantics
7. Audit micro-copy / duplicate facts
8. Regression mobile + accessibility
```

## 12. Acceptance tests

### Cash-flow: 1 event, no source

Expected:

```txt
Event vẫn hiện
Low point nói “Chưa tính được”
Có “Chưa có số dư đầu kỳ.”
Có CTA Thêm nguồn tiền
Còn lại = —
Không chart
Không 2-column whitespace lớn
```

### Cash-flow: 1 event, balance available

Expected:

```txt
Low point hiện
Grouped row
Chart optional, không bắt buộc
Summary in/out
```

### Cash-flow: 5 events, balance available

Expected:

```txt
Desktop có thể 2 cột
Table sequence có running balance
Low point + supporting chart
```

### Typography

Expected:

```txt
Không chuỗi tiếng Việt nào render bằng IBM Plex Mono
Table header đủ contrast
```

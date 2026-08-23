# 01 — Foundations

## 1. Visual register

Money Space là một **sổ cái hiện đại cho household**, không phải BI dashboard, expense tracker hay wellness app.

```txt
Calm nhưng có trọng lượng
Đáng tin qua cấu trúc dữ liệu, không qua trang trí
Ấm ở nền, chặt ở thông tin
Future-oriented
Private, not controlling
```

## 2. Surface

Ba tầng cơ bản:

```css
:root {
  --app: #EEF1F3;
  --panel: #FFFFFF;
  --sunk: #F5F7F8;

  --ink: #15181C;
  --ink2: #525860;
  --ink3: #707780; /* v4.2: tăng contrast cho micro text */

  --interactive: #0A6B47;
  --interactive-soft: #E3EFEA;
  --attention: #9A6818;
  --alert: #B23A26;

  --committed: #D2D6DA;
  --protect: #A9B0B8;

  --radius-panel: 14px;
  --radius-sunk: 10px;
  --radius-control: 8px;
}
```

### Default

- App background dùng `--app`.
- Top-level panel dùng `--panel`.
- `--sunk` dùng cho block nằm chìm trong panel.
- Panel mặc định không border và không shadow.
- Không dùng `--sunk` cho toàn section.

### Exception

Divider/border được phép khi **relation không còn đọc được bằng spacing, alignment hoặc surface**. Divider là fallback của information architecture, không phải decoration.

## 3. Color semantics

v4.2 tách **interaction** khỏi **data direction**.

```txt
--interactive  CTA, active nav, action link, focus ring
--attention    stale data, unconfirmed event, user-defined threshold
--alert        deficit thật, overdue, destructive validation
--ink ramp     money direction, normal state, neutral data
```

### Money direction

Incoming/outgoing **không tự động có hue riêng**.

Default:

```txt
Incoming  → --ink
Outgoing  → --ink
Delta tốt/xấu → chỉ dùng màu khi nó thật sự mang consequence
```

Nếu một view cần encode direction bằng màu, phải có legend/context trực tiếp và không được dùng cùng màu để biểu thị clickability.

## 4. Accent discipline

Interaction accent nên chiếm diện tích rất nhỏ. Không dùng accent để “làm dashboard bớt nhạt”.

Không dùng:

```txt
gradient
nền tối section
shadow panel
nhiều hue theo category
chart trang trí
accent cho normal status
```

## 5. Typography

### Font roles

```txt
Be Vietnam Pro 400 / 500 / 600
→ mọi chuỗi tiếng Việt, title, body, money number, semantic label

IBM Plex Mono 400 / 500
→ chuỗi ASCII: ngày, giờ, đơn vị, %, count, code-like metadata
```

**Hard constraint:** IBM Plex Mono không chạm chuỗi tiếng Việt có dấu.

### Semantic text styles

```css
.ui-label {
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--ink3);
}

.meta-mono {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink3);
}

.num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

`.ui-label` là semantic label của UI. `.meta-mono` chỉ là một treatment cho ASCII metadata. Không dùng một class vừa biểu thị semantic role vừa khóa font.

### Scale

```txt
Hero money          56–64px / 500 / tracking -0.04em
Secondary metric    28–32px / 500 / tracking -0.03em
Table metric        18–22px / 500
Page title          19px / 500
Section title       16px / 500
Body                14px / 400
Secondary           13px / 400
Caption             11–12px / 400
```

Hero 64px chỉ dùng khi nó là **một visual anchor thật sự**. Không dùng cỡ hero chỉ vì một con số nằm đầu section.

### Vietnamese

- Weight tối thiểu 400.
- Line-height body ≥ 1.4.
- Tracking âm chỉ áp cho số/ASCII, không áp cho câu tiếng Việt.
- Uppercase tracking rộng chỉ dùng cho label ngắn.

## 6. Money formatting

```txt
< 1 triệu      450.000đ
1–999 triệu    48,2 tr
≥ 1 tỷ         1,81 tỷ
Delta          +32,0 / −14,2
Range          48,2 → 18,2
```

- Tabular nums bắt buộc cho money values.
- Dấu phẩy là thập phân.
- Tối đa một chữ số thập phân khi nguồn là manual estimate.
- Trong bảng có thể đưa đơn vị lên header; ngoài bảng luôn kèm đơn vị.
- Không hiển thị precision cao hơn precision của input.

## 7. Spacing

```txt
Section → section           16px
Panel padding desktop       32px
Panel padding mobile        20px
Header → body               24–28px
Large internal column gap   40–56px
Dense row                   10–12px vertical
Table/list → summary        16–20px
```

Spacing là default range, không phải fixed geometry. Data density thấp thì **thu hẹp composition**, không kéo item ra để lấp chiều ngang.

## 8. Radius & elevation

```txt
Panel          14px
Sunk block     10px
Controls       8–10px
Chip           full
Modal          14px + shadow vì thật sự nổi
```

Không dùng shadow cho surface trong page.

## 9. Accessibility

### Contrast

- `--ink`, `--ink2`, `--ink3`, `--interactive`, `--attention` phải đạt AA ở kích thước đang dùng.
- v4.2 nâng `--ink3` để micro text 10–12px không chỉ đạt vai trò “decorative metadata”.
- Money value không dùng low-contrast token.

### Focus

```css
:focus-visible {
  outline: 2px solid var(--interactive);
  outline-offset: 2px;
}
```

### Touch

Mobile target tối thiểu 44×44px cho nav, CTA và action link.

### Screen reader

- Table thật dùng `<table><thead>`.
- Timeline/list dùng semantic list.
- Chart có text summary hoặc `aria-label` đủ nghĩa.
- Không dùng màu là tín hiệu duy nhất.

## 10. Motion

- Animate supporting visual, không animate money number đếm lên.
- 120–550ms.
- `prefers-reduced-motion` tắt toàn bộ motion không thiết yếu.

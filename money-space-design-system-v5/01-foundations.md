# 01 — Foundations

> v5.0 — visual direction mới: airy, cool, flat financial workspace. Lấy cảm hứng từ visual grammar của Clerio nhưng giữ information architecture và product semantics riêng của Money Space.

## 1. Visual register

Money Space là một **shared financial workspace cho household**, không phải BI dashboard, expense tracker hay wellness app.

```txt
Calm, airy, có trọng lượng
Rõ nhờ typography + spacing, không nhờ decoration
Cool ở canvas, ấm ở cách nói
Financial nhưng không banking-heavy
Future-oriented
Private, not controlling
```

Visual hierarchy đến từ:

```txt
type scale
alignment
spacing
surface contrast
data density
```

Không tạo hierarchy bằng:

```txt
nhiều lớp card
border quanh mọi block
shadow mạnh
icon container cho mọi label
nhiều màu theo category
```

---

## 2. Surface system

### 2.1 Tokens

```css
:root {
  /* environment */
  --canvas: #E2E7EA;
  --page: #F4F6F7;
  --card: #FFFFFF;
  --wash: #F6F8F9;

  /* atmospheric surface */
  --hero: #B7D8F3;
  --hero-deep: #73A4D7;

  /* text */
  --ink: #0F1011;
  --ink2: #596268;
  --ink3: #879398;

  /* action */
  --action: #0F1011;
  --action-inverse: #FFFFFF;

  /* data / state */
  --data-primary: #73A4D7;
  --positive: #8FCDA4;
  --attention: #E1BE68;
  --alert: #E8A39A;

  --committed: #D8E0E4;
  --protect: #AFC0C7;
  --model: #EEF6F1;

  /* geometry */
  --radius-hero: 28px;
  --radius-card: 22px;
  --radius-control: 14px;
  --radius-pill: 999px;

  /* elevation */
  --shadow-card: 0 1px 5px rgba(39, 62, 78, 0.018);
  --shadow-overlay: 0 18px 50px rgba(20, 34, 43, 0.16);
}
```

### 2.2 Surface hierarchy

Default hierarchy:

```txt
canvas
→ page
→ optional hero surface
→ top-level cards
→ content
```

**Hard constraint:** top-level card phải là direct surface của composition. Không tạo:

```txt
page
→ white sheet/group panel
  → card
    → rounded card con
```

Card không cần một `panel` khác để “gom nhóm”.

### 2.3 Card default

- Background `--card`.
- Không border mặc định.
- Shadow bằng `--shadow-card` hoặc `none`.
- Radius 20–24px.
- Card đứng trực tiếp trên `--page`/`--canvas`.
- Nếu relation đọc được bằng spacing/alignment thì không thêm divider.
- Nếu cần divider, dùng 1px low-contrast ở đúng relation cần tách.

### 2.4 `--wash`

`--wash` không phải một card level.

Chỉ dùng cho:

```txt
input / field
subtle hover
small visualization bed khi thật sự cần
compact utility control
```

Không dùng `--wash` để bọc:

```txt
empty state
summary metric
list item
chart chỉ để tạo thêm một rounded box
toàn bộ section bên trong card
```

---

## 3. Hero surface

Hero là atmospheric surface, không phải một dashboard card khổng lồ.

Dùng cho:

```txt
page identity
financial context
shared household context
coverage/freshness context
```

Default:

- Màu xanh nhạt `--hero`.
- Radius 28px.
- Có thể dùng blue-on-blue tonal gradient rất nhẹ nếu cần depth.
- Không dùng multicolor gradient.
- Không đặt quá nhiều KPI trong hero.
- Không dùng hero để lặp lại số đã có canonical card bên dưới.

### Tonal gradient exception

Nếu dùng gradient:

```txt
same hue family
luminance shift nhỏ
không biến hero thành decorative illustration
```

---

## 4. Color semantics

Interaction không dùng green.

```txt
--action        CTA, active nav, action link mạnh
--data-primary  chart/composition/data emphasis
--positive      consequence thật sự tốt / completed / healthy
--attention     stale, unconfirmed, threshold cần chú ý
--alert         deficit thật, overdue, destructive validation
--ink ramp      normal money direction, neutral state
```

### Money direction

Incoming/outgoing không tự động có hue riêng.

Default:

```txt
Incoming  → --ink
Outgoing  → --ink
Delta     → chỉ dùng positive/alert khi consequence thật sự có nghĩa
```

Không dùng màu action để encode data state.

### Accent discipline

Accent diện tích nhỏ.

Không dùng:

```txt
green cho static metric chỉ vì nó là tiền
blue cho mọi clickable item
colored pill cho normal state
nhiều hue theo category
decorative chart
```

---

## 5. Typography

### 5.1 Font family

```txt
Urbanist Light   300
Urbanist Regular 400
Urbanist Medium  500
```

Không dùng font mono như một visual motif mặc định.

Toàn app dùng Urbanist để giữ một register nhẹ, liền và editorial.

### 5.2 Weight roles

```txt
300 Light
→ display heading
→ hero money
→ large KPI / primary metric

400 Regular
→ subheading
→ body
→ supporting copy
→ metadata

500 Medium
→ nav
→ button
→ card title
→ semantic label
→ status/action text
```

Không dùng 600/700 trong core product UI.

### 5.3 Core type scale

Reference scale:

```txt
Heading      72px / 300
Subheading   20px / 400
Body         16px / 400
```

Money Space semantic scale:

```txt
Display / page hero     56–72px / 300 / line-height .98–1.04
Hero money              56–64px / 300 / tracking -0.04em
Primary KPI             36–44px / 300 / tracking -0.035em
Secondary metric        28–32px / 300
Subheading              20px / 400
Section title           16–20px / 500
Body                    16px / 400 / line-height ≥1.45
Secondary               14px / 400
Caption / metadata      12px / 400
Control / nav           12–14px / 500
```

### 5.4 Minimum readable size

Không dùng 8–10px cho product information.

12px là minimum cho metadata có ý nghĩa.

10px chỉ được phép cho decorative preview/artwork không cần đọc để hoàn thành task.

### 5.5 Vietnamese

- Body tiếng Việt dùng 400.
- Heading tiếng Việt có thể dùng 300.
- Không tracking âm trên câu dài tiếng Việt.
- Tracking âm chỉ ưu tiên money number / ASCII display.
- Uppercase + tracking rộng chỉ dùng cho label rất ngắn; không biến toàn UI thành uppercase metadata.

### 5.6 Numeric treatment

```css
.num {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1;
}
```

Money number dùng Urbanist Light, không cần mono.

---

## 6. Money formatting

```txt
< 1 triệu       450.000đ
1–999 triệu     48,2 tr
≥ 1 tỷ          1,81 tỷ
Delta           +32,0 / −14,2
Range           48,2 → 18,2
```

Rules:

- Tabular nums bắt buộc.
- Dấu phẩy là thập phân.
- Tối đa một chữ số thập phân khi nguồn là manual estimate.
- Trong bảng có thể đưa đơn vị lên header.
- Ngoài bảng luôn kèm đơn vị.
- Không hiển thị precision cao hơn input.

---

## 7. Spacing

```txt
Page edge desktop          28–32px
Page edge mobile           16–20px
Hero padding desktop       28–32px
Card padding desktop       20–24px
Card padding mobile        18–20px
Card → card gap            8–12px
Section → section          16–20px
Header → body              20–24px
Large internal column gap  36–48px
Dense row                  10–12px vertical
```

Clerio-like density đến từ **card gap nhỏ + surface phẳng**, không phải bằng nested container.

Data ít thì thu hẹp composition hoặc stack. Không kéo content ra để lấp ngang.

---

## 8. Radius & elevation

```txt
Hero            28px
Top-level card  20–24px
Control         12–14px
Pill            full
Modal/sheet     22–28px
```

### Elevation

Trong page:

```txt
default card shadow = none
hoặc 0 1px 5px rgba(..., .018)
```

Overlay thật sự nổi:

```txt
modal
dialog
side sheet
popover
```

mới dùng `--shadow-overlay`.

**Không dùng shadow để chứng minh một block là card.**

---

## 9. Borders & dividers

Border là fallback, không phải decoration.

Ưu tiên:

```txt
spacing
alignment
surface contrast
divider
border
```

Theo thứ tự đó.

### Allowed

- divider giữa các row có relation rõ;
- field focus/error;
- dashed treatment cho modeled state nếu cần;
- separator giữa column consequence.

### Avoid

- border quanh top-level card;
- border quanh từng metric;
- border quanh empty state bên trong card;
- border quanh chart chỉ vì chart nằm trong card.

---

## 10. Iconography

- Icon nhỏ, line icon.
- Không đặt mỗi icon trong một colored square/circle.
- Icon container chỉ dùng cho:
  - app mark;
  - active rail item;
  - empty state anchor;
  - action cần affordance rõ.
- Icon không thay text cho privacy/status có consequence.

---

## 11. Accessibility

### Contrast

- `--ink`, `--ink2`, `--ink3`, `--action` phải đạt AA ở kích thước dùng thật.
- Money value không dùng low contrast.
- Hero text phải đạt contrast trên toàn vùng background.

### Focus

```css
:focus-visible {
  outline: 2px solid var(--action);
  outline-offset: 2px;
}
```

### Touch

Mobile target tối thiểu 44×44px cho nav, CTA và action.

### Screen reader

- Table thật dùng `<table><thead>`.
- Timeline/list dùng semantic list.
- Chart có text summary hoặc `aria-label`.
- Icon-only rail item có `aria-label` + tooltip.
- Không dùng màu là tín hiệu duy nhất.

---

## 12. Motion

- Animate supporting visual, không animate money number đếm lên.
- 120–450ms.
- Hover/elevation rất nhẹ.
- `prefers-reduced-motion` tắt motion không thiết yếu.

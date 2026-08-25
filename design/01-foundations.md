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
  --canvas: #EDF3F8;
  --card: #FFFFFF;
  --wash: #E3ECF2;

  /* hero card — the only surface using --hero */
  --hero: #B5CDE8;
  --hero-deep: #ACC6E3;

  /* text */
  --ink: #0F1011;
  --ink2: #596268;
  --ink3: #6B767C;

  /* action */
  --action: #0F1011;
  --action-inverse: #FFFFFF;

  /* data / state */
  --data-primary: #73A4D7;
  --positive: #8FCDA4;
  --attention: #8A6410;
  --alert: #A8341F;

  --committed: #D8E0E4;
  --protect: #AFC0C7;
  --model: #EEF6F1;

  /* relation */
  --divider: #EEF1F2;

  /* geometry */
  --radius-hero: 28px;
  --radius-card: 22px;
  --radius-control: 14px;
  --radius-pill: 999px;

  /* elevation — overlay only */
  --shadow-overlay: 0 18px 50px rgba(20, 34, 43, 0.16);
}
```

### 2.2 Surface hierarchy

Default hierarchy:

```txt
canvas
→ top-level cards (hero card là một trong số đó)
→ content
```

**`--canvas` là nền của mọi thứ** — shell, sidebar, header, content. Card đứng
trực tiếp trên canvas.

**`--hero` chỉ dùng cho hero card**, không phải nền trang. Nó là một card nằm
trong page, không phủ viewport.

**Hard constraint:** top-level card phải là direct surface của composition.
Không tạo:

```txt
canvas
→ white sheet / group panel
  → card
    → rounded card con
```

Card không cần một `panel` khác để “gom nhóm”.

### 2.3 Card default

- Background `--card`.
- Không border mặc định.
- **Shadow `none`.** Card tách khỏi canvas bằng lightness step (1.12), không
  bằng elevation.
- Radius 22px.
- Card đứng trực tiếp trên `--canvas`.
- Nếu relation đọc được bằng spacing/alignment thì không thêm divider.
- Nếu cần divider, dùng 1px low-contrast ở đúng relation cần tách.

### 2.4 `--wash`

`--wash` `#E3ECF2` không phải một card level. Nó tách khỏi `--card` 1.20 — đủ
để đọc là một control nằm trong card, không đủ để đọc là một card khác.

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

Hero là một **card**, không phải nền trang. Nó là surface duy nhất được dùng `--hero`.

Dùng cho:

```txt
page identity
financial context
shared household context
coverage/freshness context
```

Default:

- Màu xanh nhạt `--hero` `#B5CDE8`.
- **Radius 28px** — nó là card, đứng trực tiếp trên canvas.
- Có thể dùng blue-on-blue tonal gradient rất nhẹ nếu cần depth.
- Text trong hero card dùng `--ink` (11.7:1). **Không dùng chữ trắng** —
  trên `#B5CDE8` chữ trắng chỉ đạt 1.63:1, trượt cả ngưỡng large text.
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

Weight GIẢM theo size. Đây là điểm đảo so với v4 — trước đây display là 300 và
body là 400, tức là chữ càng to càng mảnh và chữ càng nhỏ càng dày, khiến các
dòng caption dày đặc nặng hơn cả con số chúng chú thích.

```txt
500 Medium
→ display heading (t-display)
→ card title / subsection title (t-title, t-subtitle)
→ nav, button, semantic label, status/action text
→ nhấn bên trong một bậc: tên khoản trong row dày

400 Regular
→ hero money (t-hero)
→ figure / metric (t-figure, t-metric)
→ subheading trong văn bản (t-subhead)

300 Light
→ body (t-body, t-body-sm)
→ metadata (t-caption, t-caption-sm)
→ mọi supporting copy
```

600/700 KHÔNG tồn tại: Urbanist chỉ load 300/400/500 (`web/index.html`), nên
gọi 600 là bắt browser tự bôi đậm ra một weight giả. `npm run lint` chặn.

### 5.3 Core type scale

Scale này từng viết bằng KHOẢNG (`56–72px`, `36–44px`), và đó chính là thứ đã
làm app trôi ra 35 size khác nhau trên ~800 chỗ: "hero" là 56 ở card này, 60 ở
card kia, 72 ở card thứ ba — không ai chọn cả, nó chỉ là hệ quả của việc size
được quyết định tại chỗ gọi.

Giờ mỗi bậc là MỘT giá trị, và size/weight không bao giờ viết ở chỗ gọi nữa:
component gọi tên vai trò, scale quyết định hình dáng.

```txt
t-display       72px / 500 / -0.035em / lh 1.02    page hero, mỗi trang một cái
t-hero          56px / 400 / -0.04em  / lh 1.05    số tiền chính của trang
t-figure        40px / 400 / -0.035em / lh 1.1     số chính của một section
t-metric        28px / 400 / -0.03em  / lh 1.15    số trong summary strip
t-title         24px / 500 / -0.02em  / lh 1.3     <h2> đầu card
t-subtitle      20px / 500 / -0.01em  / lh 1.35    <h3> một cấp bên trong
t-subhead       20px / 400            / lh 1.3     subheading trong văn bản
t-body          16px / 300            / lh 1.5     nội dung
t-body-sm       14px / 300            / lh 1.5     row dày đặc — bảng, list
t-caption       12px / 300            / lh 1.45    metadata
t-caption-sm    11px / 300            / lh 1.4     nhãn trục, nhãn biểu đồ — sàn
```

Weight giảm theo size — đó là thứ làm bề mặt đọc ra "airy": dòng display là 500
duy nhất trong nhóm số, hai bậc tiền là 400, và mọi thứ từ body trở xuống là 300.

Weight trong mỗi bậc là MẶC ĐỊNH, không phải khoá: nhấn bên trong một bậc vẫn
được (`font-medium` cho tên khoản trong row dày). Thứ không được phép là một
size nằm ngoài mười một bậc này.

`t-title` / `t-subtitle` là bậc HOÀN CHỈNH — tự set size và weight, không bao
giờ ghép với một `t-*` khác. Heading phải lớn hơn thứ nó giới thiệu: `t-title`
24 cao hơn hẳn `t-subhead` 20; `t-subtitle` cùng 20px nhưng thắng bằng weight.
`t-page-tracking` là ngoại lệ duy nhất — một modifier chỉ mang tracking, cố ý
để ghép với một bậc, vì page title trải từ `t-metric` đến `t-display`.

Định nghĩa: `web/src/index.css`. Kiểm tra: `web/scripts/check-type-scale.mjs`
(chạy trong `npm run lint`) — `text-[Npx]`, preset Tailwind, `font-semibold`,
và việc ghép bậc vào title class đều fail build.

### 5.4 Minimum readable size

`t-caption-sm` (11px) là SÀN. Không có bậc nào nhỏ hơn, kể cả cho decorative —
trước đây có 9px và 10px rải rác, và ở cỡ đó dấu tiếng Việt không còn phân giải
được ở khoảng cách đọc bình thường.

12px (`t-caption`) là bậc bình thường cho metadata có ý nghĩa; 11px dành cho
nhãn trục và nhãn biểu đồ.

### 5.5 Vietnamese

- Body tiếng Việt dùng 300 (`t-body`), theo scale — không còn 400.
- Heading tiếng Việt dùng 500 (`t-title`), không dùng 300: ở weight mảnh, dấu
  tiếng Việt là thứ mất trước tiên.
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

### Scale

```txt
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 48
```

28 nằm trong scale (trước đây thiếu, dù chính bảng dưới đã dùng nó cho page
edge và hero padding — code dùng 71 chỗ).

### Applied

Mỗi vị trí là MỘT giá trị, không phải khoảng. Khoảng là thứ đã cho phép cùng
một vị trí render ra ba số khác nhau.

```txt
Page edge desktop          28px      .s-page @lg
Page edge mobile           16px      .s-page
Hero padding desktop       28px
Card padding desktop       24px      .s-card @sm
Card padding mobile        20px      .s-card
Card → card gap            12px      .s-card-gap
Section → section          20px      .s-section-gap
Header → body              28px      .s-head-body
Large internal column gap  48px/32px .s-split-gap
Dense row                  10px dọc  .s-row
Touch target               44px min  .s-tap
```

Năm vị trí trên là những chỗ design system có RÀNG BUỘC, nên chúng là class chứ
không phải số — cùng lý do type dùng `.t-*` thay vì `text-[16px]`. Chỗ khác vẫn
dùng Tailwind bình thường (`mt-4` giữa hai đoạn văn không mang luật gì cả),
miễn là nằm trên scale.

`.s-tap` giữ nguyên kích thước VẼ RA của control và chỉ nới vùng chạm quanh nó,
nên một toolbar dày vẫn dày mà mọi nút vẫn chạm được.

Định nghĩa: `web/src/index.css`. Kiểm tra: `web/scripts/check-design-scale.mjs`.

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
card shadow = none
```

Shadow không còn là một tier của card. Lightness step giữa `--card` và
`--canvas` là thứ duy nhất vẽ ranh giới.

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
  Trên `--card`: ink 19.1, ink2 6.2, ink3 4.7 — đều pass. `--ink3` được nâng
  từ `#879398` (3.15, fail) lên `#6B767C` vì nó mang metadata 12px.
- `--attention` `#8A6410` và `--alert` `#A8341F` là bản đã tối đi để đạt AA
  khi dùng làm text; sắc nhạt gốc chỉ dùng làm fill.
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

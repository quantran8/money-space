# 02 — UI Components

> v5.0 — component system theo flat card language: top-level surface trực tiếp trên canvas, ít elevation, không nested card.

## 1. Hero surface

Hero là atmospheric page surface.

Hero không phải một element có radius — nó là page ground. Page identity nằm
trực tiếp trên nền, rồi canvas sheet nâng lên chứa card grid:

```html
<div class="page-ground">
  <nav>…</nav>
  <header>
    <p class="subheading">Tài chính gia đình</p>
    <h1 class="display">Bức tranh hôm nay</h1>
  </header>

  <div class="canvas-sheet">
    <!-- card grid -->
  </div>
</div>
```

### Có thể chứa

```txt
page identity
household context
coverage/freshness metadata
1–2 compact source chips nếu thật sự giúp đọc context
```

### Không chứa

```txt
4–6 KPI card con
duplicate money values
full chart
management table
```

Canvas sheet là surface duy nhất gom card. Bên trong sheet, card là direct
child — không có group panel nào khác.

---

## 2. Top-level card

Card là grouping surface chính.

```html
<article class="rounded-[22px] bg-white p-5">
  ...
</article>
```

Default:

- Background white.
- Không border.
- **Shadow `none`.**
- Radius 22px.
- Padding 20–24px desktop.
- Direct child của page/card grid.

### Card header

Default:

```txt
title trái
+
metadata HOẶC action phải
```

Không thêm subtitle filler.

### Hard rule — no nested card

Không dùng:

```txt
card
→ rounded summary box
→ rounded metric box
→ rounded notice box
```

Bên trong card ưu tiên:

```txt
text
metric
divider
row
chart
inline status
control
```

---

## 3. KPI / answer card

Dùng khi một metric thật sự trả lời một câu hỏi cấp section.

Structure:

```txt
title
scope / metadata
large number
optional status line
optional visualization
```

Ví dụ:

```txt
Sau các khoản đã có nhiệm vụ
48,2 tr
Tính từ 5 nguồn · tất cả đều mới
[composition bar]
```

Rules:

- Number 36–44px Light.
- Không tạo một card riêng cho mỗi số chỉ để lấp grid.
- Không lặp number ở card khác.
- Static metric không dùng action color.

---

## 4. Inline summary

Thay cho “summary card con”.

Structure:

```txt
label ........ value
label ........ value
```

hoặc:

```txt
label
large value
divider
supporting rows
```

Không cần background, border hoặc radius nếu relation đã rõ.

---

## 5. Divider

Divider là internal relation primitive.

```css
.divider {
  height: 1px;
  background: #EEF1F2;
}
```

Dùng khi spacing không đủ để cho thấy grouping.

Không dùng divider sau mọi row theo thói quen.

---

## 6. Wash / field surface

`--wash` chủ yếu dành cho controls.

### Field

```txt
background --wash
no border at rest
radius 12–14px
focus ring --action
label rõ
```

Ví dụ:

```html
<label>Số tiền</label>
<div class="field">
  <input />
</div>
```

Field được phép là rounded surface vì nó là control, không phải content card.

---

## 7. Button

### Primary

```txt
background  --action
text        --action-inverse
radius      full hoặc 12–14px
shadow      none
weight      Medium
```

Nhãn ≤4 từ khi có thể.

Ví dụ:

```txt
Thêm khoản
Tạo mục tiêu
Xem ảnh hưởng
Lưu thay đổi
```

### Secondary

Ưu tiên:

```txt
text action
icon + text
subtle wash control
```

Không tự thêm border button nếu text action đã đủ affordance.

---

## 8. Navigation

### Desktop rail

Compact rail được phép:

```txt
width 68–76px
active item = dark filled circle
inactive = line icon
tooltip + aria-label bắt buộc
```

Nếu một product area không đọc được bằng icon, dùng labeled sidebar thay vì ép icon-only.

### Top context switcher

Có thể dùng pill group cho 3–5 view cùng cấp:

```txt
Tổng quan
Sắp tới
Mục tiêu
...
```

Active dùng `--action`.

Không dùng pill nav cho item phụ/management chỉ vì “trông giống reference”.

### Mobile

Bottom nav giữ label rõ; không icon-only cho core navigation.

---

## 9. Status indicator

Normal state:

```txt
● + text
```

hoặc text thuần.

Colored pill chỉ khi state thật sự cần chú ý/hành động.

```txt
positive   → green
attention  → yellow
alert      → coral
```

Không dùng green pill cho “normal / synced / active” mặc định.

---

## 10. Data row

Dùng cho 1–6 item hoặc compact preview.

Structure:

```txt
primary
secondary metadata
amount / consequence right aligned
```

Default:

- Không card per row.
- Không border per row.
- Optional divider giữa groups.
- Interactive row hover bằng `--wash`.
- Amount tabular.

---

## 11. Dense table

Dùng khi:

```txt
≥3 rows trên desktop và cần cross-row comparison
management/detail view
```

Rules:

- Header rõ.
- Số căn phải.
- Row không border mặc định.
- Không bọc table trong một card con nếu parent card đã là surface.
- Summary đặt dưới table bằng inline summary hoặc wash strip khi cần.

Table >10 rows có thể zebra cực nhạt.

---

## 12. Timeline / sequence

Time-based data ưu tiên ordered rows.

Mỗi event có thể gồm:

```txt
Ngày
Khoản
Ai — nếu meaningful
Số tiền
Còn lại — nếu derive được
Status — khi cần xác nhận/stale
```

Không có data thì collapse field/cột.

Không tạo một rounded box cho mỗi event.

---

## 13. Running balance

States:

```txt
available           hiện số
stale input         hiện số tốt nhất + scope caveat
missing dependency  hiện “—” ở row + notice gần primary metric
error               giữ số cũ nếu có + local error
```

Không lặp ending balance ở summary nếu row cuối đã nói.

---

## 14. Chart

Chart chỉ render khi trả lời tốt hơn list.

Render khi:

- Có ≥2 meaningful points.
- Có running balance/low point thật.
- Visual giúp thấy consequence nhanh.

Không render khi:

- Missing starting balance.
- 1 event và list đã đủ.
- Chỉ để card “trông financial”.

### Visual treatment

Chart nằm trực tiếp trong card.

Không cần:

```txt
chart card
chart border
chart rounded container
```

Có thể dùng một baseline/divider hoặc very subtle wash khi chart cần contrast.

### Tick-bar treatment

Chart mặc định là một dãy tick mảnh, không phải bar đặc:

```txt
tick width 2px · gap 2px
màu --data-primary
low point / điểm cần chú ý dùng --attention
label hai đầu trục (ngày đầu · ngày cuối)
```

Tick mảnh khiến chart đọc như texture, không như một khối nặng — đó là lý do
nó nằm được trực tiếp trong card mà không cần container.

---

## 15. Composition bar

Money composition:

```txt
Đã có nhiệm vụ  → --committed
Linh hoạt        → --data-primary
```

Không dùng action color cho data composition.

Bar nằm trực tiếp dưới metric/legend.

Legend có thể lặp value vì nó phục vụ visualization.

---

## 16. Source coverage

Coverage là context của derived number.

Tất cả mới:

```txt
Tính từ 5 nguồn · tất cả đều mới
```

Có stale:

```txt
Tính từ 5 nguồn · 2 cần cập nhật
Chưa gồm VCB và tiền mặt.
```

Treatment:

- text line;
- optional thin segmented strip;
- không warning card;
- không confidence %.

---

## 17. Empty state

Empty state **không phải card con**.

Trong top-level card:

```txt
title
divider hoặc spacing
empty state content trực tiếp
action
```

Ví dụ:

```txt
30 ngày tới

Chưa có khoản nào
[Thêm khoản]
```

Icon optional, chỉ một icon anchor nếu giúp scan.

---

## 18. Dependency notice

Dependency notice nói một missing input cụ thể.

Ví dụ:

```txt
Chưa có số dư đầu kỳ.
[Thêm nguồn tiền]
```

Default treatment:

```txt
plain text + action
```

Chỉ dùng `--wash` nếu notice cần tách khỏi một dense list.

Không biến notice thành alert card nếu đây không phải lỗi.

---

## 19. Simulation surface

Simulation được phép khác actual state vì đây là modeled data.

Treatment:

```txt
background --model hoặc tonal blue
marker: Nếu thực hiện
optional dashed divider/border
```

Consequence chỉ xuất hiện sau user action.

Bên trong simulation surface ưu tiên:

```txt
columns
dividers
rows
```

Không tạo 3–5 rounded metric cards con.

---

## 20. Modal / side sheet

Overlay là nơi elevation rõ được phép.

Desktop:

```txt
dialog hoặc side sheet
radius 22–28px
shadow overlay
```

Mobile:

```txt
bottom sheet hoặc route riêng
```

What-if, create/edit flow có thể dùng modal/sheet.

---

## 21. Forms

Default:

- 3–4 fields visible.
- Không hỏi thứ app đã biết.
- Label sans Regular/Medium.
- Helper chỉ khi nói scope/constraint/consequence.
- Money input normal control size.
- Không hero-size input.

Validation:

- Lỗi tại field.
- Giữ input.
- Không đóng modal khi save lỗi.
- Destructive action cuối flow.
- Không cần danger card có border.

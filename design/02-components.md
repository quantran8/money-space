# 02 — UI Components

## 1. Panel

Panel là top-level grouping surface.

```html
<section class="rounded-[14px] bg-[var(--panel)] p-5 sm:p-8">
  ...
</section>
```

### Default

Header:

```txt
Title trái + một secondary item phải
```

Secondary item thường là metadata **hoặc** action.

### Exception

Detail page có thể có cả metadata + action khi cả hai cần thiết và không lặp nghĩa. Home preview vẫn ưu tiên một item.

Không thêm subtitle nếu title + content đã đủ context.

## 2. Sunk block

`--sunk` là surface primitive, không phải một component duy nhất.

Variants:

```txt
summary       tổng / derived output
field         input area
notice        dependency / scope caveat
visualization chart / composition
```

Các variant cùng nền nhưng khác padding, alignment và affordance.

### Field variant

Input không cần border ở rest state nhưng phải có affordance:

```txt
background --sunk
focus ring --interactive
placeholder đủ contrast
cursor + label rõ
```

Không dùng sunk block như “card con” cho mọi item.

## 3. Semantic labels

Không còn class `.label` khóa IBM Plex Mono.

```txt
ui-label     Be Vietnam Pro; có thể chứa tiếng Việt
meta-mono    IBM Plex Mono; ASCII only
```

Ví dụ:

```html
<p class="ui-label">Thấp nhất dự kiến</p>
<p class="meta-mono">22/08 — 21/09 · 4</p>
```

## 4. Button

### Primary

- Background `--interactive`.
- Radius 8–10px.
- Không shadow.
- Nhãn ≤ 4 từ khi có thể.

### Secondary/link

Accent text chỉ dùng khi có action thật.

Không tô accent cho static metric để tránh lẫn với interaction.

## 5. Status indicator

Normal status không cần colored pill.

Default:

```txt
● + text
```

Color chỉ khi status cần attention/action. State luôn có text.

## 6. Data row primitives

### Grouped row

Dùng cho 1–6 item nhỏ, đặc biệt time sequence.

```txt
primary info
secondary metadata
amount / consequence aligned right
```

Không border mặc định. Hover/focus bằng `--sunk` khi row interactive.

### Dense table

Dùng khi:

```txt
≥3 rows trên desktop Home
hoặc management/detail view
hoặc khi cross-row comparison là nhiệm vụ chính
```

Không dùng table chỉ vì dữ liệu “có cột”. 1–2 rows thường nên là grouped rows.

Rules:

- Header có label rõ, không quá nhạt.
- Số căn phải, tabular.
- Row không divider mặc định.
- Summary là sunk block riêng.
- Table >10 rows có thể dùng zebra cực nhạt.

## 7. Timeline / sequence

Time-based data ưu tiên timeline/list primitive.

Mỗi event có thể gồm:

```txt
Date
Name
Actor nếu meaningful
Amount
Running balance nếu derive được
Confidence/unconfirmed nếu có
```

Cột/field không có data thì **collapse**, không để một cột rỗng làm layout kéo giãn.

## 8. Running balance

Running balance là derived field, không phải required UI decoration.

States:

```txt
available           hiện số
stale input          hiện số tốt nhất + scope caveat
missing dependency   hiện “—” ở row + notice ở scope gần nhất
error                 giữ số cũ nếu có + local error
```

Không lặp cùng một ending balance ở summary nếu nó đã là row cuối.

## 9. Chart

Chart chỉ render khi answer tốt hơn list.

### Render khi

- Có ít nhất 2 meaningful points.
- Có running balance/low point thật để user đọc.
- Visual giúp thấy consequence nhanh hơn row list.

### Không render khi

- Missing starting balance.
- Chỉ có một event mà list đã nói đủ.
- Chart chỉ để section “trông financial”.

Low point marker dùng attention khi cần, không tự suy ra “gần nguy hiểm” nếu user chưa đặt threshold.

## 10. Composition bar

Money composition là 2 phần:

```txt
Đã có nhiệm vụ    --committed
Linh hoạt          --interactive (do đây là primary concept của product)
```

Bar là visualization exception cho rule “một dữ kiện, một chỗ”: legend có thể lặp giá trị để hình đọc được.

## 11. Source coverage strip

Một segment = một source. Strip là context của derived number, không phải warning card.

Có stale source:

```txt
Tính từ 5 nguồn · 2 cần cập nhật
Chưa gồm VCB và tiền mặt.
```

Tất cả mới:

```txt
Tính từ 5 nguồn · tất cả đều mới
```

Không dùng confidence %.

## 12. Simulation surface

Simulation là vùng duy nhất có thể dùng treatment khác rõ ràng vì nó biểu thị “chưa phải số thật”.

- Background `--interactive-soft`.
- Có đúng một textual marker: `Nếu thực hiện`.
- Có thể dùng dashed border nếu cần để phân biệt modeled vs actual.
- Consequence chỉ xuất hiện sau user action.

## 13. Forms

### Default structure

- 3–4 fields visible mặc định.
- Không hỏi thứ app đã biết.
- Field label dùng sans, không dùng mono uppercase.
- Helper chỉ khi nói scope/constraint/consequence.
- Money input dùng normal control size, không hero size.

### Validation

- Lỗi tại field.
- Giữ input user đã nhập.
- Không đóng modal khi save lỗi.
- Destructive action đặt cuối flow; không cần “danger card” có border.

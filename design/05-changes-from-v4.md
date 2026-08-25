# 05 — What changed, and why

> v5.0 — the decisions that separate this system from v4.2, recorded so nobody
> has to re-derive them from a diff.

## 1. Interaction is ink, not green

v4 used `--accent: #0a6b47` for every CTA, every active nav item and the
flexible-money segment. v5 splits interaction from data semantics:

```txt
--action        CTA, active nav, action link        → ink #0F1011
--data-primary  chart / composition / data emphasis → blue #73A4D7
--positive      consequence thật sự tốt             → green #8FCDA4
```

Green now means a good consequence, never “this is clickable”. A static metric
never wears the action colour.

## 2. Hero là card, không phải nền trang

`--canvas` là nền của mọi thứ: shell, sidebar, header, content. `--hero` chỉ
dùng cho **một** surface — hero card, radius 28px, đứng trực tiếp trên canvas
như mọi card khác.

Đã thử biến màu xanh thành page background full-bleed với một canvas sheet bọc
card grid. Bỏ, vì nó vi phạm chính §2.2: sheet là một tầng surface thừa giữa
page và card, đúng thứ mà v5 loại đi.

## 3. Card không còn shadow

`--shadow-card` bị bỏ. Card tách khỏi canvas bằng lightness step, không bằng
elevation. Shadow chỉ còn tồn tại cho overlay thật sự nổi — modal, dialog,
side sheet, popover.

Đây là lý do giá trị `--canvas` được tinh chỉnh có chủ đích: ở `#F7FCFF` card
chỉ tách 1.03 — gần như vô hình. `#EDF3F8` cho 1.12, đủ để card đọc được khi
không có gì khác vẽ ranh giới.

## 4. Surface values

| Token | v4.2 | v5 | Vì sao |
|---|---|---|---|
| canvas | `#EEF1F3` | `#EDF3F8` | cool cast, hợp với hero card xanh |
| card | `#FFFFFF` | `#FFFFFF` | — |
| wash | `#F5F7F8` | `#E3ECF2` | phải tách khỏi card 1.20 khi canvas sáng lên |
| divider | `#E5E9EC` | `#EEF1F2` | — |
| hero | — | `#B5CDE8` | hero card |

`--page` bị bỏ: sau khi sheet trở thành cấu trúc, canvas và page là cùng một
surface.

## 5. Ink ramp đạt AA

`--ink3` cũ `#879398` chỉ đạt **3.15:1** trên card trắng — fail AA cho metadata
12px mà chính nó mang. Nâng lên `#6B767C` (4.66). `--attention` và `--alert`
cũng tối đi để dùng được làm text:

```txt
ink        #0F1011   19.1
ink2       #596268    6.2
ink3       #6B767C    4.7
attention  #8A6410    5.4
alert      #A8341F    6.6
```

Sắc nhạt gốc (`#E1BE68`, `#E8A39A`) chỉ dùng làm fill, không làm text.

## 6. Chữ trắng trong hero card: không

Trên `#B5CDE8`, chữ trắng đạt **1.63:1** — trượt cả ngưỡng large text (3.0).
Text trong hero card dùng `--ink` (11.7:1). Muốn chữ trắng thì nền phải xuống
khoảng `#4576AC`, đậm hơn hẳn register hiện tại.

## 7. Typography

Urbanist 300/400/500 thay Be Vietnam Pro. Mono không còn là motif mặc định:
`.label` bỏ IBM Plex Mono, vì mono là **treatment cho ASCII**, không phải một
semantic role — và không bao giờ chạm vào tiếng Việt có dấu.

Money number dùng weight 400 (`t-hero`, `t-figure`, `t-metric`) — v4 để 300,
nhưng ở size lớn 300 quá mảnh để mang con số chính của trang. Weight giờ giảm
theo size: 500 cho display và heading, 400 cho các bậc tiền, 300 cho body và
metadata. Xem `01-foundations.md` §5.2–5.3.

## 8. Component structure

Ba component mang cấu trúc v4 và được viết lại, không chỉ đổi màu:

```txt
MetricCell   sunk box lồng trong card  → metric trực tiếp + divider
SubSection   tinted block              → label + spacing
TotalRow     sunk block dưới bảng      → inline summary + divider
```

`Sunk` vẫn tồn tại nhưng đổi nghĩa: nó là **control surface** — field, hover
row, chart bed — không phải một tier của card.

## 9. Token names

Code dùng đúng vocabulary của v5. Tên v4 còn lại như alias trong `index.css`
để caller cũ vẫn resolve:

```txt
--app    → --canvas      bg-app     → bg-canvas
--panel  → --card        bg-panel   → bg-card
--sunk   → --wash        bg-sunk    → bg-wash
--accent → --action      text-accent → text-action
--hair   → --divider     border-hair → border-divider
```

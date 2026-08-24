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

## 2. Page ground replaces the hero card

v4.2 và bản v5 đầu tiên coi hero là một card bo góc 28px nằm trên canvas xám.
Bản hiện tại theo đúng visual grammar của reference: **màu xanh là nền trang**,
full-bleed, không radius; nav và page identity nằm trực tiếp trên nó; rồi một
**canvas sheet** bo hai góc trên nâng lên từ đáy để chứa card grid.

Điều này ghi đè hai rule cũ:

- §2.2 từng cấm `page → white sheet → card grid`. Sheet giờ **là** cấu trúc —
  nhưng vẫn chỉ một tầng: bên trong sheet, card là direct child.
- §3 từng định nghĩa hero là surface radius 28px có card overlap.

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
| canvas | `#EEF1F3` | `#EDF3F8` | cool cast, hợp với page ground xanh |
| card | `#FFFFFF` | `#FFFFFF` | — |
| wash | `#F5F7F8` | `#E3ECF2` | phải tách khỏi card 1.20 khi canvas sáng lên |
| divider | `#E5E9EC` | `#EEF1F2` | — |
| hero | — | `#B5CDE8` | page ground |

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

## 6. Chữ trắng trên page ground: không

Trên `#B5CDE8`, chữ trắng đạt **1.63:1** — trượt cả ngưỡng large text (3.0).
Text trên page ground dùng `--ink` (11.7:1). Muốn chữ trắng thì nền phải xuống
khoảng `#4576AC`, đậm hơn hẳn register hiện tại.

## 7. Typography

Urbanist 300/400/500 thay Be Vietnam Pro. Mono không còn là motif mặc định:
`.label` bỏ IBM Plex Mono, vì mono là **treatment cho ASCII**, không phải một
semantic role — và không bao giờ chạm vào tiếng Việt có dấu.

Money number dùng weight 300, không phải 500.

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

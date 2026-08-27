# Oursight Design System v5.0

Airy, cool, flat financial workspace. Lấy visual grammar từ Clerio nhưng giữ
information architecture và product semantics riêng của Oursight.

## Files

| File                                                   | Nội dung                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [01-foundations.md](01-foundations.md)                 | Surface, colour, typography, money format, spacing, radius, accessibility                          |
| [02-components.md](02-components.md)                   | 21 component: hero card, card, KPI, button, field, row, table, chart, coverage, empty state, modal |
| [03-patterns-and-states.md](03-patterns-and-states.md) | Composition, state matrix, density, responsive                                                     |
| [04-product-recipes.md](04-product-recipes.md)         | Recipe riêng của Oursight — Home IA, forecast, goal, privacy, app shell                            |
| [05-changes-from-v4.md](05-changes-from-v4.md)         | Những gì đổi so với v4.2 và vì sao                                                                 |

## Ba điều quyết định nhất

**Interaction là ink, không phải green.** `--action` `#0F1011` mang CTA;
`--data-primary` mang chart và composition; green chỉ còn nghĩa là một
consequence thật sự tốt.

**Hero là card, không phải nền trang.** `--canvas` là nền của mọi thứ; `--hero`
`#B5CDE8` chỉ dùng cho một surface duy nhất — hero card, radius 28px, đứng trực
tiếp trên canvas.

**Card không có shadow, không có border.** Lightness step giữa `--card` và
`--canvas` (1.12) là thứ duy nhất vẽ ranh giới — nên giá trị canvas được tinh
chỉnh có chủ đích, không chọn tuỳ tiện.

## Trạng thái

Spec này khớp với code đang chạy ở `web/src/index.css` — 22 token, kiểm tra
từng giá trị. Styleguide canvas ở `design-v5-styleguide/`.

Hệ v4.2 cũ nằm trong git history (commit `580da95`), không còn trong cây làm
việc.

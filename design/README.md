# Money Space Design System v4.2

> Tách **visual system**, **UI components**, **composition/state patterns** và **product recipes** thành bốn lớp độc lập. v4.2 giữ hướng thị giác của v4.1 nhưng sửa kiến trúc spec để UI thích nghi tốt hơn với dữ liệu thật.

## Vì sao v4.2

v4.1 đã chốt được visual language: panel trắng trên nền có sắc, ít màu, không shadow, mật độ dữ liệu thật, forecast-first. Vấn đề còn lại là spec trộn quá nhiều tầng quyết định và dùng nhiều luật tuyệt đối, khiến implementation có thể “đúng spec” nhưng không hợp data state.

v4.2 sửa 6 điểm:

1. Tách **Foundation / Component / Pattern / Product recipe**.
2. Phân biệt **Hard constraint / Default / Recipe** thay vì mọi rule đều là “bắt buộc”.
3. Thêm **adaptive composition** theo data density và availability của primary metric.
4. Thêm state **dependency missing**: có domain data nhưng thiếu input để derive một số.
5. Sửa contradiction typography: mono chỉ dùng ASCII; `.label` không còn đồng nghĩa với IBM Plex Mono.
6. Tách **interaction color** khỏi **data semantics**; money direction mặc định neutral.

## Cấu trúc

- `01-foundations.md` — màu, surface, typography, spacing, responsive primitives, accessibility.
- `02-components.md` — panel, labels, button, field, sunk block, table/list, chart, status, simulation.
- `03-patterns-and-states.md` — adaptive composition, data density, state matrix, copy budget, responsive behavior.
- `04-product-recipes.md` — Money Space specific: Home, 30 ngày tới, Goals, Assets, Debt, Household, What-if, Nhật ký.
- `05-migration-v4.1-to-v4.2.md` — thay đổi cần làm ở code/design hiện tại.

## Rule levels

### Hard constraint

Chỉ dùng cho trust, accessibility, privacy và data integrity.

Ví dụ:

```txt
Không hiển thị độ chính xác giả.
Không dùng màu làm tín hiệu trạng thái duy nhất.
Không ghi giao dịch cá nhân vào Nhật ký.
Một dữ kiện không lặp lại chỉ để làm UI đầy hơn.
```

### Default

Là lựa chọn mặc định, được phép phá khi có lý do thông tin rõ ràng.

```txt
Panel mặc định không border/shadow.
Table row mặc định không divider.
Section header mặc định có title + một metadata hoặc action.
Desktop section mặc định 2 cột khi cả hai cột đều có đủ nội dung.
```

### Recipe

Là cách ráp component cho một use case Money Space cụ thể. Recipe không được nâng thành rule toàn hệ thống.

## Decision order

Khi một màn hình khó xử lý, quyết định theo thứ tự:

```txt
1. Data integrity / trust
2. User question cần trả lời
3. State của dữ liệu
4. Density của dữ liệu
5. Composition
6. Component
7. Styling
```

Không đi ngược từ “component nào có sẵn” để ép data vào UI.

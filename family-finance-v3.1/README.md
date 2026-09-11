# Family Finance Product Spec v3.1

Bộ spec được tách theo domain để dễ đọc, chỉnh sửa và giao cho product/design/engineering.

## Mục lục

1. [00-overview.md](00-overview.md) — Product summary, target, thesis, core business hypothesis
2. [01-icp-positioning.md](01-icp-positioning.md) — ICP, life stage, positioning, use cases
3. [02-problems-jtbd.md](02-problems-jtbd.md) — Problems, jobs-to-be-done, key user moments
4. [03-product-architecture.md](03-product-architecture.md) — Product layers, principles, core concepts, sharing model
5. [04-mvp-features-flows.md](04-mvp-features-flows.md) — MVP scope, onboarding, screens, core flows
6. [05-calculation-data-model.md](05-calculation-data-model.md) — Forecast, flexible money, goal projection, data model
7. [06-pricing-metrics-validation.md](06-pricing-metrics-validation.md) — ⚠️ **Giả thuyết ban đầu, đã lỗi thời.** Giữ làm tư liệu lịch sử; phần metrics và validation vẫn dùng được
8. [07-roadmap-risks.md](07-roadmap-risks.md) — Build order, roadmap, risks, founder dogfood
9. [08-brand-copy-wireframes.md](08-brand-copy-wireframes.md) — Brand tone, copy examples, wireframes
10. [09-pricing-implemented.md](09-pricing-implemented.md) — **Giá đang chạy thật**: gói, khuyến mãi qua env, PayOS, mã kích hoạt
11. [10-feature-gating.md](10-feature-gating.md) — **Ranh giới Free/Premium đang chạy thật**: hạn mức, cơ chế chặn, paywall, cái gì chưa enforce

> **Về pricing:** dùng `09` và `10` làm tham chiếu. Chúng mô tả code đang chạy và
> nói rõ cái gì *chưa* được enforce. `06` viết trước khi sản phẩm được build —
> nó bán những thứ nay không còn tồn tại (Protected Reserve, mức chia sẻ
> `private`) và đề xuất gate những thứ không bao giờ nên gate.

## Đối chiếu code — 2026-09-10

Spec sản phẩm đóng băng 21/08, doc backend 28/08, code chạy tiếp tới 09/09. Đã
rà lại toàn bộ, lấy **code làm nguồn sự thật**. Chỗ nào lệch thì gắn khối ⚠️
ngay tại mục đó và giữ nội dung cũ làm tư liệu lịch sử, thay vì xoá.

Ba thay đổi lớn nhất so với spec gốc:

1. **Mô hình chia sẻ 3 mức đã bị gỡ hoàn toàn** (`03 §4`). Mọi khoản đều tính
   vào mọi con số chung; không có mức `private`, không redaction ở server.
   Thay bằng nhật ký (`/activity`).
2. **Không còn bậc quyền** (`05 §7`, `Backend-Tables §8`, `§31`). `role` và
   `permission_level` đã drop. Là thành viên = đọc/ghi mọi thứ; chỉ 3 thao tác
   vòng đời bị gác bởi `households.created_by`.
3. **Onboarding còn 1 bước** thay vì 11 (`04 §4`).

Đã kiểm và **khớp**, không phải sửa: forecast 7/30/60/90, bốn trạng thái tài
chính, công thức tiến độ goal, what-if stateless, `protected_reserves` đã gỡ,
`audit_logs snapshot.created`.

Còn nợ — mới ghi nhận, chưa sửa:

- `asset_valuations` và `snapshot_goal_values` **thiếu unique index trên DB
  thật** (`Backend-Tables §16`). Chưa hỏng dữ liệu; nên thêm.
- 4 rule attention chết vì mất nơi lưu (`§21`).
- `FinancialManagementMode` + 10 key i18n mồ côi (`04 §4`).
- `backend/memory/sharing-levels.md` còn tả `visibility_level` 2 mức — cột đó
  đã bị drop sau đó.

## Product architecture

**Financial Clarity → Financial Foresight → Financial Decision**

- Clarity tạo adoption.
- Foresight tạo retention.
- Decision support tạo willingness to pay.

## Primary ICP

Couples 25–37 tuổi, sắp cưới hoặc đã cưới, có ít nhất một financial goal đáng kể và có nhu cầu cùng hiểu bức tranh tài chính mà không cần gộp toàn bộ tiền hoặc theo dõi từng khoản nhỏ.

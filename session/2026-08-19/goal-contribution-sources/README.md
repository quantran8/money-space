# Nhịp góp chỉ tính từ ví, và thanh tiến độ giải thích được biến động

- **Date**: 2026-08-19
- **Session folder**: `session/2026-08-19/goal-contribution-sources/`
- **Status**: done

## What the task is

Ba nhận xét liên tiếp của user, cùng chỉ vào một chỗ:

> *"phần đóng góp hàng tháng này cần được tách rõ ràng là từ cash/bank account
> chứ k phải từ biến động giá lên xuống của các loại asset kiểu investment"*

> *"form tạo cũng cần phân biệt rõ là asset được tính vào goal và asset nào sẽ
> là nguồn contribute trực tiếp goal hàng tháng"*

> *"goal 500tr, vàng 250tr tính 100% vào goal, process 50%, ngày hôm sau giá
> giảm, process tự đổi, user sẽ k hiểu điều gì xảy ra"*
> → *"thanh tiến độ phải giải thích được sự biến động của nó"*

### Vì sao lượt trước tôi bảo "chưa làm được"

Tôi định tách lãi/lỗ bằng `quantity × Δgiá`, cần `quantity`/`unit_price` trong
snapshot — không có. Đó là **đường vòng**. User chỉ đường thẳng: đừng đo tài sản
đầu tư nữa. Ví không có giá thị trường, số dư chỉ đổi khi nhà thu/chi. Không cần
tách vì **không có gì để tách**.

## Changes made

### Backend — `money-space-backend/`

- `prisma/migrations/20260819180000_goal_allocation_roles/` — enum
  `GoalAllocationRole`, cột `goal_asset_allocations.role` (backfill ví →
  `contribution`), cột `snapshot_goal_values.contribution_progress_amount`.
- `domain/goal-progress.ts` — thêm `resolveContributionProgressAmount`. Tiến độ
  tổng **giữ nguyên**.
- `domain/goal-monthly-progress.ts` — `delta` đọc `contributionAmount`; thêm
  `holdingsAmount`; `hasContributionSource` tắt `planned`;
  `conversionCreditByMonth` bù trừ chuyển đổi; `buildConversionCredit` mới.
- `domain/goal-progress-change.ts` (MỚI, pure) — delta so với mốc chốt gần nhất +
  danh sách asset đã đổi, xếp theo mức đổi.
- `snapshots` — `getGoalLines` chốt hai con số trong cùng vòng lặp;
  `findGoalProgressPoints` trả thêm `contributionAmount` (null cho dòng cũ);
  `findGoalProgressChangeBasis` mới.
- `goals.service.ts` — `defaultRoleMap`; create/update allocation nhận `role`;
  `monthlyProgress` truyền đủ ba tuỳ chọn; `progressChange` mới.
- `prisma-goals.repository.ts` — `findGoalConversionPurchases`.
- `goals.controller.ts` — `GET :goalId/progress-change`.
- Tests: **366/366 pass** (351 → 366). Thêm `goal-progress-change.spec.ts` và 7
  case mới cho nhịp góp.

### Frontend — `money-space-frontend/`

- `goals.repository.ts` — `GoalAllocationRole`, `holdingsAmount`,
  `GoalProgressChange`, `getGoalProgressChange`.
- `goals-form.ts` — `GoalAllocationDraft.role`, `defaultAllocationRole`.
- `goal-allocations-field.tsx` + `goal-allocation-dialog.tsx` — `Segmented`
  "Nguồn góp hàng tháng / Đã tích luỹ"; đổi asset thì re-seed vai; ghi chú "theo
  giá thị trường, giá trị sẽ thay đổi" dưới dòng `holding`.
- `goal-monthly-progress-section.tsx` — ẩn cột dự định/chênh lệch khi goal không
  có nguồn góp; dòng `TotalRow` "Đã tích luỹ".
- `goal-progress-change.tsx` (MỚI) + `use-goal-progress-change.ts` — dòng giải
  thích dưới thanh tiến độ.
- `query-keys.ts`, `i18n/resources.ts` (vi + en).

### Spec + memory

`04-mvp-features-flows.md` §8.1 (bảng vai), §8.2B (MỚI — thanh tiến độ tự giải
thích), §8.4 (viết lại); `Backend-Tables-….md` §20B/§20C; `memory/goals.md` +
`memory/snapshots-and-networth.md` đồng bộ hai repo.

## Key decisions

- **Vai do nhà khai, không suy theo `type`.** Type chỉ seed mặc định. Một nhà có
  ví chi tiêu và ví để dành phải nói được chỉ ví thứ hai mới tính — suy tự động
  thì tính cả hai.
- **Tiến độ tổng không đổi.** Chỉ cột nhịp góp mới lọc. Goal vẫn là tất cả những
  gì nhà có hướng tới mục tiêu đó.
- **Không đóng băng giá tài sản.** Đóng băng vàng ở 250tr sẽ báo 50% trong khi
  bán ra chỉ được 240tr — không phải dễ hiểu hơn, mà là **trả lời sai**, và đúng
  là con số lơ lửng mà `earmark` từng là. Giữ cách tính, thêm giải thích.
- **Bù trừ chuyển đổi — đổi ý so với lượt trước.** Tôi từng bảo "phải đoán nên
  không làm". Không còn đúng: `asset_purchase` giờ mang `from_asset_id` (bước 1
  hôm nay), nên biết chắc cả hai đầu có cùng thuộc goal không. Mua ngoài goal thì
  **không** bù — tiền đó thật sự rời khỏi mục tiêu.
- **Không backfill snapshot cũ.** Tính lại từ `snapshot_asset_values` + phân bổ
  hiện tại sẽ khiến thêm một ví hôm nay làm đổi nhịp góp tháng 6 — đúng lớp lỗi
  mà "chốt số thay vì tính lại" dựng lên để tránh. Dòng cũ trả `null`, panel hiện
  "—" chứ không phải "0": phân biệt "chưa ghi nhận" với "thật sự không góp".
- **Goal không có nguồn góp thì bỏ hẳn hai cột.** Báo "thiếu 10tr" mỗi tháng cho
  mục tiêu nhà chưa từng định góp tiền mặt vào là phán xét một kế hoạch không ai
  đặt ra.
- **Dòng giải thích im lặng khi không có gì để nói** — không đổi, hoặc chưa có
  mốc trước. Một dòng ghi "không thay đổi" là tiếng ồn.

## Mobile app parity notes

Cần port:

- Chọn vai (nguồn góp / đã tích luỹ) trong form tạo goal và dialog sửa
  allocation, kèm re-seed khi đổi asset.
- Panel nhịp góp: ẩn cột dự định/chênh lệch khi goal không có nguồn góp; dòng
  "Đã tích luỹ".
- Dòng giải thích dưới thanh tiến độ, kèm quy tắc: ghi ngày khi mốc trước không
  phải hôm qua, tối đa 2 asset, im lặng khi không đổi, dùng `attention` không
  dùng `alert`.

Không có phần nào web-specific trong đợt này.

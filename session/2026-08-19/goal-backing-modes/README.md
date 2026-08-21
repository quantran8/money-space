# Goal backing modes — tiền dành cho goal là tiền thật

- **Date**: 2026-08-19
- **Session folder**: `session/2026-08-19/goal-backing-modes/`
- **Status**: done

## What the task is

`FinancialGoal.current_amount` hoạt động gần như một con số progress độc lập,
trong khi tiền thật nằm ở `assets.current_value`. Backend từng "sửa" bằng cách
bắt mỗi `goal_contribution` debit một ví thật — nhưng net worth là
`Σ assets − debt` và không bao giờ cộng goal lại, nên **góp 10tr vào goal làm
household nghèo đi 10tr**. Tiền rời bảng cân đối và không đáp xuống đâu cả.

Ngoài ra: không có đường lấy tiền ra, và model không mô tả được trường hợp thật
của user — vàng, crypto, chứng khoán, tiền mặt **cùng** nuôi một mục tiêu, mỗi
thứ chỉ góp **một phần**.

## Changes made

### Backend (`money-space-backend`)

- `prisma/migrations/20260819120000_goal_backing_modes/` — enum
  `GoalBackingMode` / `GoalAllocationKind`, cột `financial_goals.backing_mode`,
  bảng `goal_asset_allocations`. **Backfill hoàn tiền**: credit lại mọi ví đã bị
  debit bởi contribution cũ, soft-delete các valuation point tương ứng, xóa
  `from_asset_id`.
- `src/modules/goals/domain/goal-progress.ts` (mới, pure) —
  `resolveGoalProgressAmount`, `sumAllocatedAgainstAsset`. + spec 11 test.
- `src/modules/goals/goals.service.ts` — CRUD allocation, đổi mode, chặn
  over-allocation, resolve progress cho list/detail. + spec 22 test (trước đó
  module này **không có** test nào).
- `src/modules/money-events/money-events.service.ts` —
  `assertGoalContributionSource` → `assertGoalEventRules`;
  `applyGoalContributionEffects` → `applyGoalMirrorEffects` (xử lý cả expense).
- `dashboard.service.ts` — thêm `earmarkedForGoals` / `unassigned`;
  `netWorth` **không đổi**.
- `forecast.service.ts` — what-if và goalProjection dùng progress đã resolve.
- `memory/goals.md`, `money-events.md`, `dashboard.md`.

### Frontend (`money-space-frontend`)

- `features/goals/api/goals.repository.ts` — `backingMode`, allocation CRUD,
  `setGoalBackingMode`.
- `hooks/use-goals.ts`, `use-goal-allocations.ts` (mới), `use-goals-page.ts`.
- `ui/components/goal-allocations-section.tsx` (mới) — thêm/sửa/bỏ phần tài sản.
- `goal-contribution-dialog.tsx` — **bỏ hẳn ô chọn ví**; preview nói rõ tiền
  không đi đâu cả.
- `goal-form-dialog.tsx` — chọn mode lúc tạo; ẩn ô "đã có" khi asset_backed.
- `features/events/…/actual-record-form.tsx` — ô tùy chọn "Lấy từ mục tiêu nào?"
  trên expense (goal earmark).
- `dashboard/…/goals-section.tsx` — split "Đã dành cho mục tiêu" / "Chưa gán".
- `i18n/resources.ts` — key mới cho cả `vi` + `en`; gỡ key wallet-picker.
- `memory/goals.md`, `money-events.md`, `dashboard.md`.

### Spec (`family-finance-v3.1/`)

`Backend-Tables-…-v3.1.md` §20 + §20B mới, `05-calculation-data-model.md` §4.0/§5
+ conceptual model (đổi `MoneySource` → `Asset`, gỡ field đã drop),
`03-product-architecture.md`, `04-mvp-features-flows.md` §8.1–8.4.

### UI pass — bám design system v4.1

Vòng đầu tôi nối logic nhưng hand-roll UI. Audit lại theo `design.md` cho thấy
nhiều vi phạm; đã sửa:

- **`bg-paper` và `shadow-soft` không tồn tại** trong `index.css` → panel phân bổ
  đang render **không nền, không bóng**. Thay bằng `Panel` / `Sunk` / `TotalRow`.
- Bỏ bản sao `GoalField` / `controlClass` / `inputClass` — chúng là bản sao
  từng ký tự của `Field` / `fieldShell` / `fieldInput` trong `form-22.tsx`.
- **2-card picker → `Segmented`** (§22.3) ở cả chọn backing mode và chọn
  fixed/percent. `bg-accent-soft` là surface dành riêng cho consequence (§11.7),
  dùng cho toggle là đốt mất nó.
- **Lưới nhãn-giá trị → `Consequence` + `Num`** (§22.7: hệ quả là một *câu*, lưới
  ba ô là ngôn ngữ báo cáo).
- **Nút chính không còn `disabled`** (§22.10) → form goal chuyển sang
  `mode: 'onSubmit'` + `reValidateMode: 'onChange'` + `shouldFocusError`.
- Thêm phân bổ chuyển từ inline draft sang **dialog** (`goal-allocation-dialog.tsx`),
  khớp mọi luồng create khác trong app; panel dùng khuôn hàng của
  `debts-list-section` + `DropdownMenu` để xóa.
- `PlanTile` → `MetricCell`; split trên Home → 2 `MetricCell`; bảng goals 13→14px,
  `th` `font-normal`, bar hand-rolled → `Progress`, bỏ `%` thừa (§12.3).
- Thang chữ detail page: page title 30/36px → `page-title` (19px), hero 54→64px,
  15px → 14px, `PictureMetric` 20→22px.
- **Xóa `primary-goal-card.tsx`** — dead code, toàn class v2 không tồn tại.

### Vòng 3 — vá các lỗ hổng LUỒNG (không phải style)

Vòng 2 tôi sửa style nhưng luồng vẫn cụt. Audit lại theo hành trình người dùng:

- **Tạo goal asset_backed xong là dead end** — không có bước 2, goal nằm đó 0%.
  → create điều hướng thẳng sang `/goals/:id?allocate=1`, mở luôn dialog chọn
  tài sản. Toast riêng cho mode này.
- **Đổi mode: KHÔNG có UI nào gọi `changeBackingMode`** (dead code), trong khi
  form edit lại hiện "cách tính: đã khóa" → chọn sai lúc tạo = xóa làm lại.
  → `GoalBackingModeDialog` + mục "Đổi cách tính" trong menu goal.
- **Không có đường SỬA allocation** (`updateGoalAllocation` là dead code); mà
  dialog thêm lại ẩn asset đã gán → muốn đổi 50tr thành 80tr phải xóa rồi thêm
  lại. → `GoalAllocationDialog` nhận prop `editing` (khóa asset, chỉ sửa phần
  góp) + mục "Sửa" trong menu dòng.
- **Nút "Đóng góp" bị ẩn nhưng không thay bằng gì** → hành động thật của mode
  asset_backed vô hình ở mọi màn danh sách. → mỗi mode có primary action riêng:
  "Đóng góp" vs "Tài sản góp vào".
- **Gỡ link goal khỏi expense không lưu được** — `'' || undefined` bị
  `JSON.stringify` bỏ khỏi PATCH body → backend giữ link cũ, goal thiếu tiền
  vĩnh viễn. → gửi `null` trên đường edit; backend phân biệt null (xóa link) và
  undefined (giữ nguyên).
- **`goalOptions` filter fail-open** (`!== 'asset_backed'`) → `=== 'earmark'`.
- **Goal asset_backed chưa gán tài sản bị gắn cờ "chậm tiến độ"** trên Home —
  `buildGoalTracks` tính mốc theo mô hình góp hàng tháng. → mode này không có
  milestone, nên không bao giờ bị gắn cờ.
- Summary strip cộng `plannedMonthlyContribution` của cả goal asset_backed →
  chỉ cộng goal earmark.
- Panel "Lịch sử đóng góp" hiện vĩnh viễn rỗng trên goal asset_backed → ẩn.
- Empty state của allocations giờ có nút CTA tại chỗ; menu dòng goal thêm "Xem
  chi tiết" (trước đó chỉ vào được bằng cách bấm cả dòng, không có affordance).

## Key decisions

- **Hai mode, không trộn.** `earmark` (nhãn trên ví chung) và `asset_backed`
  (phần của nhiều asset). Một goal chỉ một nguồn sự thật cho progress.
- **Góp vào goal không debit gì.** `goal_contribution` bị **cấm** mang
  `fromAssetId` — đảo ngược rule cũ. Vì event không link asset nào,
  `applyWalletEffects` tự no-op và reverse đối xứng miễn phí; **không** thêm
  nhánh goal nào vào lớp effect.
- **Không có event "rút khỏi goal".** Rút = **chi tiêu**: expense mang
  `financialGoalId` (earmark) hoặc chỉ cần chi từ asset (asset_backed). Một event
  riêng sẽ lại là đường thứ hai chỉnh progress mà không có tiền di chuyển.
- **Phân bổ theo phần**, `fixed` hoặc `percent` do user chọn mỗi dòng. `fixed`
  bị **cap ở giá trị asset** khi đọc — đó là lý do chi tiêu ở mode này không cần
  ghi gì phía goal.
- **Không trừ earmark vào flexible money.** Đó đúng là công thức của
  `protected_reserves` đã bị gỡ, và goal có `planned_monthly_contribution` thì
  forecast đã kéo số dư xuống rồi → trừ hai lần. Thay bằng split hiển thị.
- **Đổi mode là endpoint riêng**, không phải field PATCH (`UpdateFinancialGoalDto`
  `Omit` cả `currentAmount` lẫn `backingMode`) — vì nó quyết định số cũ đi đâu.
- **Vòng đời sửa/xóa đầy đủ cho allocation**, rút kinh nghiệm `protected_reserves`
  chết vì màn sửa không bao giờ được mount.

## Mobile app parity notes

- Port toàn bộ: chọn mode lúc tạo goal, panel phân bổ, bỏ wallet picker khỏi
  contribution, ô "Lấy từ mục tiêu nào?" trên form chi tiêu, split trên Home.
- Nhớ: contribution **không** gửi `fromAssetId` (API trả 400 nếu có).
- `currentAmount` trên card đã được server resolve — **đừng** tự tính lại từ
  allocations.

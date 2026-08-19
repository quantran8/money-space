# Goal = tập phân bổ từ asset (bỏ earmark) + theo dõi nhịp góp hàng tháng

- **Date**: 2026-08-19
- **Session folder**: `session/2026-08-19/goals-asset-backed-only/`
- **Status**: done

## What the task is

Vòng trước dựng **hai** backing mode. User cắt trúng chỗ sai:

> *"từ tiền chung hay tài sản thì bản chất vẫn phải chọn assets gắn với goal"*
> *"tiền chung ở đây đc hiểu là 1 asset type cash/bank account"*

Đúng. "Tiền chung" không phải thực thể riêng — nó **là** asset `cash`/`bank_account`.
`earmark` để con số lơ lửng không neo vào asset nào, nên không ai trả lời được
"100tr đó nằm ở đâu", và vì là con số khai tay nó vượt được tổng tài sản thật —
đó là lý do dashboard phải có `Math.min(totalAssets, …)`.

User cũng nêu một yêu cầu model chưa đáp ứng:

> *"set target phân bổ hàng tháng là 10tr, tháng 1 đúng 10tr, tháng 2 bị tiêu mất
> 2tr và chỉ còn 8tr đc phân bổ vào"*

## Changes made

### Backend

- `prisma/migrations/20260819160000_goals_asset_backed_only/` — reset goal data,
  drop `backing_mode` / `current_amount` / `GoalBackingMode`, **rebuild
  `MoneyEventType`** bỏ `goal_contribution` (Postgres không có `DROP VALUE`),
  tạo bảng `snapshot_goal_values`.
- `domain/goal-progress.ts` — `resolveGoalProgressAmount(allocations, assetValues)`.
- `domain/goal-monthly-progress.ts` **(mới, pure)** + 9 test.
- `goals.service.ts` — create nhận `allocations[]` trong một transaction;
  `monthlyProgress()`; bỏ `setBackingMode` / `assertAssetBacked`.
- `money-events` — gỡ `goal_contribution`, `financialGoalId`, toàn bộ mirror.
  Xóa `money-events.goal-mirror.spec.ts`.
- `snapshots` — `getGoalLines()` + `findGoalProgressPoints()`, ghi goal lines
  cùng transaction với asset lines.
- `dashboard` — bỏ `Math.min` cap.

### Frontend

- `goal-allocations-field.tsx` **(mới)** — chọn tài sản ngay trong form tạo.
- `goal-monthly-progress-section.tsx` + `use-goal-monthly-progress.ts` **(mới)** —
  panel "Tính đều đặn", thay panel lịch sử đóng góp.
- Xóa `goal-contribution-dialog.tsx`, `goal-backing-mode-dialog.tsx`.
- `events` — gỡ `goal_contribution` khỏi type/quick-action/form, gỡ ô "Lấy từ
  mục tiêu nào?", gỡ tab "Mục tiêu" (sẽ rỗng vĩnh viễn).
- i18n — gỡ toàn bộ key mồ côi, thêm `goals.monthly.*`, `goals.form.allocations*`.

### Spec + memory

`Backend-Tables-…-v3.1.md` §20 viết lại + §20C mới; `05` §4.0/§5.2; `03`; `04`
§8.1–8.4. `memory/goals.md`, `money-events.md`, `dashboard.md`,
`snapshots-and-networth.md` — đồng bộ cả hai repo.

## Key decisions

- **Một khái niệm duy nhất.** Goal = tập phần góp từ asset. Bỏ `backing_mode`,
  `current_amount`, `goal_contribution`, link expense→goal.
- **Bắt chọn asset ngay lúc tạo** (>= 1, API 400 nếu rỗng) — goal rỗng thì đứng
  0% mãi mãi và household không biết làm gì tiếp.
- **Reset dữ liệu cũ thay vì di trú.** `earmark` không lưu asset nguồn, nên mọi
  heuristic (ví lớn nhất / chia đều) đều là bịa ra quyết định household chưa từng
  khai — đúng lớp lỗi hai migration trước đã dẹp. DB dev chỉ có 1 goal có tiền.
- **Nhịp tháng = hiệu hai snapshot**, không phải bảng audit riêng. Delta đã gồm
  cả tiền góp, tiền tiêu, biến động giá.
- **Chốt số vào snapshot thay vì tính lại.** Allocation không có lịch sử — tính
  lại sẽ làm thêm asset hôm nay nâng cả tiến độ tháng 6.
- **Tháng đầu `delta: null`**, tháng không snapshot thì bỏ qua (không điền 0).
- **Bỏ `Math.min` cap ở dashboard** — bất biến per-allocation + chặn
  over-allocation đã đảm bảo tổng ≤ tổng tài sản.

### Lỗi có sẵn phát hiện được

`assertWithinAssetValue` so sánh số **đã cap** — khai 500tr từ asset 100tr không
bị từ chối (500 → cap 100, `100 + 0 > 100` là false). Giờ so số **khai**.

## Mobile app parity notes

- Port: form tạo goal kèm chọn tài sản, panel nhịp góp, panel phân bổ.
- **Không** còn `goal_contribution`, `financialGoalId` trên money event, hay tab
  "Mục tiêu" — nếu mobile còn, gỡ.
- `currentAmount` trên card đã resolve server-side; đừng tính lại.

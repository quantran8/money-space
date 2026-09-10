# 05 — Calculation Rules & Data Model

## 1. Forecast Horizon

Default:

**30 ngày**

Views:

- 7 ngày.
- 30 ngày.
- 60 ngày.
- 90 ngày later/paid.

---

# 2. Event Ordering

Forecast phải chạy theo thời gian, không chỉ cộng tổng tháng.

Ví dụ:

```text
Today                  20m
15 Aug Rent           -25m → -5m
20 Aug Salary         +30m → 25m
```

Dù end-of-month balance dương, household vẫn có cash-flow risk ngày 15.

Key output:

**Lowest Projected Balance**

---

# 3. Flexible Money

Projected available money:

```text
Current shared liquid money
+ sufficiently certain upcoming income
- required upcoming outflows
- explicitly committed amounts
```

Flexible money:

```text
Projected available money
```

Home nên dùng conservative logic:

```text
Flexible money today
=
Current liquid money
- Required outflows before next sufficiently-certain inflow
```

Hai công thức này từng trừ thêm protected reserve. Reserve đã được gỡ bỏ, nên
horizon form chính là `lowest projected balance` — không còn tên thứ hai cho
cùng một con số.

App phải cho user xem assumptions.

## Thật: có HAI con số, không phải một

Công thức đầu ("Projected available money") **không được implement**. Chỉ có
dạng conservative. Và cái Home hiển thị lại là một con số thứ ba:

| Con số | Công thức | Ai dùng |
|---|---|---|
| `flexibleMoneyToday` | `startingLiquidBalance − requiredOutflowsBeforeNextInflow` | field API; snapshot đóng băng cột này |
| **Số Home hiển thị** | `lowestProjectedBalance − goalCommitments` | hero + thanh chia trên Home |

`goalCommitments` = phần các mục tiêu đang giữ trong **cùng số tiền lỏng** mà
forecast xuất phát từ đó. Spec chưa bao giờ nêu nó. Nó là **field trả kèm**
trong kết quả, **không** trừ vào `flexibleMoneyToday` — client tự trừ.

Đo *sau* các khoản chi trong horizon, không phải trên số dư hôm nay: một khoản
chi xếp trên mục tiêu dùng chung ví, nên tiền mục tiêu co lại nhường chỗ. Nếu
đo trên số dư hôm nay trong khi `lowestProjectedBalance` đã trừ đúng các khoản
đó thì mỗi khoản bị trừ hai lần.

**Số âm là tín hiệu, không được kẹp về 0** ở hero. Thanh chia tỷ lệ trên Home có
kẹp `max(…, 0)` nhưng đó là quy tắc vẽ cho bề rộng dương, không phải sửa số.

> Nguồn: `backend/src/modules/forecast/domain/flexible-money.ts`,
> `frontend/packages/core/src/features/dashboard/model/home-derivations.ts`.

---

# 4. Goal Projection

## 4.0 Current amount đến từ đâu

```text
current = Σ goal_asset_allocations:
            kind='fixed'   → min(allocated_amount, asset value)
            kind='percent' → asset value × percent / 100
```

Goal không giữ tiền của riêng nó — nó là **một tập phần góp từ asset thật**.
"Để dành từ tiền chung" chỉ là một phần góp cố định từ asset `cash`/`bank_account`
đang giữ số đó. Vì vậy net worth không bao giờ đổi khi gán tiền cho goal. Xem
§20 / §20B.

```text
Remaining amount
=
Target amount - Current amount
```

```text
Estimated months to goal
≈
Remaining amount / Planned monthly contribution
```

Nếu contribution không được khai báo:

- Không show projected completion.
- Chỉ show progress.
- Prompt user bổ sung nếu muốn xem time impact.

MVP không cần investment-return assumptions.

---

# 5. Goal Impact / What-if

Nếu user simulate khoản chi X:

```text
Approximate goal delay
≈
Spend amount / Planned monthly contribution
```

Nếu tiền được lấy trực tiếp từ amount đã dành cho goal:

1. Trừ khỏi current goal amount.
2. Recalculate projected completion date.

What-if chỉ là **preview, không persist** (§26D). Hành động thật tương ứng chỉ
là **chi tiêu bình thường từ asset** đứng sau goal — progress tự giảm ở lần đọc
sau, vì phần `fixed` bị cap ở giá trị thực của asset.

Không có event "rút khỏi goal": một đường thứ hai chỉnh progress mà không có
tiền thật di chuyển chính là lớp lỗi model này dẹp bỏ.

## 5.2 Nhịp góp theo tháng

```text
delta(tháng N) = progress(snapshot cuối tháng N) − progress(snapshot cuối tháng N−1)
gap            = delta − planned_monthly_contribution
```

Trả lời đúng câu hỏi household hay hỏi: "định góp 10tr/tháng, tháng này được bao
nhiêu?". Delta đã gồm cả tiền góp thêm, tiền tiêu ra, và biến động giá. Nguồn dữ
liệu là `snapshot_goal_values` (§20C).

Simulation output:

- Obligations covered?
- Lowest projected balance before/after.
- Goal date before/after.
- Goal delay.
- Assumptions used.

---

# 6. Financial State Logic

## On Track

- Required obligations covered.
- Forecast không xuống mức critical.

## Watch

Một trong:

- Flexible money thấp.
- Large payment sắp tới.
- Một số critical data chưa confirm.

## Tight

Một trong:

- Required payment không được cover.
- Lowest projected balance âm.

## Incomplete

Thiếu data quan trọng.

Không diễn đạt các state như judgment.

---

# 7. Data Model

## User

- id
- name
- email
- phone
- avatar
- created_at

## Household

- id
- name
- currency
- created_by
- update_frequency
- created_at

## HouseholdMember

- id
- household_id
- user_id
- ~~role~~ — **không có cột này**
- status (`active` | `invited`)
- joined_at

> ⚠️ `role` (Owner/Partner) và `permission_level` đều **đã bị drop** khỏi DB
> (2026-08-15). Không có bậc quyền nào giữa hai partner: **là thành viên nghĩa
> là đọc/ghi được mọi thứ** trong không gian đó.
>
> "Owner" chỉ còn là **suy ra** từ `households.created_by`, và chỉ gác 3 thao
> tác vòng đời: xoá không gian, mời thành viên, xoá thành viên. Tự rời không
> gian là endpoint riêng (`DELETE /members/me`) nên không bị cổng đó chặn.
>
> Xem `Backend-Tables §31` và `03 §4`.

## Asset

(Tên trong DB là `assets`. "MoneySource" là tên khái niệm cũ.)

- id
- household_id
- name
- type
- valuation_mode
- current_value
- holder_member_id
- liquidity
- counts_as_flexible
- status
- updated_at
- note

`financial_nature`, `sharing_level`, `included_in_household_calculation` đã bị gỡ
— ý định "khoản này có tính là tiền linh hoạt không" nay nằm ở
`counts_as_flexible` và được materialize vào `liquidity`, cột duy nhất mọi nơi
đọc.

## CashflowEvent

- id
- household_id
- name
- direction
- amount
- expected_date
- recurrence
- requirement
- certainty
- owner_member_id
- status
- related_goal_id
- note

Direction:

- Incoming
- Outgoing

Requirement:

- Required
- Planned

Certainty:

- Confirmed
- Estimated

## FinancialGoal

- id
- household_id
- name
- category
- target_amount
- target_date
- planned_monthly_contribution
- priority
- status
- updated_at

## GoalAssetAllocation

Phần đóng góp của một asset vào một goal `asset_backed`.

- id
- household_id
- financial_goal_id
- asset_id
- kind                  (fixed | percent)
- allocated_amount      (khi kind = fixed)
- percent               (khi kind = percent)
- note

## Snapshot

- id
- household_id
- total_liquid
- upcoming_income_horizon
- upcoming_outgoing_horizon
- flexible_money
- lowest_projected_balance
- financial_state
- calculated_at

## ~~WhatIfScenario~~ — KHÔNG tồn tại

> ⚠️ Bảng này **không được build và không được build**. What-if là preview
> stateless: chạy xong trả kết quả rồi thôi, không ghi gì. Xem
> `Backend-Tables §26D` ("Không persist vào DB") và `§35` (danh sách không thêm).
>
> Code nói thẳng: `backend/src/modules/forecast/domain/what-if.ts` —
> *"There is no `what_if_scenarios` table and there must not be one."*
>
> Chỉ một dòng analytics được ghi (`what_if_run`), và nó cố ý **không chứa số
> tiền** — chỉ khoảng giá trị (`amountBucket`).

Danh sách field cũ, giữ làm tư liệu lịch sử:

- id, household_id, created_by, amount, planned_date, label, related_goal_id,
  before_flexible_money, after_flexible_money, before_goal_date, after_goal_date,
  goal_delay_days, lowest_projected_balance, obligations_covered, created_at

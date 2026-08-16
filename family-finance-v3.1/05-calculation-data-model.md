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

---

# 4. Goal Projection

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
- role
- joined_at

Role:

- Owner
- Partner

## MoneySource

- id
- household_id
- name
- type
- current_value
- holder_member_id
- liquidity
- financial_nature
- sharing_level
- included_in_household_calculation
- updated_at
- note

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
- current_amount
- target_date
- planned_monthly_contribution
- priority
- status
- updated_at

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

## WhatIfScenario

- id
- household_id
- created_by
- amount
- planned_date
- label
- related_goal_id
- before_flexible_money
- after_flexible_money
- before_goal_date
- after_goal_date
- goal_delay_days
- lowest_projected_balance
- obligations_covered
- created_at

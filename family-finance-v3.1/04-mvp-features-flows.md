# 04 — MVP Features & User Flows

## 1. MVP Hypotheses

### Hypothesis A — Financial Clarity

> Couples có nhu cầu thực sự về một shared financial picture mà không cần gộp toàn bộ tiền.

### Hypothesis B — Foresight

> User muốn biết phần tiền thực sự linh hoạt sau khi tính những gì sắp tới.

### Hypothesis C — Decision Value

> User sẽ mở app trước một meaningful financial decision và dùng consequence để hỗ trợ quyết định.

---

# 2. MVP Scope

1. Authentication.
2. Household.
3. Partner invite.
4. Money sources.
5. 3-level sharing.
6. Upcoming income.
7. Upcoming obligations.
8. 30-day forecast.
9. Flexible money.
10. One main financial goal.
11. Goal projection.
13. What-if simulator.
14. Share scenario.
15. Update reminders.
16. Analytics.

---

# 3. Không thuộc MVP Core

- Detailed expense tracking.
- Transaction categories.
- Bank linking.
- SMS parsing.
- Receipt scanning.
- AI financial advice.
- Investment forecasting.
- Advanced budgeting.
- Complex discussion threads.
- Voting system.
- Approval rules.
- Complex field-level permissions.
- Multiple household.
- Financial marketplace.

---

# 4. Onboarding

## Goal

Đưa user từ:

> “Tôi muốn hiểu tài chính nhà mình.”

tới:

> “Đây là số tiền thực sự linh hoạt.”

và cuối cùng:

> “Nếu chi X thì consequence là Y.”

## Flow

1. Tạo account.
2. Tạo household.
3. Chọn financial setup:
   - Tôi đang giữ phần lớn.
   - Người kia giữ phần lớn.
   - Mỗi người giữ một phần.
   - Cả hai cùng quản lý.
   - Chưa rõ.
4. Invite partner hoặc skip.
5. Nhập money sources.
6. Chọn holder và sharing level.
7. Nhập recurring income chính.
8. Nhập 1–3 upcoming obligations.
9. Tạo main goal.
10. App tạo first financial picture.
11. Prompt first what-if.

---

# 5. Activation

## Activation 1 — Clarity Moment

User lần đầu thấy:

> “Nhà mình hiện có X và sau các khoản đã biết còn Y linh hoạt.”

## Activation 2 — Consequence Moment

User chạy first meaningful what-if và thấy:

> “Nếu chi X thì flexible money/goal thay đổi Y.”

Đây là activation mạnh hơn và liên hệ trực tiếp tới willingness to pay.

---

# 6. Home

Priority:

1. Financial State.
2. Flexible Money.
3. What-if CTA.
4. 30 Days Ahead.
5. Money Location.
6. Main Goal.
7. Freshness.

Financial state:

- On track.
- Watch.
- Tight.
- Incomplete.

Primary CTA:

**Thử một khoản chi**

---

# 7. Upcoming Screen

Views:

- 7 ngày.
- 30 ngày.
- 60 ngày.

Timeline hiển thị:

- Starting balance.
- Incoming.
- Outgoing.
- Running projected balance.
- Lowest projected balance.

---

# 8. Goals Screen

Goal hiển thị:

- Current amount.
- Target amount.
- Progress.
- Target date.
- Projected completion date.
- Required monthly contribution nếu muốn hit target date.

Primary action:

**Thử một khoản chi**

---

# 9. Household Screen

Bao gồm:

- Members.
- Money sources.
- Holder.
- Sharing.
- Recurring income.
- Reminder frequency.
- Data freshness.

Không biến screen này thành settings-heavy admin panel.

---

# 10. What-if Simulator

## Entry Points

- Home.
- Goal detail.
- Upcoming.
- Shared scenario.

## Input

- Amount.
- Planned date.
- Optional goal.

## Result hierarchy

1. Upcoming Safety — lowest projected balance before/after, mức thay đổi, và
   cảnh báo khi obligations không còn đủ nguồn.
2. Goal consequence.
3. Assumptions.

Trước đây có 5 khối. “Reserve impact” mất cùng protected reserve, và “Flexible
Money before/after” mất theo: nó hiển thị `flexibleMoneyHorizon`, vốn sau khi bỏ
reserve chính là `lowestProjectedBalance` — đúng hai con số khối 1 đã nêu.

Actions:

- Share with partner.
- Save scenario.
- Try another amount.

Later:

- Mark decided.
- Compare scenarios.
- Discussion.

---

# 11. Household Sharing Flows

## Flow A — Một người giữ chính

1. A tạo household.
2. A nhập nguồn tiền.
3. Chọn sharing.
4. Invite B.
5. B thấy household picture.
6. Cả hai dùng forecast.
7. A/B có thể share what-if.

## Flow B — Mỗi người giữ một phần

1. A tạo household.
2. A nhập phần mình.
3. Invite B.
4. B nhập phần mình.
5. App aggregate shared data.
6. Cả hai thấy shared picture.
7. Forecast dùng data tổng hợp.

---

# 12. Data Freshness

Mỗi input có:

`updated_at`

Home có thể hiển thị:

> 5/7 nguồn tiền được cập nhật trong 30 ngày gần đây.

Tone:

> Có 2 khoản nên cập nhật để forecast chính xác hơn.

Quick action:

**Confirm unchanged**

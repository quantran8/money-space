# 07 — Build Order, Roadmap & Risks

## 1. Build Order

### Phase 0 — Calculation Prototype

Build bằng local/mock data:

1. Forecast.
2. Lowest balance.
3. Flexible money.
4. Goal projection.
5. What-if.

Validate formulas trước.

### Phase 1 — Solo User MVP

- Auth.
- Household.
- MoneySource.
- Reserve.
- Cashflow.
- Goal.
- Forecast.
- What-if.

Mục tiêu:

**Validate decision engine.**

### Phase 2 — Couple Sharing

- Partner invite.
- Shared data.
- Sharing level.
- Shared scenario.

Mục tiêu:

**Validate couple context.**

---

# 2. Roadmap

## Phase 0 — Dogfood & Prototype

- Founder household.
- 10–20 couples.
- Real purchase scenarios.
- Calculation validation.

## Phase 1 — Shared Clarity MVP

- Household.
- Partner.
- Money sources.
- Sharing.
- Reserve.
- Main goal.
- 30-day upcoming.
- Flexible money.
- What-if.

## Phase 2 — Better Foresight

- 60/90 days.
- Better recurrence.
- Running balance chart.
- Better confidence handling.
- Multiple goals.
- Required contribution.

## Phase 3 — Decision Collaboration

- Scenario history.
- Scenario comparison.
- Partner comments.
- Decision status.
- Goal impact history.

## Phase 4 — Automation

- CSV import.
- Screenshot-assisted update.
- Recurring event suggestion.
- Account integration nếu technically/legal feasible.

Automation chỉ nhằm giảm data entry.

## Phase 5 — Life Scenario Planning

Ví dụ:

- What if one income pauses?
- What if rent increases?
- What if we have a child?
- What if we buy a house this year?
- What if income increases 20%?
- What if goal priority changes?

---

# 3. Risks

## Risk 1 — User nghĩ đây là expense tracker

Mitigation:

- Không có Transactions tab.
- Home không lead bằng spending categories.
- Marketing lead bằng clarity + future.

## Risk 2 — Google Sheets đủ dùng

Mitigation:

- Flexible money.
- Forecast by date.
- Lowest balance.
- Goal-date impact.
- What-if.
- Couple sharing.
- Privacy-aware aggregation.

## Risk 3 — Data input quá mệt

Mitigation:

- Chỉ nhập meaningful financial data.
- Recurring event.
- Confirm unchanged.
- Quick update.
- Automation later.

## Risk 4 — Data stale làm forecast sai

Mitigation:

- Freshness indicator.
- Monthly check-in.
- Highlight assumptions.
- Confirm expected events.

## Risk 5 — User không tin calculation

Mitigation:

- Simple formulas.
- Explain assumptions.
- Confirmed vs estimated.
- “How this was calculated”.
- Không giả vờ precision tuyệt đối.

## Risk 6 — What-if usage quá ít để giữ subscription

Mitigation:

Recurring utility không chỉ dựa vào what-if.

Giữ loop:

- Snapshot.
- Upcoming.
- Flexible money.
- Goal.
- Monthly check-in.
- What-if.

Nếu usage frequency thấp:

Ưu tiên annual pricing hơn monthly.

## Risk 7 — Privacy trở thành blocker

Mitigation:

3 levels rõ ràng.

Không build complex matrix trước khi validate.

## Risk 8 — Couple conflict

App không:

- Gắn blame.
- Đánh dấu “ai gây ra”.
- Gửi notification mang tính tố cáo.

Product language luôn ở household level.

---

# 4. Founder Dogfood Questions

Trong 30–60 ngày, ghi lại:

- Khi nào mình thực sự muốn mở app?
- Có mở trước purchase không?
- Amount bao nhiêu thì bắt đầu muốn simulate?
- Có mở chỉ để xem tình hình không?
- Flexible money có tạo insight không?
- Partner có chủ động mở không?
- Partner có cần full details không?
- Data nào nhập mệt?
- Forecast nào khó tin?
- Có recurring event nào bị quên?
- Goal delay bao nhiêu khiến decision thay đổi?
- Có khi nào biết goal chậm nhưng vẫn mua? Vì sao?
- Monthly subscription có cảm thấy hợp lý không?
- Annual có tự nhiên hơn không?

Roadmap nên được quyết định bởi các answers này hơn là brainstorm feature.

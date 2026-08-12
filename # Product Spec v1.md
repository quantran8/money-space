# Product Spec v3 — App Tình Hình & Quyết Định Tài Chính Gia Đình

## 1. Tóm tắt sản phẩm

Sản phẩm là một app giúp vợ chồng/cặp đôi cùng hiểu:

1. **Tình hình tài chính gia đình hiện tại**
2. **Tiền đang nằm ở đâu và ai đang giữ/phụ trách**
3. **Những gì sẽ xảy ra với dòng tiền trong thời gian tới**
4. **Một quyết định chi tiêu hôm nay sẽ ảnh hưởng tới tài chính tương lai như thế nào**

App phục vụ được cả hai mô hình phổ biến:

- Một người đang giữ hoặc quản lý phần lớn tài chính gia đình.
- Mỗi người đang giữ hoặc phụ trách một phần tài chính khác nhau.

Sản phẩm không tập trung vào ghi từng khoản thu chi nhỏ hằng ngày.

Thay vào đó, app tập trung vào:

**Shared financial snapshot + cash-flow foresight + decision support**

Core loop:

**Money today → Money location/ownership → Upcoming cash-flow → Protected money → Flexible money → What-if decision → Goal impact → Shared understanding**

---

## 2. Câu hỏi sản phẩm phải trả lời

App cần trả lời được 5 câu hỏi theo thứ tự:

### 1. Nhà mình đang ổn không?

Tình hình tổng thể hiện tại như thế nào?

### 2. Tiền đang nằm ở đâu?

Tiền mặt, ngân hàng, tiết kiệm, quỹ dự phòng hoặc các khoản khác hiện đang do ai giữ/phụ trách?

### 3. Sắp tới có chuyện gì?

Trong 7–90 ngày tới có income hoặc obligation nào sẽ làm thay đổi dòng tiền?

### 4. Nhà mình thực sự có thể linh hoạt bao nhiêu?

Sau khi tính các nghĩa vụ đã biết và quỹ cần bảo vệ, còn bao nhiêu tiền có thể cân nhắc sử dụng?

### 5. Nếu chi khoản này thì sao?

Khoản chi có:

- Làm thiếu tiền cho nghĩa vụ gần không?
- Chạm quỹ an toàn không?
- Làm flexible money giảm bao nhiêu?
- Làm mục tiêu chung chậm bao lâu?

---

## 3. Định vị sản phẩm

### Một câu định vị

**Giúp hai người cùng biết nhà mình đang có gì, sắp cần gì và hôm nay có thể chi bao nhiêu mà không vô tình làm hỏng những gì đang chờ phía trước.**

### Phiên bản ngắn

**Biết tình hình. Nhìn trước. Rồi quyết định cùng nhau.**

### Product thesis

Ngân hàng thường trả lời:

> “Bạn đang có bao nhiêu tiền?”

Spreadsheet có thể trả lời:

> “Tổng tài sản của hai người là bao nhiêu?”

App này cần trả lời thêm:

> “Tiền đang nằm ở đâu và ai đang phụ trách?”

> “Sau những khoản sắp tới, nhà mình thực sự còn bao nhiêu tiền linh hoạt?”

> “Nếu chi X hôm nay, tương lai tài chính của hai người thay đổi thế nào?”

---

## 4. Không phải / Là gì

### Không phải

- Không phải app ghi thu chi cá nhân.
- Không phải app kế toán gia đình.
- Không bắt nhập từng giao dịch nhỏ.
- Không phải công cụ kiểm soát người giữ tiền.
- Không bắt hai người phải gộp toàn bộ tài chính.
- Không soi các khoản riêng tư của nhau.
- Không phải app đầu tư/chứng khoán.
- Không phải AI advisor quyết định thay người dùng.

### Là gì

- Là shared financial picture của household.
- Là nơi biết tiền đang nằm ở đâu.
- Là nơi biết ai đang giữ hoặc phụ trách khoản nào.
- Là cash-flow forecast cho những gì sắp tới.
- Là nơi tính flexible money.
- Là tool mô phỏng quyết định tài chính.
- Là nơi thể hiện opportunity cost của một khoản chi.
- Là shared source of truth cho hai người.

---

# 5. Vấn đề cần giải quyết

## 5.1. Gia đình không có một bức tranh tài chính chung

Có hai tình huống phổ biến.

### Case A — Một người giữ phần lớn tiền

Một người quản lý phần lớn:

- Tiền mặt
- Tài khoản
- Tiết kiệm
- Vàng
- Khoản vay
- Chi phí gia đình

Người kia vẫn có trách nhiệm và quyền lợi trong tài chính gia đình nhưng không có đủ thông tin.

Kết quả:

- Phải hỏi “còn bao nhiêu?”
- Người giữ tiền cảm thấy bị chất vấn.
- Người không giữ tiền cảm thấy bị đứng ngoài.

### Case B — Mỗi người giữ một phần

Ví dụ:

- Một người giữ tiền sinh hoạt.
- Một người giữ tiết kiệm.
- Một người trả tiền nhà.
- Người kia trả bảo hiểm.
- Một người giữ vàng.
- Người kia quản lý khoản vay.

Trong trường hợp này:

**Cả hai đều biết phần của mình, nhưng không ai biết toàn bộ.**

---

## 5.2. Account balance tạo cảm giác giàu hơn thực tế

Một household có thể thấy:

**128 triệu tiền thanh khoản**

nhưng trong vài tuần tới đã có:

- 15 triệu tiền nhà
- 12 triệu thẻ tín dụng
- 8 triệu bảo hiểm
- 40 triệu quỹ dự phòng cần giữ

Vì vậy:

**Balance ≠ Available to spend**

App cần chuyển mental model từ:

> “Nhà mình có bao nhiêu?”

sang:

> “Bao nhiêu trong số đó thực sự linh hoạt?”

---

## 5.3. Upcoming payment mới chỉ là reminder nếu không có forecast

Biết:

> “Ngày 18 phải trả 15 triệu”

chưa đủ.

User cần thấy:

> “Sau khoản đó còn bao nhiêu?”

và quan trọng hơn:

> “Có thời điểm nào tiền bị thiếu trước khi lương tiếp theo về không?”

Vì vậy forecast phải tính theo **thứ tự thời gian**, không chỉ tổng thu trừ tổng chi của tháng.

---

## 5.4. Goal dài hạn không ảnh hưởng đủ mạnh tới quyết định hôm nay

Một progress bar:

> 420m / 1.2B

không làm user cảm nhận rõ consequence của việc chi thêm 30m.

App cần dịch opportunity cost thành:

> “Mục tiêu mua nhà dự kiến từ Oct 2029 → Jan 2030.”

**Khoản chi = khoảng 3 tháng tiến độ.**

---

## 5.5. Privacy và minh bạch thường bị coi là hai lựa chọn đối lập

Người dùng không nhất thiết muốn:

> “Hoặc chia sẻ hết, hoặc không chia sẻ.”

Một khoản có thể:

- Là tài sản gia đình và chia sẻ đầy đủ.
- Được tính vào tổng household nhưng không hiện chi tiết.
- Hoàn toàn riêng tư.

App phải cho phép **shared picture mà không yêu cầu mất toàn bộ privacy**.

---

# 6. Jobs To Be Done

## Job 1 — Shared awareness

> Khi mở app, tôi muốn biết tình hình tổng thể của nhà mình mà không phải hỏi từng người hoặc mở nhiều tài khoản.

## Job 2 — Money location

> Khi tài chính được chia giữa hai người, tôi muốn biết tiền đang nằm ở đâu và ai đang phụ trách phần nào.

## Job 3 — Near-term foresight

> Khi có nhiều khoản sắp tới, tôi muốn biết liệu tiền hiện tại có cover đủ hay không.

## Job 4 — Spending decision

> Khi cân nhắc một khoản chi đáng kể, tôi muốn biết nó có thực sự affordable nếu tính cả nghĩa vụ gần và mục tiêu dài hạn.

## Job 5 — Shared decision

> Khi hai người cần quyết định một khoản tiền, tôi muốn cả hai nhìn cùng một consequence thay vì mỗi người tự tính theo một cách.

---

# 7. Người dùng mục tiêu

## Persona 1 — Người giữ phần lớn tiền

Nhu cầu:

- Chia sẻ tình hình mà không phải giải thích liên tục.
- Không muốn bị soi giao dịch nhỏ.
- Muốn plan nghĩa vụ sắp tới.
- Muốn kiểm soát mức chia sẻ.
- Muốn giảm cảm giác gánh toàn bộ tài chính một mình.

---

## Persona 2 — Người không giữ phần lớn tiền

Nhu cầu:

- Biết nhà còn bao nhiêu.
- Biết tiền đang ở đâu.
- Biết sắp có khoản lớn nào.
- Biết mục tiêu chung đang thế nào.
- Có context trước khi đưa ra quyết định.

---

## Persona 3 — Người phụ trách một phần tài chính

Ví dụ:

- Trả tiền nhà.
- Giữ quỹ dự phòng.
- Quản lý vàng.
- Trả bảo hiểm.
- Trả học phí.
- Giữ tiết kiệm.

Nhu cầu:

- Cập nhật phần mình phụ trách nhanh.
- Biết phần của người kia.
- Có bức tranh tổng thể thay vì hai bảng riêng biệt.

---

## Persona 4 — Cặp đôi mới cưới / đang xây hệ thống tài chính chung

Đặc điểm:

- Có tài khoản riêng.
- Có một số mục tiêu chung.
- Chưa muốn gộp toàn bộ tiền.
- Đang hình thành cách chia trách nhiệm tài chính.

Nhu cầu:

- Minh bạch vừa đủ.
- Biết ai phụ trách gì.
- Có một shared financial model.
- Hiểu tác động trước các quyết định lớn.

---

# 8. Insight chính

Người dùng không nhất thiết muốn biết:

> “Hôm qua ai mua cà phê 65.000đ?”

Họ muốn biết:

- Nhà mình đang có bao nhiêu?
- Tiền đang ở đâu?
- Ai đang giữ/phụ trách?
- Khoản nào đã được dành cho việc khác?
- 30 ngày tới có gì?
- Thời điểm căng nhất là lúc nào?
- Thực sự còn bao nhiêu tiền linh hoạt?
- Nếu chi X thì sao?
- Goal sẽ thay đổi thế nào?

### Core mental model

**Money exists → Money has location → Money has responsibility → Money is committed → Money is flexible → Decision → Future consequence**

---

# 9. Nguyên tắc sản phẩm

## 9.1. Decision trước, bookkeeping sau

Không yêu cầu user làm kế toán để nhận value.

Một input chỉ đáng nhập nếu nó giúp tạo ra một output như:

- Financial snapshot
- Forecast
- Flexible money
- Goal projection
- What-if consequence

---

## 9.2. Shared household, không phải surveillance

Không thiết kế quanh câu hỏi:

> “Ai tiêu khoản này?”

Ưu tiên:

- Nhà mình
- Tiền đang ở đâu
- Người phụ trách
- Khoản cần cập nhật
- Mục tiêu chung
- Cùng xem

---

## 9.3. Privacy by design

Minh bạch không đồng nghĩa chia sẻ toàn bộ.

User cần biết rõ trước khi lưu một khoản:

- Người kia thấy gì?
- Khoản có được tính vào household total không?
- Chi tiết nào được ẩn?

---

## 9.4. Tổng quan trước, chi tiết sau

Home phải trả lời được trong vài giây:

1. Nhà mình đang ổn không?
2. Flexible money là bao nhiêu?
3. 30 ngày tới có gì?
4. Tiền đang nằm ở đâu?
5. Goal chính đang đi đâu?

---

## 9.5. Không phán xét

Không dùng:

- Không được mua
- Quyết định xấu
- Hoang phí
- Tiêu quá nhiều

Ưu tiên:

> “Các khoản đã biết vẫn được cover.”

> “Quỹ an toàn sẽ thấp hơn mức bạn đặt.”

> “Mục tiêu dự kiến chậm khoảng 2 tháng.”

> “Bạn quyết định.”

---

## 9.6. Manual-first nhưng không manual-heavy

Không bắt nhập:

- Coffee
- Grab
- Ăn trưa
- Mọi transaction

Ưu tiên dữ liệu có ảnh hưởng tới financial model:

- Money source
- Current balance
- Income
- Upcoming obligation
- Reserve
- Goal
- Planned meaningful purchase

---

# 10. Core Concepts

## 10.1. Money Source

Một nơi đang giữ giá trị tài chính.

Ví dụ:

- Tiền mặt
- Tài khoản ngân hàng
- Ví điện tử
- Tiết kiệm
- Quỹ dự phòng
- Vàng có thể thanh khoản
- Khoản tiền khác user muốn tính vào snapshot

Fields:

- Name
- Type
- Current value
- Holder/member
- Liquidity
- Financial nature
- Sharing level
- Updated at
- Note

### Financial nature

- Household/shared
- Personal but included in household overview
- Holding/managing on behalf of household
- Personal/private

---

## 10.2. Sharing Level

MVP dùng 3 mức:

### Shared details

Partner thấy:

- Tên
- Loại
- Giá trị
- Người phụ trách
- Ghi chú nếu được chia sẻ

### Count in total only

Khoản được tính vào household model nhưng partner chỉ thấy:

- Giá trị đóng góp vào tổng
- Hoặc nhóm tài sản

Không thấy chi tiết nhạy cảm.

### Private

Không hiển thị cho partner và không tham gia shared calculation.

App phải nói rõ:

> “Khoản riêng tư sẽ không được tính vào flexible money chung.”

---

## 10.3. Upcoming Income

Fields:

- Name
- Amount
- Expected date
- Recurring / one-time
- Owner/member
- Confirmed / estimated

Ví dụ:

- Salary
- Bonus
- Freelance payment
- Refund

---

## 10.4. Upcoming Obligation

Fields:

- Name
- Amount
- Due date
- Recurring / one-time
- Required / planned
- Owner/member
- Confirmed / estimated
- Status

Ví dụ:

- Rent
- Loan
- Credit card
- Insurance
- Tuition
- Family support
- Planned trip payment

---

## 10.5. Protected Reserve

Số tiền household muốn bảo vệ và không coi là discretionary money.

Ví dụ:

> Emergency reserve tối thiểu 100m

Đây là một **constraint**, không nhất thiết là một bank account.

---

## 10.6. Financial Goal

Fields:

- Name
- Target amount
- Current amount
- Target date
- Planned monthly contribution
- Priority
- Owner/shared
- Status

---

## 10.7. Financial Snapshot

Snapshot là trạng thái được tính từ dữ liệu household tại một thời điểm.

Output:

- Total liquid
- Upcoming income
- Upcoming obligations
- Protected reserve
- Flexible money
- Lowest projected balance
- Goal projection
- Data freshness

---

## 10.8. Flexible Money

Concept trung tâm:

> **Số tiền household có thể cân nhắc sử dụng sau khi bảo vệ các nghĩa vụ và constraint đã khai báo.**

Không phải:

> “Tiền app khuyên bạn nên tiêu.”

Mà là:

> “Theo dữ liệu hiện có, đây là phần tiền chưa được các nghĩa vụ đã biết hoặc reserve chiếm dụng.”

---

## 10.9. What-if Scenario

Một simulation giả định, không phải transaction thật.

Input:

- Amount
- Planned date
- Label optional
- Goal muốn xem impact

Output:

- Obligations covered?
- Lowest balance after scenario
- Reserve protected?
- Flexible money before/after
- Goal date before/after
- Goal delay
- Assumptions used

---

# 11. Calculation Model MVP

## 11.1. Forecast

Forecast phải chạy theo event theo ngày:

```text
Starting balance
+ incoming event
- outgoing event
= running projected balance
```

Không chỉ cộng tổng cả tháng.

### Key metric

**Lowest projected balance trong horizon**

Ví dụ:

```text
Today                 20m
15 Aug Rent          -25m → -5m
20 Aug Salary        +30m → 25m
```

Tổng tháng cuối cùng vẫn dương nhưng ngày 15 household gặp vấn đề.

---

## 11.2. Flexible Money

Simple MVP model:

```text
Projected available money
= Current shared liquid money
+ sufficiently-certain incoming cash
- required upcoming outflows
- explicitly committed amounts

Flexible money
= Projected available money
- Protected reserve
```

Home có thể ưu tiên phiên bản conservative:

```text
Flexible money today
= Current liquid money
- Protected reserve
- Required outflows occurring before next sufficiently-certain inflow
```

App phải cho user xem assumptions.

---

## 11.3. Goal Projection

```text
Remaining amount
= Target amount - Current amount

Estimated months
≈ Remaining amount / Planned monthly contribution
```

MVP chưa cần investment-return model.

---

## 11.4. Goal Impact

Nếu user simulate khoản chi `X`:

```text
Approximate goal delay
≈ X / Planned monthly contribution
```

Nếu tiền chi được lấy trực tiếp từ amount đã dành cho goal thì:

1. Trừ vào current goal amount.
2. Recalculate projected completion date.

---

# 12. MVP Scope

MVP cần validate hai giả thuyết đồng thời:

### Shared-picture hypothesis

> Các cặp đôi muốn có một bức tranh tài chính chung dù tiền được giữ bởi một người hay phân tán giữa hai người.

### Decision-value hypothesis

> Các cặp đôi sẽ quay lại app trước các quyết định tài chính có ý nghĩa để kiểm tra consequence.

## MVP gồm 7 capability chính

1. Household + partner
2. Money sources / financial snapshot
3. Simple privacy/sharing
4. Upcoming income & obligations
5. Protected reserve + flexible money
6. Financial goal + projection
7. **Can We Spend This? / What-if simulator**

### Không thuộc MVP core

- Expense tracking chi tiết
- Bank linking
- AI advisor
- Complex investment model
- Full discussion/comment threads
- Complex permission matrix
- Approval workflow
- Multiple household
- Advanced budgeting

---

# 13. Onboarding

## Mục tiêu

Đưa user tới consequence insight nhanh nhất có thể mà vẫn hiểu household context.

### Flow

1. Tạo account.
2. Tạo household.
3. Chọn cách tài chính hiện đang được quản lý:
   - Tôi giữ phần lớn tiền.
   - Người kia giữ phần lớn tiền.
   - Mỗi người giữ/phụ trách một phần.
   - Cả hai cùng quản lý.

4. Invite partner hoặc skip.
5. Nhập money sources hiện tại.
6. Chọn holder và sharing level.
7. Đặt protected reserve.
8. Nhập recurring income chính.
9. Nhập 1–3 upcoming obligation.
10. Tạo một goal.
11. App tạo snapshot + 30-day forecast.
12. Prompt:

> “Có khoản nào hai người đang cân nhắc chi không?”

13. Chạy first what-if.

### Activation moment

Không phải:

> “Bạn đã tạo household.”

Cũng không chỉ là:

> “Dashboard đã hoàn tất.”

Activation mạnh nhất:

> **User lần đầu hiểu consequence của một decision bằng dữ liệu household của mình.**

---

# 14. Home / Financial Snapshot

Priority:

## 1. Financial state

- On track
- Watch
- Tight
- Incomplete

## 2. Flexible Money

Hiển thị prominent:

> **Có thể linh hoạt: 54.000.000đ**

Supporting copy:

> Sau các khoản sắp tới và quỹ an toàn đã đặt.

## 3. Next 30 Days

- Incoming
- Required outgoing
- Lowest projected balance
- Next important event

## 4. Primary CTA

**Can we spend this?**

hoặc copy tiếng Việt:

**Thử một khoản chi**

## 5. Money Location

> Tiền đang nằm ở đâu?

Có thể xem theo:

- Nhóm
- Người phụ trách

## 6. Main Goal

- Progress
- Projected date
- Contribution rate

## 7. Needs Update

Các khoản:

- Lâu chưa cập nhật
- Expected income chưa confirm
- Payment chưa confirm

---

# 15. Upcoming Timeline

Không chỉ là bill reminder.

Ví dụ:

```text
Today                       128m
15 Aug Salary       +45m → 173m
18 Aug Rent         -15m → 158m
22 Aug Credit card  -12m → 146m
28 Aug Insurance     -8m → 138m
01 Sep Goal          -20m → 118m
```

Hiển thị thêm:

> Lowest projected balance: 118m

Views:

- 7 days
- 30 days
- 60 days
- 90 days later/Pro

---

# 16. Can We Spend This?

## Core differentiator

### Input

```text
Khoản bạn đang cân nhắc

[ 30.000.000đ ]

Khi nào?
[ Hôm nay ]

Xem ảnh hưởng tới
[ Mua nhà ]

[ Kiểm tra ảnh hưởng ]
```

### Result hierarchy

## 1. Near-term coverage

> Các khoản đã biết trong 30 ngày vẫn được cover.

hoặc:

> Có một payment xảy ra trước kỳ lương tiếp theo có thể làm cash-flow bị thiếu.

## 2. Reserve

> Quỹ an toàn 40m vẫn được bảo vệ.

hoặc:

> Sau khoản này, số dư dự kiến thấp hơn reserve threshold khoảng 8m.

## 3. Flexible Money

```text
Before  54m
After   24m
```

## 4. Goal Impact

```text
Home goal

Before  Oct 2029
After   Jan 2030

Impact: khoảng 3 tháng
```

## 5. Assumptions

> Kết quả dựa trên current balance, income, upcoming payments, reserve và contribution bạn đã nhập.

### Actions

- Share with partner
- Save scenario
- Try another amount

Không cần ngay:

- Mark approved
- Voting
- Comment thread
- Full decision workflow

---

# 17. Household Sharing

## Case A — Một người giữ tiền chính

Một người:

1. Tạo household.
2. Nhập phần lớn money source.
3. Chọn sharing level.
4. Invite partner.
5. Partner thấy snapshot theo quyền chia sẻ.
6. Cả hai cùng xem forecast và what-if consequence.

---

## Case B — Mỗi người giữ một phần

1. User A tạo household.
2. A nhập các khoản mình giữ/phụ trách.
3. Invite B.
4. B nhập phần của mình.
5. App aggregate các khoản shared.
6. Dashboard tạo household view chung.
7. Hai người cùng sử dụng model cho forecast/decision.

Điểm quan trọng:

**App không yêu cầu chuyển tiền về một chỗ.**

Nó chỉ tạo một shared financial model.

---

# 18. Financial Goals

Goal không chỉ là progress bar.

Hiển thị:

```text
Home deposit

420m / 1.2B
35%

At current pace:
Oct 2029

Target:
Jun 2029

Để đạt target hiện tại:
cần thêm ~4.5m/tháng
```

Primary action:

**Thử một khoản chi với goal này**

Later:

- Goal impact history
- Scenario comparison
- Multiple contributions/member
- Prioritization

---

# 19. Data Freshness

Vì app manual-first, trust phụ thuộc vào freshness.

Mỗi financial input cần `updated_at`.

Home có thể hiển thị:

> 5/7 nguồn tiền đã được cập nhật trong 30 ngày gần đây.

Không dùng tone:

> “Dữ liệu của bạn quá cũ!”

Ưu tiên:

> “Có 2 khoản nên cập nhật để forecast chính xác hơn.”

---

# 20. Data Model MVP

## User

- id
- name
- email/phone
- avatar
- created_at

## Household

- id
- name
- currency
- created_by
- created_at
- update_frequency

## HouseholdMember

- id
- household_id
- user_id
- role
- joined_at

Role:

- Owner
- Partner

---

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

---

## CashflowEvent

- id
- household_id
- name
- direction: incoming / outgoing
- amount
- expected_date
- recurrence
- requirement: required / planned
- certainty: confirmed / estimated
- owner_member_id
- status
- related_goal_id
- note

---

## ProtectedReserve

- id
- household_id
- name
- amount
- updated_at
- note

MVP có thể chỉ support 1 reserve.

---

## FinancialGoal

- id
- household_id
- name
- target_amount
- current_amount
- target_date
- planned_monthly_contribution
- priority
- status
- updated_at

---

## Snapshot

- id
- household_id
- total_liquid
- upcoming_income_horizon
- upcoming_outgoing_horizon
- protected_reserve
- flexible_money
- lowest_projected_balance
- financial_state
- calculated_at

---

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
- reserve_protected
- created_at

---

# 21. Navigation MVP

Bottom navigation / main navigation nên tránh “Transactions”.

Đề xuất:

### Home

Snapshot + flexible money + CTA

### Upcoming

Forecast timeline

### Goals

Goal projection

### Household

Money sources + members + setup

What-if nên là:

- Primary CTA trên Home
- Entry point từ Goal
- Entry point từ Upcoming

không nhất thiết cần tab riêng.

---

# 22. Notifications

MVP:

- Upcoming required payment.
- Expected income cần confirm.
- Forecast có thời điểm tight.
- Monthly check-in.
- Partner shared scenario.
- Money source lâu chưa update.

### Tone

Không:

> “Bạn sắp hết tiền!”

Nên:

> “Có một thời điểm trong 14 ngày tới số dư dự kiến xuống thấp.”

Không:

> “Người kia thay đổi số tiền.”

Nên:

> “Tình hình tài chính nhà mình vừa được cập nhật.”

---

# 23. Metrics

## Activation

- % tạo household
- % thêm money source đầu tiên
- % thêm upcoming event
- % đặt reserve
- % tạo goal
- % invite partner
- % có data từ cả hai người
- **% chạy first what-if**

North-star activation:

> **User thấy first consequence insight trong session đầu hoặc onboarding period.**

---

## Engagement

- What-if simulations / household / month
- What-if repeat usage
- Upcoming timeline views
- Snapshot updates
- Goal projection views
- Partner scenario shares
- % household có dữ liệu do cả hai thành viên cập nhật

---

## Retention

- D7
- D30
- % household cập nhật snapshot lần 2
- % household chạy what-if ở ít nhất 2 tuần/tháng khác nhau
- % household có 2 members active

---

## Value metrics

- “Tôi hiểu nhà mình thực sự có thể chi bao nhiêu.”
- “Tôi hiểu tiền đang nằm ở đâu.”
- “Tôi biết ai đang phụ trách khoản nào.”
- “Tôi ít phải hỏi người kia hơn.”
- “App không tạo cảm giác bị kiểm soát.”
- “Tôi hiểu một khoản chi ảnh hưởng mục tiêu thế nào.”
- % user mở app trước một purchase meaningful

---

# 24. North Star

Không phải:

- Số transaction
- Dashboard views
- Số asset được nhập

Candidate:

> **% active households sử dụng foresight/what-if cho ít nhất một quyết định tài chính thực mỗi tháng.**

Supporting metric:

> **% active household duy trì shared financial picture đủ mới để decision engine sử dụng được.**

Hai metric này đại diện cho hai layer:

**Trust/data layer + decision layer**

---

# 25. MVP Success Criteria

Sau 30–45 ngày:

- ≥40% activated household chạy ít nhất 1 what-if.
- ≥25% chạy what-if lần 2 ở ngày khác.
- ≥30% cập nhật snapshot lần 2.
- ≥30% có ít nhất 3 cash-flow events.
- ≥25% invite partner.
- ≥15% household có data từ cả hai người.
- ≥20% có meaningful interaction từ partner.

Qualitative signal mạnh nếu user tự mô tả:

- “Biết mình thực sự có thể tiêu bao nhiêu.”
- “Biết tháng tới có thiếu không.”
- “Biết tiền đang nằm ở đâu.”
- “Biết mua cái này thì goal chậm bao lâu.”
- “Đỡ phải hỏi nhau.”

Signal mạnh nhất:

> **User chủ động mở app trước một quyết định tài chính có ý nghĩa mà không cần reminder.**

---

# 26. Những thứ không làm ở MVP

- Bank linking
- SMS banking parsing
- Receipt scanning
- Tracking mọi transaction
- Expense category budgeting
- Investment analytics
- AI advisor
- Credit score
- Full chat/discussion
- Voting/approval flow
- Complex field-level permissions
- Advanced investment projection
- Social feed
- Financial marketplace

---

# 27. Roadmap

## Phase 0 — Model & Dogfood

- Spreadsheet calculation model
- Test forecast formulas
- Test what-if
- Founder household dogfood
- Interview couple thật

Câu hỏi cần chứng minh:

> “Có moment lặp lại check impact trước khi chi không?”

---

## Phase 1 — Shared Foresight MVP

- Household
- Partner invite
- Money source
- 3-level sharing
- Upcoming income/outgoing
- Reserve
- 30-day forecast
- Flexible money
- Main goal
- Goal projection
- What-if spend
- Share scenario

---

## Phase 2 — Better Forecast

- 60/90 days
- Better recurring event
- Running balance visualization
- Lowest balance explanation
- Multiple goals
- Required contribution to target

---

## Phase 3 — Decision Collaboration

- Save scenarios
- Compare scenarios
- Decision history
- Partner reaction/comment nhẹ
- Agreement status
- Household decision rule

Ví dụ:

> Khoản trên 20m → gợi ý share với partner.

Không biến thành permission/control system.

---

## Phase 4 — Automation

- CSV import
- Screenshot-assisted update
- Faster balance update
- Recurring-event detection
- Bank integration nếu phù hợp

Automation chỉ nhằm giảm input.

Core mental model vẫn là:

**Know → Forecast → Decide**

---

## Phase 5 — Intelligent Planning

- If income changes
- One income pauses
- Goal trade-off
- Scenario comparison
- Required adjustment
- Multiple goals prioritization

Không mặc định đưa ra recommendation cá nhân hóa mạnh nếu model hoặc safeguards chưa đủ.

---

# 28. Pricing

Pricing phải nằm ở **decision value**, không phải database limits.

## Free

- 1 household
- 2 members
- Shared snapshot
- Money sources
- Upcoming 30 days
- Basic reserve
- 1 main goal
- Basic flexible money
- Limited what-if

## Pro

Potential:

- Unlimited what-if
- Full goal impact
- Multiple goals
- 60/90-day forecast
- Scenario comparison
- Scenario history
- Advanced recurring cash-flow
- Decision history
- Monthly foresight report
- Enhanced privacy/sharing
- Export/history

### Pricing principle

Không paywall kiểu:

> “Bạn đã nhập quá 3 assets.”

Ưu tiên paywall:

> **“Bạn muốn hiểu consequence sâu hơn và so sánh nhiều phương án hơn.”**

---

# 29. Brand & Tone

### Tính cách

- Bình tĩnh
- Minh bạch
- Không phán xét
- Tôn trọng privacy
- Future-oriented
- Dành cho “nhà mình”
- Không kiểm soát đối phương

### Từ nên dùng

- Nhà mình
- Tình hình
- Đang ở đâu
- Người phụ trách
- Sắp tới
- Dự kiến
- Có thể linh hoạt
- Quỹ an toàn
- Ảnh hưởng
- Mục tiêu chung
- Cùng xem
- Theo thông tin hiện có

### Từ tránh

- Kiểm soát
- Theo dõi đối phương
- Phát hiện
- Đáng ngờ
- Hoang phí
- Sai lầm
- Không được mua
- Cảnh báo nghiêm trọng

---

# 30. Home Wireframe

```text
NHÀ MÌNH

[ On track ]
30 ngày tới các khoản đã biết đều được cover

CÓ THỂ LINH HOẠT
54.000.000đ

Current liquid          128m
Needed before income    -34m
Protected reserve       -40m

[ Thử một khoản chi ]

──────────────

30 NGÀY TỚI

15 Aug   Salary       +45m
18 Aug   Rent         -15m
22 Aug   Credit card  -12m

Lowest projected balance
82m

[ Xem timeline ]

──────────────

TIỀN ĐANG Ở ĐÂU

An               72m
Bình             46m
Shared/other     10m

[ Xem nguồn tiền ]

──────────────

MỤC TIÊU CHÍNH

Mua nhà
420m / 1.2B

At current pace
Oct 2029

[ Xem goal ]

──────────────

2 khoản nên cập nhật

[ Cập nhật nhanh ]
```

---

# 31. What-if Wireframe

```text
THỬ MỘT KHOẢN CHI

Bạn đang cân nhắc bao nhiêu?

[ 30.000.000đ ]

Khi nào?
[ Hôm nay ]

Xem ảnh hưởng tới:
[ Mua nhà ]

[ Kiểm tra ảnh hưởng ]
```

Result:

```text
30.000.000đ

30 NGÀY TỚI

✓ Các khoản đã biết vẫn được cover

QUỸ AN TOÀN

✓ Reserve 40m vẫn được giữ

TIỀN LINH HOẠT

54m → 24m

MỤC TIÊU MUA NHÀ

Oct 2029 → Jan 2030

Khoảng 3 tháng chậm hơn

Theo dữ liệu hiện có.

[ Xem cách tính ]
[ Chia sẻ với partner ]
[ Thử số khác ]
```

---

# 32. Điểm khác biệt cạnh tranh

Nếu chỉ build:

- Asset list
- Upcoming payment
- Goal progress
- Household sharing

thì Google Sheets/Notion có thể đủ tốt.

Moat sản phẩm phải đến từ sự kết hợp:

### 1. Shared financial model

Tiền dù nằm ở nhiều người vẫn được tổng hợp đúng context.

### 2. Privacy-aware aggregation

Không cần reveal tất cả để vẫn có shared picture.

### 3. Time-aware cash-flow forecast

Hiểu sequence của income/outgoing.

### 4. Flexible money

Dịch balance thành actionable context.

### 5. What-if engine

Cho user thử quyết định trước khi thực hiện.

### 6. Goal consequence

Dịch tiền thành thời gian/opportunity cost.

### 7. Couple context

Hai người nhìn cùng một model và cùng consequence.

---

# 33. Strategic Product Architecture

Sản phẩm có 3 layer:

## Layer 1 — Financial Truth

> “Nhà mình đang có gì?”

- Money sources
- Ownership
- Sharing
- Current balances
- Goals
- Reserve

## Layer 2 — Financial Foresight

> “Sắp tới chuyện gì xảy ra?”

- Incoming
- Obligations
- Timeline
- Lowest balance
- Flexible money

## Layer 3 — Financial Decision

> “Nếu làm X thì sao?”

- What-if
- Reserve impact
- Flexible money impact
- Goal delay
- Shared scenario

### Product principle

**Layer 1 tạo trust.
Layer 2 tạo awareness.
Layer 3 tạo repeat usage và willingness to pay.**

---

# 34. Kết luận

Sản phẩm không nên chỉ là:

> **Family finance dashboard**

và cũng không nên chỉ là:

> **Can I afford this calculator**

Phiên bản mạnh hơn là:

> **Shared financial foresight for couples.**

App giúp hai người:

- Cùng biết tình hình.
- Biết tiền đang nằm ở đâu.
- Biết ai đang phụ trách khoản nào.
- Không cần gộp toàn bộ tiền.
- Không cần soi giao dịch nhỏ.
- Biết những gì sắp xảy ra.
- Biết số tiền nào thực sự linh hoạt.
- Hiểu consequence trước một quyết định.
- Thấy mục tiêu chung thay đổi thế nào.

Dashboard là **trust layer**.

Forecast là **context layer**.

What-if là **decision layer**.

Core value cuối cùng:

> **Trước khi chi một khoản đáng kể, hai người có thể cùng nhìn vào một bức tranh tài chính đáng tin cậy và hiểu quyết định đó sẽ thay đổi tương lai như thế nào.**

# 03 — Product Architecture & Principles

## 1. Product Architecture

### Layer 1 — Financial Clarity

Trả lời:

> “Nhà mình hiện đang có gì?”

Bao gồm:

- Money sources.
- Ownership/holder.
- Sharing.
- Current balances.
- Goals.
- Data freshness.

Layer 1 tạo **trust và acquisition value**.

### Layer 2 — Financial Foresight

Trả lời:

> “Sắp tới sẽ xảy ra chuyện gì?”

Bao gồm:

- Upcoming income.
- Upcoming obligation.
- Timeline.
- Running balance.
- Lowest balance.
- Flexible money.

Layer 2 tạo **recurring utility**.

### Layer 3 — Financial Decision

Trả lời:

> “Nếu làm X thì sao?”

Bao gồm:

- What-if simulation.
- Lowest projected balance before/after.
- Goal delay.
- Scenario sharing.

Layer 3 tạo **differentiation và willingness to pay**.

### Product Principle

**Clarity tạo adoption.  
Foresight tạo retention.  
Decision support tạo willingness to pay.**

---

# 2. Product Principles

## Clarity trước, complexity sau

User phải hiểu được household trong vài giây.

## Decision trước bookkeeping

Không yêu cầu nhập data nếu data đó không tạo output có giá trị.

Data phải phục vụ ít nhất một trong:

- Snapshot.
- Forecast.
- Flexible money.
- Goal projection.
- What-if.

## Household, không phải surveillance

Không hỏi:

> “Ai tiêu khoản này?”

Ưu tiên:

> “Khoản này đang do ai phụ trách?”

## Privacy by Design

User phải hiểu rõ:

- Partner thấy gì?
- Khoản có được tính vào household total không?
- Ghi chú có được share không?

## Manual-first nhưng không manual-heavy

MVP chưa cần bank linking.

Chỉ yêu cầu:

- Current money.
- Upcoming income.
- Upcoming obligation.
- Goals.
- Planned meaningful spending.

## Không phán xét

Không nói:

- Không được mua.
- Bạn tiêu quá nhiều.
- Quyết định sai.
- Hoang phí.

Ưu tiên:

> “Các khoản đã biết vẫn được cover.”

> “Số dư thấp nhất trong kỳ sẽ còn 12 triệu.”

> “Goal dự kiến chậm khoảng 2 tháng.”

> “Bạn quyết định.”

## Opportunity Cost dễ cảm nhận

Hiển thị cả:

**Money impact + Time impact**

## Assumption Transparency

App luôn dùng context:

> “Theo dữ liệu hiện có.”

Có thể mở:

**How this was calculated**

---

# 3. Core Concepts

## Money Source

Một nơi đang chứa giá trị tài chính.

Ví dụ:

- Tiền mặt.
- Bank account.
- Ví điện tử.
- Savings account.
- Một khoản tiền user muốn đưa vào household picture.

> Một khoản để dành có tên — quỹ dự phòng, tiền cưới — **không** phải money
> source riêng. Tiền của nó vẫn nằm trong một money source có sẵn; thứ cần khai
> là ý định, và chỗ của ý định đó là **Financial Goal**.

Fields:

- Name.
- Type.
- Current value.
- Holder/member.
- Liquidity.
- Financial nature.
- Sharing level.
- Updated at.
- Note.

## Financial Nature

### Shared household money

Tiền thuộc household.

### Personal but counted in household picture

Tiền vẫn thuộc cá nhân nhưng user muốn tính vào planning chung.

### Managed on behalf of household

Một người đang giữ/phụ trách khoản chung.

### Personal/private

Không tham gia household calculation.

---

# 4. Sharing Model

MVP dùng ba mức.

## Shared Details

Partner thấy:

- Tên.
- Loại.
- Giá trị.
- Holder.
- Note được share.

Khoản tham gia household calculation.

## Count in Total Only

Khoản tham gia household calculation.

Partner chỉ thấy:

- Tổng amount được đóng góp.
- Hoặc nhóm asset.

Không thấy chi tiết nhạy cảm.

## Private

Partner không thấy.

Khoản không tham gia shared household calculations.

Copy:

> Khoản riêng tư sẽ không được tính vào flexible money chung.

---

# 5. Other Core Concepts

## Upcoming Income

Fields:

- Name.
- Amount.
- Expected date.
- One-time / recurring.
- Owner/member.
- Confirmed / estimated.
- Status.

## Upcoming Obligation

Fields:

- Name.
- Amount.
- Due date.
- One-time / recurring.
- Required / planned.
- Owner/member.
- Confirmed / estimated.
- Status.
- Related goal optional.

## Protected Reserve — đã gỡ bỏ

Từng là một **mức sàn trên forecast**: household khai mức không muốn để số dư
tụt xuống dưới, và flexible money bị trừ đi mức đó.

Đã gỡ bỏ hoàn toàn. Lý do không phải là khái niệm sai, mà là nó **chưa bao giờ
được nối dây**: chỗ duy nhất còn ghi là một bước trong onboarding, còn màn sửa
thì không được mount ở đâu cả — nhập một lần rồi vĩnh viễn không đổi được, trong
khi con số đó vẫn trừ thẳng vào figure Home hiển thị đầu tiên.

Chỗ đúng cho "nhà mình muốn để riêng 100 triệu" là **Financial Goal**: goal không
target date chính là một quỹ có tên, có số dư và có lịch sử đóng góp — và nó
sửa được.

Nếu sau này cần dựng lại một mức sàn, hai điều đã làm hỏng lần đầu vẫn còn
nguyên giá trị:

- **Khoản sắp phải chi không được cộng vào sàn.** Thuế, học phí… là Upcoming
  Obligation: forecast đã kéo số dư xuống đúng ngày đến hạn và chúng tự hết vai
  trò sau khi trả. Cộng vào sàn là trừ hai lần, và một con số khai tay thì không
  tự hết hạn.
- **Không derive được.** Không dữ liệu nào nói household muốn giữ 100 triệu chứ
  không phải 60 triệu — đó là một quyết định, nên phải được khai, nên phải sửa
  được ở một màn hình có thật.

## Financial Goal

Fields:

- Name.
- Target amount.
- Current amount.
- Target date.
- Planned monthly contribution.
- Priority.
- Shared/personal.
- Status.
- Updated at.

## Flexible Money

> **Phần tiền household có thể cân nhắc sử dụng sau khi đã tính những nghĩa vụ gần và các financial constraints đã khai báo.**

Không gọi đây là:

> “Số tiền bạn nên tiêu.”

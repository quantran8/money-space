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
- Reserve.
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
- Reserve impact.
- Flexible money before/after.
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
- Reserve.
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

> “Quỹ an toàn sẽ thấp hơn mức bạn đặt.”

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

> Quỹ dự phòng **không** phải một money source. Nó là một mức sàn trên forecast —
> xem §5 "Protected Reserve". Tiền của quỹ vẫn nằm trong một money source có sẵn.

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

## Protected Reserve

Mức household không muốn để số dư tụt xuống dưới.

Ví dụ:

> Quỹ dự phòng: 100 triệu.

Đây là **sàn trên forecast**, không phải một account và cũng không phải hàng rào.
Không có khoản tiền nào bị chuyển đi hay bị khoá — tiền vẫn tiêu được; app chỉ
cho thấy trước khi số dư dự kiến chạm mức đó.

Hai hệ quả:

- **Khoản sắp phải chi không được cộng vào đây.** Thuế, học phí… là Upcoming
  Obligation: forecast đã kéo số dư xuống đúng ngày đến hạn và chúng tự hết vai
  trò sau khi trả. Cộng vào sàn là trừ hai lần, và một con số khai tay thì không
  tự hết hạn.
- **Không derive được.** Không dữ liệu nào nói household muốn giữ 100 triệu chứ
  không phải 60 triệu — đó là một quyết định, nên phải được khai.

Mỗi household chỉ có **một** mức. Nhiều khoản để riêng có tên là **Financial
Goal** (goal không target date chính là một quỹ có tên, có số dư và có lịch sử
đóng góp).

UI chỉ dùng chữ **Quỹ dự phòng** — "Protected Reserve" là tên bảng, không phải
từ vựng của user.

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

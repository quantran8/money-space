# 03 — Product Architecture & Principles

## 1. Product Architecture

### Layer 1 — Financial Clarity

Trả lời:

> “Gia đình hiện đang có gì?”

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

Chỗ đúng cho "gia đình muốn để riêng 100 triệu" là **Financial Goal**: goal không
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
- Target date.
- Planned monthly contribution.
- Priority.
- Shared/personal.
- Status.
- Updated at.

### Goal không giữ tiền của riêng nó

Nguyên tắc quyết định cả model: **góp vào goal không được làm thay đổi net
worth.** Tiền dành cho goal vẫn là tiền thật đang nằm trong tài sản của
household, và họ vẫn có thể lấy ra dùng.

Goal là **một tập phần góp từ asset thật** (`goal_asset_allocations`): vàng +
chứng khoán + tiền gửi + tiền mặt cùng nuôi một mục tiêu, mỗi thứ góp một phần
khai theo **số tiền cố định** hoặc **tỉ lệ %**. Không lưu gì, nên không có gì để
trôi.

**"Tiền chung" không phải một loại tiền riêng** — nó chính là các asset
`cash`/`bank_account`. "Để dành 100tr" là một phần góp cố định 100tr từ ví đang
giữ số đó, khai y hệt một phần của vàng.

Hai bản implement trước đều đi lệch ở đây. Bản đầu bắt contribution **debit một
ví**, nên household nghèo đi đúng bằng số tiền vừa quyết định để dành. Bản sau
thêm mode `earmark` — một con số lơ lửng không neo vào asset nào, nên không ai
trả lời được "100tr đó nằm ở đâu", và vì là con số khai tay nó có thể vượt tổng
tài sản thật.

### Lấy tiền ra khỏi goal = chi tiêu, không phải "rút"

Không có thao tác "rút khỏi goal", và goal cũng không còn link tới money event
nào. Chi tiêu từ asset đứng sau goal là đủ: progress tự giảm ở lần đọc kế tiếp,
vì phần `fixed` bị cap ở giá trị thực của asset.

### Có giữ được nhịp không?

Con số tiến độ trả lời "đang có bao nhiêu". Câu household thật sự hỏi mỗi tháng
là khác: *"định để dành 10tr, tháng này được bao nhiêu?"*. Đó là **hiệu giữa hai
mốc thời gian**, nên tiến độ từng goal được chốt vào mỗi snapshot
(`snapshot_goal_values`). Hiệu hai tháng liền kề đã gồm cả tiền góp thêm, tiền
tiêu ra, và biến động giá.

Tháng hụt được hiển thị bằng `--attention`, không phải `--alert`: không giữ được
nhịp là thông tin, không phải lỗi, và sản phẩm không phán xét cách household
tiêu tiền của chính họ.

### Đã dành cho mục tiêu ≠ trừ khỏi flexible money

Net worth và flexible money **giữ nguyên công thức**. Home tách hiển thị "đã dành
cho mục tiêu" vs "chưa gán" như một lớp thông tin, không phải một phép trừ. Trừ
phần đã gán vào flexible money chính là công thức của Protected Reserve đã gỡ ở
trên — và một goal có `planned_monthly_contribution` thì forecast đã kéo số dư
xuống rồi, trừ thêm lần nữa là trừ hai lần.

Cũng không cần chặn trên: mỗi phần góp đã bị giới hạn bởi giá trị asset của nó,
và over-allocation bị chặn lúc ghi, nên tổng "đã dành" luôn ≤ tổng tài sản.

## Flexible Money

> **Phần tiền household có thể cân nhắc sử dụng sau khi đã tính những nghĩa vụ gần và các financial constraints đã khai báo.**

Không gọi đây là:

> “Số tiền bạn nên tiêu.”

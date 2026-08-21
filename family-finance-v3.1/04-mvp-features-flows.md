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

> “Tôi muốn hiểu tài chính gia đình.”

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

> “Gia đình hiện có X và sau các khoản đã biết còn Y linh hoạt.”

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

# 7B. Thêm tài sản: đã có sẵn hay vừa mua?

App nhập liệu thủ công, nên khi thêm một tài sản phải phân biệt rõ **hai việc
khác hẳn nhau** — chúng tác động lên net worth theo hai hướng:

| Chọn | Nghĩa là | Net worth | Ví |
|---|---|---|---|
| **Đã có sẵn** (mặc định) | Khai hiện trạng — vàng mua từ 2020, giờ mới nhập | **Tăng** | Không đụng |
| **Vừa mua** | Giao dịch — đổi tiền lấy vàng hôm nay | **Không đổi** | Bị trừ |

"Đã có sẵn" là mặc định vì việc đầu tiên một nhà làm khi mở app là nhập những
thứ đang có. Cả hai đều đúng — sai là **không hỏi**: trước đây mọi lần thêm đều
chạy theo cột trái, nên mua 100tr vàng làm net worth tăng 100tr từ không khí.

Chọn "Vừa mua" thì form hỏi thêm **trả bằng ví nào** (bắt buộc), mỗi ví hiện kèm
số dư. Chỉ hỏi với loại tài sản nhà thực sự mua: vàng, crypto, chứng khoán, bất
động sản, ngoại tệ. Sửa tài sản thì không hỏi — sửa không phải mua lại.

**Số tiền trừ là giá mua, không phải giá thị trường.** Mua 1 lượng giá 80tr
trong khi giá niêm yết 82tr thì ví mất đúng 80tr; tính theo giá thị trường là
bịa ra một khoản lỗ chưa từng xảy ra.

**Ví phải đủ tiền.** Khác với chi tiêu — ghi lại chuyện đã qua, số dư có thể
lạc hậu — khoản mua đang được khai ngay lúc nó xảy ra. Ví không đủ nghĩa là số
dư sai hoặc tiền lấy từ nơi khác; cả hai cần sửa trước khi lưu. Dốc ví về đúng 0
thì được, chỉ vượt mới bị từ chối.

Trang Sự kiện có quick action **"Mua tài sản"** đối xứng với "Bán tài sản"; nó
mở thẳng form này ở chế độ "Vừa mua".

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

## 8.1 Tạo goal: chọn luôn tài sản góp vào

Form tạo goal hỏi ngay **tài sản nào góp vào mục tiêu này**, mỗi dòng khai **số
tiền cố định** hoặc **tỉ lệ %**. Không lưu được goal chưa có tài sản nào — goal
rỗng thì không có tiến độ và cũng không có cách nào tăng.

"Để dành từ tiền chung" không phải một lựa chọn riêng: chọn ví tiền mặt / tài
khoản ngân hàng đang giữ số đó, khai số tiền cố định. Tiền chung chính là các
tài sản đó.

Mỗi dòng còn khai **phần này là gì**:

| Vai | Nghĩa | Vào tiến độ | Vào nhịp góp |
|---|---|---|---|
| **Nguồn góp hàng tháng** | Ví lương / tiết kiệm tiền chảy vào | Có | **Có** |
| **Đã tích luỹ** | Vàng, CK, crypto đang giữ | Có | Không |

Mặc định theo loại tài sản (ví → nguồn góp), nhưng **nhà tự đổi được** — một nhà
có hai ví, một để chi tiêu một để dành riêng cho mục tiêu, phải nói được chỉ ví
thứ hai mới tính. Dòng "đã tích luỹ" ghi kèm một câu: *theo giá thị trường, giá
trị sẽ thay đổi* — nói trước thì lúc nó xảy ra không còn là bất ngờ.

## 8.2 Tài sản góp vào mục tiêu

Trên trang chi tiết goal: thêm / sửa / bỏ từng tài sản.

- Một tài sản chia được cho nhiều goal — 100tr chứng khoán góp 50tr cho goal xe,
  phần còn lại vẫn tự do.
- Không hứa quá giá trị tài sản đang có; thông báo nói rõ còn bao nhiêu chưa gán.
- Tài sản tụt giá thì phần góp tính theo số thực có, và dòng đó nói rõ vì sao.

## 8.2B Thanh tiến độ tự giải thích biến động

Goal gắn vàng thì con số tự đổi theo giá: hôm qua 50%, hôm nay 48%, nhà không
làm gì cả. Không nói gì thì con số trông như tuỳ tiện — mà một con số không giải
thích được là con số không ai tin.

Cách sửa **không phải** đóng băng giá vàng lúc gán. Làm vậy thì goal báo 250tr
trong khi bán ra chỉ được 240tr: không phải dễ hiểu hơn, mà là **trả lời sai** —
và đúng là con số lơ lửng không neo vào tài sản mà `earmark` từng là.

Nên con số vẫn bám theo tài sản, và ngay dưới thanh tiến độ có một dòng:

```txt
240tr / 500tr
━━━━━━━━━░░░░░░░░░  48%
Hôm qua 250tr → hôm nay 240tr · vàng giảm 10tr
```

- So với **mốc chốt gần nhất trước hôm nay**. Không phải hôm qua thì ghi rõ ngày,
  nếu không "hôm qua" sẽ âm thầm mô tả mức đổi của hai tuần.
- Nêu tối đa 2 tài sản đổi nhiều nhất; tài sản không đổi thì không nói.
- Tài sản mới gán vào hoặc vừa bị bỏ ra cũng được nêu — nếu không, những cú đổi
  lớn nhất lại là thứ không được giải thích.
- **Không đổi thì không hiện gì.** Một dòng ghi "không thay đổi" là tiếng ồn.
- Giảm dùng tông `attention`, không dùng `alert`: thị trường đi xuống là thông
  tin, và không phải lỗi của nhà.

## 8.3 Lấy tiền ra khỏi mục tiêu

Không có màn "rút", cũng không có ô gắn goal khi ghi chi tiêu. Cứ ghi chi tiêu
bình thường từ tài sản đó — tiến độ mục tiêu tự giảm ở lần xem sau.

## 8.4 Tính đều đặn — tháng này có giữ được nhịp không?

Panel trên trang chi tiết, mỗi dòng một tháng: **thực tế / dự định / chênh lệch**.

```txt
Tháng 6                +10tr / 10tr   đủ nhịp
Tháng 7                +10tr / 10tr   đủ nhịp
Tháng 8                 +8tr / 10tr   thiếu 2tr
Tháng 9 đang diễn ra    +6tr / 10tr   còn 4tr
```

Con số mỗi tháng **chỉ tính phần nguồn góp** — hiệu số dư ví giữa hai mốc cuối
tháng. Ví không có giá thị trường, số dư chỉ đổi khi nhà thu hoặc chi, nên cột
này đo đúng việc nhà làm: tiền góp thêm và tiền tiêu ra, không lẫn giá vàng.

Trước đây nó đo cả tiến độ, tức là trả lời "tháng này có giữ được 10tr không?"
bằng giá vàng — sai theo cả hai chiều: vàng lên 10tr trong tháng nhà không góp
đồng nào thì báo "đủ nhịp", vàng xuống 10tr trong tháng nhà góp đủ thì báo
"thiếu".

Phần tài sản đang giữ hiện riêng ở dòng **"Đã tích luỹ"** dưới bảng, để hai con
số không bao giờ bị đọc thành một.

Tháng hụt hiển thị bằng tông `attention`, không phán xét — không giữ được nhịp
là thông tin, không phải lỗi.

**Tháng đang chạy cũng có một dòng**, đo tới thời điểm hiện tại thay vì mốc cuối
tháng. Không có nó thì giữa tháng nhà mở app ra chỉ thấy mục tiêu 10tr và không
biết đang ở đâu — phải đợi hết tháng mới rõ. Đây chính là phản hồi mà nút "đóng
góp" từng cung cấp, trước khi goal thôi giữ tiền của riêng nó.

Dòng này nói **còn bao nhiêu nữa**, không nói thiếu bao nhiêu: tháng chưa xong
thì chưa hụt, nên nó giữ tông trung tính. Nếu tháng liền trước không có mốc chốt
(nhà không mở app cả tháng) thì **để trống** thay vì hiển thị con số gộp nhiều
tháng — số gộp sẽ khen nhầm.

**Đổi tiền lấy vàng trong cùng một goal không tính là rút ra.** Mua 10tr vàng
bằng ví đang góp cho goal làm ví tụt 10tr, nhưng tiến độ goal đứng yên — nhà chỉ
đổi hình thức nắm giữ. Khoản mua đó được cộng bù lại. Còn mua tài sản **không**
gắn goal thì tiền thật sự rời khỏi mục tiêu, và vẫn hiện đúng như vậy.

**Goal không có nguồn góp nào** (chỉ gắn vàng/CK) thì bỏ hẳn hai cột dự định và
chênh lệch, chỉ còn phần đã tích luỹ. Báo "thiếu 10tr" mỗi tháng cho một mục tiêu
nhà chưa từng định góp tiền mặt vào là phán xét một kế hoạch không ai đặt ra.

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

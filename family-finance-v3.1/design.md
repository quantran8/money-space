# Web Design System — Money Space v4.0

> **Spec alignment:** Shared Financial Clarity → Financial Foresight → Decision Support for couples 25–37.
>
> **v4.0 là bản đổi hướng thị giác.** Nội dung sản phẩm, IA, copy và nguyên tắc hành vi từ v3.x được giữ nguyên. Toàn bộ hệ thị giác — surface, màu, typography, spacing, component — được thay bằng hệ đã hội tụ qua vòng thiết kế: **panel trắng trên nền có sắc, phân tầng bằng độ sáng, không divider, không viền, không shadow, sidebar, lục ngân hàng bão hoà, mật độ bảng thật.**
>
> Bản v3.x đi theo hướng white-first với section frame viền alpha và accent xanh dương hệ Apple. Hướng đó đã bị loại: xem §25.

---

## Changelog v3.4 → v4.0

```txt
§2.1   Nền trang KHÔNG còn là trắng. Nền app có sắc, panel mới là trắng.
§2.2   Ba tầng surface: app → panel → sunk. Không dùng viền để phân tầng.
§2.3   Bỏ .section-surface với border 2px alpha. Panel không có viền.
§2.4   Divider bị loại gần như hoàn toàn, kể cả trong bảng.
§4     Visual language viết lại: register “sổ cái hiện đại”, không phải “consumer minimal”.
§5     Palette thay hoàn toàn. Ledger (lục ngân hàng) và Archive (đỏ rượu).
§5.4   Attention amber tách khỏi protected reserve. Protected reserve về neutral.
§6     Token viết lại theo CSS variable + hai theme class.
§7     Spacing/radius viết lại: section p-8, radius 14, gap 16.
§10    Typography: Be Vietnam Pro + IBM Plex Mono thay system font stack.
§11    Component pattern viết lại: panel, sunk block, dense table, coverage strip.
§12    Home component cập nhật theo hệ mới, giữ nguyên nội dung và thứ tự.
§13    Layout example viết lại: sidebar + single column, không phải grid 7fr/5fr.
§21    Cheatsheet viết lại.
§22    MỚI — Form Patterns: tạo, sửa, ô nhập, tiền tệ, validation, phá huỷ.
§23    UI States giữ từ v3.4, cập nhật theo token mới.
§25    Hướng white-first/Apple-blue chuyển vào deprecated.
```

## 0. Product Overview

### 0.1. Tóm tắt sản phẩm

Money Space là app dành cho các cặp đôi **25–37 tuổi, sắp cưới hoặc đã cưới**, giúp hai người cùng có một bức tranh tài chính rõ ràng và hiểu trước hệ quả của các quyết định tài chính quan trọng.

App giúp household trả lời 5 câu hỏi:

1. **Nhà mình đang có bao nhiêu?**
2. **Tiền đang nằm ở đâu và ai đang phụ trách?**
3. **Trong thời gian tới có những khoản nào sẽ vào hoặc ra?**
4. **Sau các nghĩa vụ và quỹ cần bảo vệ, còn bao nhiêu tiền thực sự linh hoạt?**
5. **Nếu chi khoản này hôm nay thì mục tiêu chung sẽ thay đổi thế nào?**

Sản phẩm không tập trung vào việc ghi từng khoản thu chi nhỏ hằng ngày.

Core value chain:

```txt
Shared Financial Clarity
→ Financial Foresight
→ Decision Support
```

Core loop:

```txt
Know → Forecast → Decide → Update → Know
```

Expanded loop:

```txt
Money today
→ Money location
→ Upcoming cash-flow
→ Protected money
→ Flexible money
→ What-if decision
→ Goal impact
→ Shared understanding
```

### 0.2. Không phải

```txt
Không phải app ghi thu chi cá nhân.
Không phải app budgeting theo category chi tiết.
Không phải household accounting software.
Không bắt nhập mọi transaction.
Không phải công cụ theo dõi đối phương.
Không bắt hai người gộp toàn bộ tiền.
Không mặc định bắt chia sẻ mọi khoản riêng.
Không phải investment portfolio tracker.
Không phải AI financial advisor.
Không quyết định thay user nên hay không nên mua.
```

### 0.3. Là gì

```txt
Shared financial picture cho household.
Financial snapshot dễ hiểu.
Nơi tổng hợp tiền dù nằm ở nhiều người.
Near-term cash-flow foresight.
Flexible money calculator.
Financial goal projection.
What-if decision simulator.
Shared source of truth cho các quyết định tài chính.
```

### 0.4. Product thesis

Ngân hàng trả lời:

> “Tài khoản này đang có bao nhiêu?”

Expense tracker trả lời:

> “Tháng này đã tiêu bao nhiêu?”

Spreadsheet có thể trả lời:

> “Tổng tài sản hiện tại là bao nhiêu?”

Money Space cần trả lời:

> “Tài chính household hiện đang thế nào?”
>
> “Tiền đang nằm ở đâu?”
>
> “Những khoản nào đã có nhiệm vụ?”
>
> “Trong 30 ngày tới chuyện gì sẽ xảy ra?”
>
> “Sau đó còn bao nhiêu tiền linh hoạt?”
>
> “Nếu chi X hôm nay, tương lai thay đổi thế nào?”

### 0.5. North Star

Sản phẩm thành công khi một couple có thể nói:

> “Trước đây muốn biết nhà mình đang thế nào thì phải hỏi nhau và tự cộng nhiều nơi. Giờ chỉ cần mở app.”

Và trước một khoản chi lớn:

> “Mình thử xem khoản này ảnh hưởng gì trước đã.”

### 0.6. Feature domain map — MỚI

Sản phẩm có 8 domain. Không phải domain nào cũng có mặt trên Home.

| Domain                  | Trên Home                          | Nơi ở chính               | Vai trò                |
| ----------------------- | ---------------------------------- | ------------------------- | ---------------------- |
| Financial Picture       | Có, section 1                      | Home                      | Primary answer         |
| Cash-flow / Sắp tới     | Có, section 2                      | Trang `Sắp tới`           | Foresight              |
| Goals                   | Có, section 3 — chỉ main goal      | Trang `Mục tiêu`          | Decision anchor        |
| Assets & money sources  | Có, section 4 — compact            | Trang `Tài sản`           | Context                |
| **Debt**                | **Không** — chỉ qua hệ quả         | Trang `Tài sản`, tab `Nợ` | Obligation input       |
| **Financial event log** | **Không** — chỉ qua `Cần cập nhật` | `Lịch sử cập nhật`        | Shared source of truth |
| Household & privacy     | Không                              | Trang `Nhà mình`          | Trust                  |
| What-if                 | Là action, không phải section      | Dialog / Sheet            | Decision support       |

Nguyên tắc: **thêm feature không có nghĩa là thêm Home section.** Home giữ tối đa 5 section. Domain mới phải chứng minh nó thuộc Priority A hoặc B ở §1.1 trước khi được lên Home.

---

## 1. Product Design Direction

Money Space là **consumer finance product cho household**, không phải dashboard quản trị — nhưng nó cũng không được nhẹ tới mức mất cảm giác đáng tin.

Design direction:

```txt
Calm nhưng có trọng lượng
Phân tầng bằng độ sáng, không bằng nét
Compact, mật độ thật
Few meaningful sections
Strong scan hierarchy
Future-oriented
Private, not controlling
Sidebar-first trên desktop
Mobile-primary key flows
```

### 1.1. Home phải là scan surface

User mở Home và trong khoảng **3–5 giây** phải quét được những thông tin quan trọng nhất.

```txt
Priority A
1. Nhà mình đang ổn không?
2. Bức tranh này có đang dựa trên dữ liệu mới không?
3. Có bao nhiêu tiền linh hoạt?
4. Thấp nhất trong 30 ngày tới là bao nhiêu?

Priority B
5. Mục tiêu chính đang đi tới đâu?

Priority C
6. Tiền đang ở đâu / ai đang phụ trách.
7. Gần đây có gì thay đổi và do ai.
```

**Vì sao freshness đứng thứ 2.** Ba câu còn lại của Priority A đều là output của cùng một tập input. Nếu input cũ thì cả ba đều sai, và user không có cách nào biết. Đặt freshness ở cuối trang có nghĩa là user đã đọc, đã tin và có thể đã quyết định xong trước khi cuộn tới chỗ nói rằng con số đó chưa đầy đủ.

Đây là ràng buộc riêng của sản phẩm này: dữ liệu do người nhập tay, hai người nhập ở hai thời điểm khác nhau, không có bank sync. Freshness không phải chi tiết kỹ thuật — nó là một phần của câu trả lời.

### 1.2. Visual emphasis trên Home

```txt
Flexible Money       → money number lớn nhất, weight 500.
Financial State      → chip trái ở đầu section 1.
Data coverage        → chip phải ở đầu section 1 + coverage strip dưới money number.
Thấp nhất dự kiến    → metric lớn thứ hai, mở đầu section 2.
Money composition    → thanh 3 đoạn + legend có phần trăm.
Goal projection      → ngày dự kiến quan trọng hơn progress bar.
Money location       → bảng, kèm cột Cập nhật.
Nhật ký              → list gọn, ba dòng gần nhất.
Debt                 → không có visual riêng trên Home.
```

Hai chip trạng thái ở đầu section 1 là hai trục độc lập:

```txt
● Nhà mình đang ổn              ● 2 nguồn cần cập nhật
  ↑ tình trạng tài chính          ↑ tình trạng dữ liệu
```

Không gộp. Nhà có thể đang ổn với dữ liệu cũ, hoặc có vấn đề với dữ liệu mới.

### 1.3. Home không phải BI dashboard

Không thiết kế như:

```txt
SaaS analytics dashboard
Fintech trading dashboard
Card grid với 8–12 metric ngang cấp
Chart gallery
Expense tracker
App thiền / wellness product
```

Cảm giác đúng đến từ:

```txt
panel trắng trên nền có sắc
phân tầng bằng độ sáng
bảng có mật độ thật, có header, có dòng tổng
số dùng tabular, weight 500
mono cho ngày tháng, đơn vị, nhãn nhỏ
một accent duy nhất, dùng rất ít
không viền, không shadow, gần như không divider
copy có lý do tồn tại
```

---

## 2. Surface & Structure Principles

## 2.1. Ba tầng surface, phân biệt bằng độ sáng

Nền trang **không phải màu trắng**. Trắng dành cho panel.

```txt
--app      #EEF1F3   nền trang, sidebar nằm trực tiếp trên nền này
--panel    #FFFFFF   top-level section
--sunk     #F5F7F8   khối tổng, biểu đồ, ô input, kết quả
```

Đây là đảo ngược có chủ đích so với v3.x. Lý do: khi đã loại bỏ divider và viền (§2.3, §2.4), chênh lệch độ sáng là cơ chế phân tách duy nhất còn lại. Nó cũng giải quyết vấn đề khó quét — ranh giới section hiện ra mà không cần một nét nào.

Rules:

```txt
Tối đa 3 tầng. Không có tầng thứ tư.
Panel KHÔNG có viền và KHÔNG có shadow.
Sunk block dùng cho: dòng tổng, khối biểu đồ, input, ô kết quả mô phỏng, badge.
Sidebar không có nền riêng và không có viền phải — nó nằm trên --app.
Không dùng --sunk làm nền cho cả một section.
```

## 2.2. Không dùng viền để phân tầng

```txt
Panel:        không viền
List row:     không viền
Table row:    không viền
Sidebar:      không viền
Input:        không viền, dùng nền --sunk
```

Ngoại lệ duy nhất trong toàn sản phẩm: **viền đứt** của khối mô phỏng, và nó tồn tại vì mang nghĩa — đánh dấu vùng “chưa phải số thật”.

## 2.3. Radius và shadow

```txt
Panel                14px
Sunk block           10px
Input / button       8–10px
Badge / chip         rounded-full
Modal                14px
```

```txt
Shadow: không dùng ở bất kỳ surface nào trong trang.
Modal được dùng shadow rõ vì nó nổi thật.
```

## 2.4. Divider gần như bị loại

Không dùng divider giữa heading, metric, list row hay table row.

Bảng dùng:

```txt
header row       mono uppercase, không có đường kẻ dưới
data row         không kẻ, phân biệt bằng khoảng cách + hover nền --sunk
dòng tổng        một sunk block bo góc riêng, đặt cách bảng 20px
```

Bảng dài hơn 10 dòng: thêm nền so le rất nhạt, **không** thêm đường kẻ.

Divider chỉ còn được phép ở: bottom navigation trên mobile, và nhóm form khó hiểu nếu thiếu separator.

## 2.5. Dashboard is preview, not detail page

```txt
Home        = status + primary number + future preview + clear action
Detail page = breakdown + history + edit + management
```

Mỗi Home section chỉ trả lời một câu hỏi chính.

```txt
Financial Picture → Nhà mình đang ổn không và còn bao nhiêu linh hoạt?
30 ngày tới        → Dòng tiền sẽ đi qua những mốc nào và low point là bao nhiêu?
Mục tiêu chính     → Theo tốc độ hiện tại khi nào đạt?
Tiền đang ở đâu    → Money location và holder ra sao?
Cần cập nhật       → Data nào đang làm forecast kém tin cậy?
```

## 2.6. Flexible Money là primary money number

Không ưu tiên `total assets`, `net worth` hoặc `account balance` làm con số chính trên Home.

Primary number:

```txt
Có thể linh hoạt
54tr
```

Helper chỉ tồn tại vì nó giải thích calculation:

```txt
Sau các khoản đã biết trong thời gian tới và quỹ an toàn 40tr đã đặt.
```

Supporting breakdown:

```txt
Current liquid
- required near-term outflow      ← gồm cả kỳ trả nợ sắp tới
- protected reserve
+ sufficiently certain incoming
```

Rule:

```txt
Balance ≠ Flexible Money.
Flexible Money không phải “số tiền được phép tiêu”.
Không dùng copy phán xét.
```

## 2.7. Future là sequence, không phải bill list

Section `30 ngày tới` phải thể hiện:

```txt
Lowest projected balance
Incoming total
Outgoing total
Top timeline events
Running projected balance khi có đủ chỗ
```

Không tạo section phụ tên `Những khoản sắp tới` bên trong hoặc cạnh `30 ngày tới`.

Hai concept này là **một chức năng** và phải được gom thành một flow:

```txt
30 ngày tới
→ summary
→ optional compact visual
→ timeline events
→ Xem timeline
```

User không nên phải tự cộng sequence trong đầu, nhưng UI cũng không cần viết câu “Không cần tự cộng trong đầu”.

## 2.8. Chart là supporting visual, không phải trọng tâm

Chart chỉ được dùng khi giúp user thấy một consequence mà list khó truyền tải nhanh, ví dụ:

```txt
cash-flow low point
running balance
trend theo thời gian
```

Rules:

```txt
Chart không được cạnh tranh với Flexible Money.
Không dùng chart lớn chỉ để dashboard trông “financial”.
Không dùng nhiều series nếu user chỉ cần low point.
Không đặt chart ở Home nếu 3 row timeline đã truyền tải đủ ý.
```

## 2.9. What-if là action, không phải Home section

What-if là **primary contextual action**.

Trên Home:

```txt
[ Thử một khoản chi ]
```

Nó không được render thành:

```txt
What-if card
Scenario section
Consequence preview card
“30tr hôm nay → goal chậm 3 tháng” trước khi user chủ động thử
```

Entry points hợp lý:

```txt
Home → cạnh Flexible Money
Goal detail
Upcoming detail
```

Desktop:

```txt
Dialog hoặc side sheet
```

Mobile:

```txt
Bottom sheet hoặc dedicated route
Sticky/prominent CTA được phép
```

Consequence chỉ xuất hiện **sau user action**.

## 2.10. Helper copy phải có lý do tồn tại

Một subtitle/helper chỉ được thêm nếu nó truyền tải ít nhất một trong ba loại meaning:

```txt
1. Scope / assumption user cần biết.
2. Consequence / state user cần hiểu.
3. Action / next step user cần làm.
```

Test:

> Nếu xóa dòng này mà user không mất meaning, context hoặc action nào, hãy xóa.

Good:

```txt
Chỉ gồm các khoản đã biết.
Sau các khoản đã biết và quỹ an toàn 40tr đã đặt.
2 khoản nên cập nhật.
Cập nhật 35 ngày trước.
```

Avoid:

```txt
Theo dữ liệu hiện có.
Không cần tự cộng trong đầu.
Bức tranh rõ ràng cho hai người.
Cùng nhìn về tương lai.
Tài chính đơn giản hơn.
```

Các câu trên có thể đúng về brand, nhưng không tạo meaning tại vị trí UI cụ thể.

## 2.11. List-first khi có nhiều child item

```txt
0–2 nhóm lớn       → 2-column group hoặc stack mobile
3–6 item nhỏ       → grouped list / row flow
>6 item            → show top 3 + “+N mục khác” + CTA
Dữ liệu theo time  → timeline/list
Dữ liệu quản lý    → detail page / table desktop
```

Không biến mỗi event, asset, goal hoặc update thành shadow card riêng.

## 2.12. Privacy clarity beats minimalism

Mỗi money source cần làm rõ:

```txt
Ai đang giữ / phụ trách?
Có tính vào household picture không?
Partner thấy chi tiết hay chỉ thấy tổng?
Cập nhật lần cuối khi nào?
```

MVP sharing labels:

```txt
Hiện chi tiết
Chỉ tính vào tổng
Riêng tư
```

Không dùng privacy icon-only.

## 2.13. Nợ là obligation, không phải Home metric — MỚI

Nợ không có section riêng trên Home, và **không** được render thành một số lớn.

Lý do: hero number của sản phẩm là Flexible Money. Đặt tổng nợ cạnh nó tạo hai anchor cạnh tranh, và với các cặp đôi mới cưới có vay mua nhà thì tổng nợ luôn lớn hơn mọi con số khác — nó sẽ chiếm hết visual weight mà không giúp gì cho quyết định hôm nay.

Nợ vào bức tranh qua ba đường:

```txt
1. Kỳ trả nợ sắp tới  → là một event trong 30 ngày tới
2. Nghĩa vụ gần       → trừ vào Flexible Money qua “Cần sớm”
3. Payoff projection  → chỉ trên trang Tài sản → tab Nợ
```

Rules:

```txt
Không hero number “Tổng nợ”.
Không progress bar “đã trả được bao nhiêu %” trên Home.
Không màu riêng cho nợ (§5.4).
Không copy phán xét về việc có nợ.
What-if có thể hiển thị ảnh hưởng tới ngày tất toán nếu user chọn goal liên quan.
```

Net worth được phép hiển thị, nhưng chỉ ở trang Tài sản, không ở Home.

## 2.14. Nhật ký ghi thay đổi của bức tranh, không ghi giao dịch — MỚI

Đây là ranh giới quan trọng nhất của domain này. Money Space không phải app ghi thu chi (§0.2). Nếu Nhật ký ghi từng khoản mua sắm, sản phẩm tự biến thành expense tracker.

Nhật ký chỉ ghi các **financial event** làm bức tranh thay đổi:

```txt
Cập nhật số dư một nguồn tiền
Thêm / sửa / xoá một khoản sắp tới
Thay đổi quỹ an toàn
Tạo / sửa / hoàn thành mục tiêu
Thêm / thay đổi khoản nợ
Ghi nhận một kịch bản What-if đã được cả hai xem
Thay đổi quyền chia sẻ
Mời / gỡ thành viên
```

Không ghi:

```txt
Từng giao dịch mua sắm
Từng lần mở app
Từng lần xem section
Hoạt động của partner ngoài phạm vi household picture
```

Mỗi entry cần: **ai, làm gì, khi nào, ảnh hưởng gì tới bức tranh.** Trường thứ tư là thứ phân biệt nó với audit log kỹ thuật.

```txt
Hà · hôm nay 09:12
Cập nhật số dư VPBank
18,9tr · thanh khoản +2,4tr
```

Rules:

```txt
Nhật ký là trang secondary, không phải Home section.
Không notification realtime cho mọi entry — vi phạm §0.2 “không phải công cụ theo dõi đối phương”.
Entry liên quan tới nguồn tiền `Riêng tư` chỉ hiện với người sở hữu.
Nhật ký là nguồn dữ liệu cho `Cần cập nhật` trên Home.
```

---

## 2.15. Freshness là thuộc tính của primary number — MỚI

Mọi money number derived đều phải mang theo phạm vi dữ liệu tạo ra nó. Không có ngoại lệ trên Home.

Cấu trúc bắt buộc quanh Flexible Money:

```txt
1. Giá trị            54tr
2. Cách tính          Sau các khoản đã biết và quỹ an toàn 40tr đã đặt.
3. Phạm vi dữ liệu    Tính từ 5 nguồn · 3 mới trong tuần · 2 cần cập nhật
4. Hệ quả nếu thiếu   Số trên chưa gồm thay đổi của VCB và tiền mặt.
5. Action             Cập nhật nhanh
```

Dòng 3 và 4 là phần mới của v3.4. Dòng 4 chỉ xuất hiện khi thực sự có nguồn stale.

Rules:

```txt
Coverage strip nằm TRONG Financial Picture, không phải section riêng.
Coverage strip hiện cả khi mọi thứ đều mới — nó là ngữ cảnh, không phải cảnh báo.
  Trạng thái tất cả mới: “Tính từ 5 nguồn · tất cả mới trong tuần”, neutral, không màu.
Không dùng phần trăm độ tin cậy. “87% đáng tin” là con số bịa.
Không ẩn freshness sau tooltip hoặc icon.
Không làm mờ money number khi dữ liệu cũ — giá trị vẫn là giá trị tốt nhất đang có.
```

Freshness cũng phải xuất hiện inline ở mọi nơi hiển thị một nguồn tiền cụ thể (§12.5) và ở mọi event chưa xác nhận (§12.3). Một chỗ tổng hợp không thay thế được các dấu hiệu tại điểm sử dụng.

## 2.16. Không hiển thị độ chính xác giả — MỚI

Sản phẩm dựa trên dữ liệu nhập tay và dự báo. Cả hai đều không chính xác tuyệt đối. UI không được tỏ ra chắc chắn hơn dữ liệu (§16.1).

```txt
Có nguồn stale        → nói rõ số nào chưa gồm nguồn nào.
Có event chưa xác nhận → đánh dấu event, không âm thầm cộng vào forecast.
Dự báo xa             → nói “theo tốc độ hiện tại”, không nói “sẽ”.
What-if               → ghi rõ tính trên dữ liệu nào (§12.7).
```

Không dùng:

```txt
Con số lẻ tới hàng nghìn khi nguồn là ước lượng tay.
Ngày tất toán / ngày đạt mục tiêu chính xác tới ngày.
Thanh “độ tin cậy” dạng phần trăm.
```

---

## 3. Tech Stack UI

```txt
React
Tailwind CSS v4
shadcn/ui
lucide-react
```

Dùng shadcn ở lớp component, **không ship theme mặc định**. Theme default của shadcn là ngôn ngữ admin panel, và mấy thứ nó bật sẵn đều trái với §2.2–2.4.

Ghi đè bắt buộc:

```txt
Card       bỏ border, bỏ shadow, radius 14
Table      bỏ border-b trên row, header dùng .label
Separator  gần như không dùng
Input      bỏ border, nền --sunk
Button     radius 8–10, không shadow
Sidebar    bỏ border-right và bỏ nền riêng
```

Đặt toàn bộ token §6 trước khi build màn hình đầu tiên. Retheme sau 40 màn hình đắt hơn nhiều lần.

---

## 4. Visual Language

## 4.1. Register

Money Space đọc ra là **một cuốn sổ được giữ tử tế**, không phải một app thư giãn và cũng không phải một terminal giao dịch.

```txt
Nghiêm cẩn nhưng không lạnh
Đáng tin qua mật độ, không qua trang trí
Ấm ở màu nền, chặt ở cấu trúc dữ liệu
Trưởng thành, không phán xét
```

## 4.2. Hai cái bẫy đã gặp

**Bẫy wellness.** Bảng màu đất khử màu, font-weight 300 ở cỡ lớn, mật độ thấp, không khối nào có trọng lượng → đọc ra là app thiền. Neo bằng: accent bão hoà thật, weight 500 cho số, bảng có dữ liệu thật.

**Bẫy dashboard.** Nhiều KPI ngang cấp, chart lớn trang trí, viền sắc quanh mọi card, nền tối → đọc ra là công cụ quản trị. Neo bằng: một hero number duy nhất, chart chỉ khi truyền tải low point, không viền, không nền tối.

## 4.3. Avoid

```txt
nền tối cho bất kỳ section nào
gradient
emoji trong UI chính
shadow trên panel
chart trang trí
nhiều divider
viền quanh mọi child item
card lồng card quá 3 tầng
subtitle filler
font-weight 300
tông đất / sage / brass micro-type
lime hoặc navy kiểu fintech dashboard
```

---

## 5. Color System

## 5.1. Hai bảng màu

**Ledger** — mặc định. Trung tính lạnh, lục ngân hàng bão hoà.

```txt
--app          #EEF1F3
--panel        #FFFFFF
--sunk         #F5F7F8
--ink          #15181C
--ink2         #525860
--ink3         #868D96
--hair         #E5E9EC
--accent       #0A6B47
--accent-soft  #E3EFEA
--attention    #B07A1E
--alert        #B23A26
--committed    #D2D6DA
--protect      #A9B0B8
```

**Archive** — thay thế. Ngà ấm, đỏ rượu. Ấm hơn cho một sản phẩm gia đình, vẫn nghiêm nhờ tương phản cao.

```txt
--app          #F1ECE2
--panel        #FDFBF7
--sunk         #F7F3EB
--ink          #1E1913
--ink2         #5C5348
--ink3         #8E8375
--hair         #E9E2D6
--accent       #8C2F39
--accent-soft  #F4E8E8
--attention    #9A6A16
--alert        #A8391F
--committed    #DCD3C4
--protect      #B5AA98
```

Chọn một và chốt. Không ship theme switcher cho user.

## 5.2. Semantic usage

```txt
Accent      → primary CTA, active nav, link, tiền vào, đoạn “linh hoạt”
Attention   → nguồn dữ liệu cũ, event chưa xác nhận, thấp nhất chạm gần quỹ
Alert       → thiếu hụt thật, quá hạn, vượt phần linh hoạt
Ink ramp    → mọi thứ còn lại
```

**Màu chỉ dành cho thứ user cần làm gì đó.** Trạng thái bình thường không có màu.

## 5.3. Accent discipline

Chụp màn hình Home, ước lượng diện tích có màu. Vượt khoảng 5% là đang tiêu màu vào trang trí.

Accent xuất hiện ở đúng:

```txt
nút Thử một khoản chi
mục nav đang active
link hành động trong header của mỗi section
số tiền vào trong bảng dòng tiền
đoạn “linh hoạt” trong thanh money composition
```

## 5.4. Money composition dùng độ đậm, không dùng hue

```txt
Đã có nhiệm vụ    --committed    nhạt nhất
Quỹ cần bảo vệ    --protect      trung
Linh hoạt         --accent       bão hoà, cần đọc trước
```

Quỹ cần bảo vệ ở trạng thái bình thường là **neutral**, không phải amber. Amber được giải phóng hoàn toàn cho `attention`. Nếu dự báo cho thấy quỹ bị chạm, lúc đó đoạn đó mới chuyển amber — và lúc đó nó thực sự cần user phản ứng.

Nợ không có hue riêng ở bất kỳ surface nào.

## 5.5. Freshness color mapping

```txt
Mới, trong ngưỡng     --ink          segment đặc
Cần cập nhật          --attention    segment đặc + text
Chưa từng cập nhật    --committed    segment nhạt
Event chưa xác nhận   --attention    nhãn text “cần xác nhận”
```

Không dùng màu xanh cho “mới” — dữ liệu mới là mặc định, tô màu cho mặc định làm loãng tín hiệu. Không dùng đỏ cho dữ liệu cũ — đỏ dành cho thiếu hụt tài chính thật.

---

## 6. Tokens

```css
:root,
.ledger {
  --app: #eef1f3;
  --panel: #ffffff;
  --sunk: #f5f7f8;
  --ink: #15181c;
  --ink2: #525860;
  --ink3: #868d96;
  --hair: #e5e9ec;
  --scrim: rgba(21, 24, 28, 0.34);
  --accent: #0a6b47;
  --accent-soft: #e3efea;
  --attention: #b07a1e;
  --alert: #b23a26;
  --committed: #d2d6da;
  --protect: #a9b0b8;

  --radius-panel: 14px;
  --radius-sunk: 10px;
  --radius-control: 8px;
}

.archive {
  --app: #f1ece2;
  --panel: #fdfbf7;
  --sunk: #f7f3eb;
  --ink: #1e1913;
  --ink2: #5c5348;
  --ink3: #8e8375;
  --hair: #e9e2d6;
  --scrim: rgba(30, 25, 19, 0.34);
  --accent: #8c2f39;
  --accent-soft: #f4e8e8;
  --attention: #9a6a16;
  --alert: #a8391f;
  --committed: #dcd3c4;
  --protect: #b5aa98;
}

body {
  background: var(--app);
  color: var(--ink);
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.panel {
  background: var(--panel);
  border-radius: var(--radius-panel);
}
.sunk {
  background: var(--sunk);
  border-radius: var(--radius-sunk);
}

.num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

.label {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink3);
}
```

Với shadcn: map `--card` → `--panel`, `--muted` → `--sunk`, `--background` → `--app`, `--primary` → `--accent`. Ghi đè `Card` để bỏ `border` và `shadow`, và `Table` để bỏ `border-b` trên row.

---

## 7. Layout and Spacing

## 7.1. Vertical rhythm

```txt
Section → Section          16px   (space-y-4)
Section padding desktop    32px   (p-8)
Section padding mobile     20px   (p-5)
Header trong section → body 28px
Column gap trong section   56px   (gap-x-14)
Table row                  py-2.5 (dòng tiền) / py-3 (nguồn tiền)
Bảng → dòng tổng           20px
```

Section padding 32px lớn hơn v3.x có chủ ý: panel không có viền, nên khoảng trắng trong panel chính là thứ tạo cảm giác “khối”.

## 7.2. Grid trong section

Mỗi section chia hai cột không đều: cột trái là **câu trả lời**, cột phải là **chi tiết**.

```tsx
<div className="grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,380px)_1fr]">
  <div>{/* số lớn, tóm tắt, coverage */}</div>
  <div>{/* bảng, legend, breakdown */}</div>
</div>
```

Home là **một cột dọc các section full width**, không phải grid 7fr/5fr hai cột. Mỗi section chiếm trọn chiều ngang và có hình dạng nội dung khác nhau — số lớn, biểu đồ + bảng, bảng, list — chính sự khác nhau đó là tín hiệu quét.

## 7.3. Natural height

```txt
Không min-height để cân layout.
Không equal-height.
Chỉ ghép hai section cạnh nhau khi chúng là một cặp có nghĩa (Tài sản | Nợ).
```

## 7.4. Sidebar

```txt
Width 240px
Không nền riêng, không viền phải — nằm trực tiếp trên --app
Nav row cao 33px, radius 8px
Active state: nền --panel, weight 500
Nhóm nav có nhãn mono uppercase
Primary CTA đặt ngay dưới logo
Cụm hai người ở đáy sidebar
```

---

## 8. App Shell — CẬP NHẬT

Desktop:

```txt
Left sidebar
Main content
Optional dialog/sheet for What-if
```

Tablet:

```txt
Collapsed / hidden sidebar
Main content full width
```

Mobile:

```txt
Top header
Single column
Bottom nav max 5 items
What-if CTA có thể sticky
```

MVP navigation — giữ đúng 5 item:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Nhà mình
```

Secondary:

```txt
Lịch sử cập nhật     ← nơi ở của Financial Event Log
Cài đặt
```

**Nợ và Nhật ký không thêm nav item.** Nợ là tab thứ hai trong trang `Tài sản` (§14.9). Nhật ký là trang `Lịch sử cập nhật` đã có sẵn (§14.10). Nav 5 item là ràng buộc cứng vì mobile bottom nav không chứa được hơn.

Mobile bottom nav khớp 1:1 với 5 item trên. `Lịch sử cập nhật` và `Cài đặt` vào trong `Nhà mình`.

Không có Discussion tab.

---

## 9. Home Information Architecture

## 9.1. Home order

Logical priority:

```txt
1. Financial Picture
   - Financial State
   - Flexible Money
   - What-if CTA

2. 30 ngày tới
   - Lowest projected balance
   - Incoming / outgoing
   - top timeline events

3. Mục tiêu chính
   - current / target
   - projected completion
   - required contribution if behind target

4. Tiền đang ở đâu
   - holder / shared context

5. Cần cập nhật
   - stale sources / unconfirmed events
```

What-if **không phải item thứ 6**. Nó là action nằm trong Financial Picture.

Nợ và Nhật ký **không phải item thứ 6 hoặc 7**. Xem §2.13, §2.14.

## 9.2. Desktop composition

```txt
┌ Sidebar ┐ ┌ Main ─────────────────────────────────────────────────┐
│ CTA     │ │ Tổng quan · Thứ năm 13/08/2026        Cập nhật nhanh  │
│         │ │                                                        │
│ Bức     │ │ ┌ Bức tranh hôm nay ────────────────────────────────┐ │
│ tranh   │ │ │ ● ổn                        ● 2 nguồn cần cập nhật│ │
│ ·····   │ │ │ 48,2 triệu linh hoạt    │  composition + legend   │ │
│ Quyết   │ │ │ coverage strip          │  [ Thử một khoản chi ]  │ │
│ định    │ │ └───────────────────────────────────────────────────┘ │
│ ·····   │ │ ┌ Ba mươi ngày tới ────────────────────────────────┐  │
│ Nhà     │ │ │ 36,1 tr thấp nhất       │  bảng 5 cột + tổng    │  │
│ mình    │ │ └──────────────────────────────────────────────────┘  │
│         │ │ ┌ Mục tiêu chính ─────────────────────────────────┐   │
│         │ │ └─────────────────────────────────────────────────┘   │
│         │ │ ┌ Tài sản ──────────┐ ┌ Nợ ────────────────────┐      │
│         │ │ └───────────────────┘ └────────────────────────┘      │
│ A B     │ │ ┌ Tiền đang ở đâu ────────────────────────────────┐   │
└─────────┘ │ └─────────────────────────────────────────────────┘   │
            │ ┌ Nhật ký ────────────────────────────────────────┐   │
            │ └─────────────────────────────────────────────────┘   │
            └────────────────────────────────────────────────────────┘
```

Home là **một cột dọc các section full width**. Chia đôi chỉ ở cặp Tài sản | Nợ. Việc chia hai cột nằm _bên trong_ mỗi section (§7.2), không phải ở cấp trang.

## 9.3. Mobile order

```txt
1. Financial Picture
2. 30 ngày tới
3. Mục tiêu chính
4. Tiền đang ở đâu
5. Cần cập nhật
```

Primary What-if CTA có thể sticky ở bottom, nhưng vẫn là cùng một action với CTA trong Financial Picture.

---

## 10. Typography System

## 10.1. Hai font, hai vai trò

```txt
Be Vietnam Pro   400 / 500 / 600
  → mọi văn bản tiếng Việt, tiêu đề, nhãn, số lớn

IBM Plex Mono    400 / 500
  → ngày tháng, đơn vị, phần trăm phụ, nhãn .label, đếm, timestamp
```

Quy tắc phân vai: **mono chỉ chạm chuỗi ASCII.** IBM Plex Mono render dấu tiếng Việt kém hơn Be Vietnam Pro, nên không dùng mono cho bất kỳ chuỗi có dấu nào. Đây là lỗi dev rất dễ mắc — ghi vào code review checklist.

## 10.2. Scale

```txt
Hero money         64px / weight 500 / tracking -0.04em / leading 0.86
Metric lớn thứ hai 30px / weight 500 / tracking -0.03em
Metric trong bảng  22px / weight 500
Page title         19px / weight 500 / tracking -0.015em
Section title      16px / weight 500 / tracking -0.01em
Body               14px / weight 400
Secondary          13px / weight 400 / --ink2
Caption            11–12px / --ink3
.label             10px mono uppercase tracking 0.15em / --ink3
```

Không dùng weight 300 ở bất kỳ đâu. Không dùng weight 600 trừ logo và nhãn cần nhấn mạnh mạnh.

## 10.3. Vietnamese constraints

```txt
Weight tối thiểu 400.
Line-height ≥ 1.4 body, ≥ 1.25 heading.
tracking âm chỉ áp cho SỐ. Không áp cho chuỗi tiếng Việt.
Mono uppercase tracking rộng chỉ dùng cho .label ngắn, không dùng cho câu.
Test case bắt buộc: `Quỹ cần bảo vệ · Chưa đủ · Người phụ trách`
```

## 10.4. Money formatting

```txt
< 1 triệu        450.000đ
1tr – 999tr      48,2 tr      130,0 tr      209,7 tr
≥ 1 tỷ           1,81 tỷ      2,85 tỷ
Delta            +32,0        −14,2
Range            48,2 → 18,2
```

```txt
tabular-nums bắt buộc ở mọi money value.
Dấu phẩy là thập phân, dấu chấm là hàng nghìn.
Tối đa một chữ số thập phân.
Dấu trừ dùng − (U+2212).
Trong bảng: bỏ đơn vị ở từng ô, ghi ở header hoặc chú thích cuối bảng.
Ngoài bảng: luôn kèm đơn vị.
```

## 10.5. Timestamp

```txt
< 1 giờ        vừa xong
cùng ngày      hôm nay
1 ngày         hôm qua
2–29 ngày      N ngày trước
≥ 30 ngày      hơn 1 tháng trước
chưa từng      chưa cập nhật
```

Vượt ngưỡng stale của loại nguồn → chuyển `--attention`. Luôn có con số, không dùng “gần đây”.

---

## 11. Component Patterns

## 11.1. Panel

```tsx
<section className="panel p-5 sm:p-8">
  <div className="flex items-baseline justify-between">
    <h2 className="text-[16px] font-medium tracking-[-.01em]">
      Ba mươi ngày tới
    </h2>
    <span className="font-mono text-[11px] text-ink3">
      13/08 — 12/09 · 4 khoản
    </span>
  </div>
  <div className="mt-7">…</div>
</section>
```

Header của mỗi section là **title bên trái + một metadata hoặc một link hành động bên phải**. Không subtitle mặc định.

## 11.2. Sunk block

Dùng cho dòng tổng, khối biểu đồ, ô kết quả, input, badge.

```tsx
<div className="sunk mt-5 flex items-baseline justify-between px-4 py-3.5">
  <span className="text-[13px] text-ink2">Tổng tiền mặt</span>
  <span className="num text-[17px] font-medium">209,7 tr</span>
</div>
```

Dòng tổng là sunk block, **không** phải một dòng bảng có gạch trên.

## 11.3. Dense table

```tsx
<table className="w-full text-[14px]">
  <thead>
    <tr className="label">
      <th className="pb-3 text-left font-normal">Ngày</th>…
      <th className="pb-3 text-right font-normal">Còn lại</th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-[var(--sunk)]">
      <td className="py-2.5 font-mono text-[12px] text-ink3">24/08</td>…
    </tr>
  </tbody>
</table>
```

```txt
Không kẻ row. Hover nền --sunk, bo góc hai đầu row.
Cột số căn phải, tabular.
Cột ngày và cột người dùng mono.
Bảng dòng tiền BẮT BUỘC có cột “Còn lại” chạy số dư luỹ kế —
  nó biến danh sách sự kiện thành một sequence, và trả lời trực tiếp §2.7.
```

## 11.4. Money composition bar

```tsx
<div className="flex h-2.5 gap-1" role="img" aria-label={summary}>
  <div
    className="rounded-l-full bg-[var(--committed)]"
    style={{ flex: committed }}
  />
  <div className="bg-[var(--protect)]" style={{ flex: protectedReserve }} />
  <div
    className="rounded-r-full bg-[var(--accent)]"
    style={{ flex: flexible }}
  />
</div>
```

Legend đi kèm là 3 dòng, mỗi dòng: chấm màu · nhãn · phần trăm (mono) · số tiền căn phải.

```txt
aria-label đọc ra cả ba giá trị bằng chữ.
Segment < 4% cần min-width — đúng lúc linh hoạt ≈ 0 là lúc cần thấy nó nhất.
Chỉ animate lần mount đầu.
Không dùng pie chart cho cùng dữ liệu này.
```

## 11.5. SourceCoverageStrip

Một segment cho mỗi nguồn tiền đang tính vào bức tranh. Đặt trong sunk block, ngay dưới hero money number.

```tsx
<div className="sunk mt-6 p-4">
  <div
    className="flex items-center gap-1.5"
    role="img"
    aria-label={ariaSummary}
  >
    {sources.map((s) => (
      <span
        key={s.id}
        className="h-1.5 flex-1 rounded-full"
        style={{ background: fill(s.state) }}
      />
    ))}
  </div>
  <div className="mt-3.5 flex items-center justify-between gap-2">
    <p className="text-[13px] text-ink2">{summaryLine}</p>
    {hasStale && (
      <button className="text-[13px] font-medium text-accent">
        Cập nhật nhanh
      </button>
    )}
  </div>
  {hasStale && <p className="mt-2 text-[13px] text-ink2">{scopeCaveat}</p>}
</div>
```

```txt
Một segment = một nguồn. Không gộp, không rút gọn thành “3/5”.
Thứ tự cố định theo thứ tự nguồn trong trang Nơi giữ tiền, không sort theo trạng thái.
Trên 8 nguồn: bỏ gap, strip thành dải liền.
Segment không clickable — action duy nhất là “Cập nhật nhanh”.
Strip hiện cả khi mọi nguồn đều mới, lúc đó toàn --ink và không có caveat.
```

Copy:

```txt
Tất cả mới    Tính từ 5 nguồn · tất cả mới trong tuần
Có nguồn cũ   Tính từ 5 nguồn · 3 mới trong tuần · 2 cần cập nhật
Caveat        Số trên chưa gồm thay đổi của Quỹ mở & ETF và tiền mặt.
```

## 11.6. Status chip

```tsx
<p className="flex items-center gap-2 text-[13px]">
  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
  Nhà mình đang ổn
</p>
```

Chấm 6px + text. Không dùng pill có nền, không dùng icon.

## 11.7. Simulation surface

Vùng duy nhất trong sản phẩm có viền đứt.

```tsx
<div className="rounded-xl p-6" style={{ background: "var(--accent-soft)" }}>
  <p className="label text-accent">Nếu thực hiện</p>…
</div>
```

Trong modal: header có `.label` màu accent ghi “Đang thử — chưa ghi vào bức tranh”. Khối kết quả dùng nền `--accent-soft`. Không có surface nào khác trong app dùng nền này.

---

## 12. Home Sections

Thứ tự và nội dung giữ nguyên từ §9. Dưới đây là đặc tả thị giác.

## 12.1. Bức tranh hôm nay

```txt
Hàng chip:      ● Nhà mình đang ổn        ● 2 nguồn cần cập nhật
Cột trái:       .label “Sau nghĩa vụ và quỹ cần bảo vệ”
                48,2 · triệu linh hoạt        ← 64px
                trên tổng 209,7 tr tiền mặt · giá trị ròng 1,81 tỷ
                SourceCoverageStrip           ← §11.5
Cột phải:       money composition bar + legend 3 dòng có %
                nút Thử một khoản chi
```

```txt
48,2 là visual anchor lớn nhất Home.
Coverage strip đứng ngay dưới hero, trước mọi breakdown.
Nút mô phỏng có hai lối vào: sidebar và cột phải section này. Không thêm lối thứ ba.
Trên mobile: chip → hero → coverage strip → composition. Không đẩy coverage xuống dưới fold.
```

## 12.2. Ba mươi ngày tới

```txt
Cột trái:   .label “Thấp nhất dự kiến”
            36,1 tr                        ← 30px
            “Vào 24/08, vẫn trên quỹ cần bảo vệ 31,5 tr.”
            sunk block chứa đường dòng tiền, 3 mốc mono bên dưới
Cột phải:   bảng 5 cột: Ngày · Khoản · Ai · Số tiền · Còn lại
            sunk block “Cuối kỳ dự kiến còn linh hoạt”
```

```txt
Điểm thấp nhất trên chart đánh dấu bằng chấm --attention.
Event chưa xác nhận mang nhãn mono “cần xác nhận” màu --attention, đặt cạnh tên khoản.
Không tách section phụ “Những khoản sắp tới”.
```

## 12.3. Mục tiêu chính

```txt
Cột trái:   tên goal + chip “chính”
            160,0 / 800,0 tr        20%
            progress bar 1.5px, accent
Cột phải:   Ngày mong muốn            06/2029
            Theo tốc độ hiện tại      11/2029
            Để về đúng ngày mong muốn +4,5 tr / tháng
```

Chỉ một goal trên Home. Ngày dự kiến quan trọng hơn progress bar.

## 12.4. Tiền đang ở đâu

Bảng 5 cột: Nơi giữ · Phụ trách · Vai trò · Cập nhật · Số dư. Cột `Cập nhật` chuyển `--attention` khi vượt ngưỡng. Kết thúc bằng sunk block “Tổng tiền mặt”.

## 12.5. Nhật ký

List 3 dòng gần nhất, mỗi dòng: thời gian (mono) · người (mono) · việc · số tiền · cột impact.

Cột impact là bắt buộc — nếu một loại thay đổi không mô tả được impact thì cân nhắc không log nó.

## 12.6. Mô phỏng

Modal, không phải section. Nhập: tên khoản chi (trước), số tiền (sau), slider đồng bộ hai chiều. Kết quả 3 ô: linh hoạt còn lại · mục tiêu chậm bao lâu · quỹ cần bảo vệ có bị chạm không. Kết thúc bằng dòng phạm vi dữ liệu: “Tính trên dữ liệu hiện có; 2 nguồn chưa cập nhật.”

Actions: Gửi cho [tên] xem · Lưu thành kịch bản · Xem cách tính. Không verdict.

---

## 13. Layout Example

```tsx
export function HomePage() {
  return (
    <div className="flex min-h-screen bg-app">
      <AppSidebar />

      <main className="max-w-[1220px] min-w-0 flex-1 space-y-4 px-5 py-5 lg:px-7">
        <PageHeader />

        <FinancialPictureSection />
        <UpcomingSection />
        <MainGoalSection />

        <div className="grid gap-4 lg:grid-cols-2">
          <AssetsSection />
          <DebtSection />
        </div>

        <MoneyLocationSection />
        <ActivityLogSection />
      </main>

      <WhatIfDialog />
    </div>
  );
}
```

```txt
Section gap 16px.
Home là một cột dọc; chỉ Tài sản | Nợ ghép đôi vì chúng chỉ có nghĩa khi nhìn cùng nhau.
Không placeholder card.
Không equal-height.
```

---

## 14. Other Web Pages

Nguyên tắc:

```txt
Home = clarity + foresight + decision entry
Detail = breakdown + management + edit
```

## 14.1. Assets Page

Purpose:

```txt
Quản lý money sources / assets:
- tiền ở đâu
- ai giữ
- có tính vào household picture không
- sharing level
- data freshness
```

Desktop:

```txt
Header + Add source
Tabs: Tài sản | Nợ
Summary strip
Toolbar
Compact table / grouped management list
```

Mobile:

```txt
grouped rows
no table overflow
```

Required row info:

```txt
Tên
Loại
Giá trị
Holder
Liquidity
Sharing
Updated at
Action
```

Summary strip hiển thị net worth:

```txt
Tài sản 3,27 tỷ   −   Nợ 1,46 tỷ   =   Giá trị ròng 1,81 tỷ
```

Đây là chỗ duy nhất net worth được phép xuất hiện.

## 14.2. Upcoming Page

Name:

```txt
Sắp tới
```

Không dùng `Upcoming Payments` vì có cả incoming và outgoing.

Layout:

```txt
Header + Add event
Horizon 7 / 30 / 60 days
Summary: incoming / outgoing / lowest balance
Timeline ordered by date
```

## 14.3. Goals Page

Goal information:

```txt
Current amount
Target amount
Progress
Target date
Planned monthly contribution
Projected completion date
Required contribution nếu target đang lệch
```

What-if là contextual action trên goal detail, không phải persistent scenario module.

## 14.4. Household Page

Groups:

```txt
Thành viên
Cách hai người quản lý tài chính
Quỹ an toàn
Sharing defaults
Update frequency
```

Privacy copy luôn bằng text rõ.

## 14.5. Quick Update

Purpose:

```txt
Confirm / update những input đang làm forecast stale.
```

Không yêu cầu nhập lại snapshot totals nếu derive được từ source-of-truth records.

Mỗi lần Quick Update tạo entry trong Nhật ký.

## 14.6. Onboarding

Flow:

```txt
1. Create household
2. Chọn cách hai người đang quản lý tiền
3. Invite partner hoặc skip
4. Add 2–3 money sources quan trọng
5. Set protected reserve
6. Add main incoming
7. Add 1–3 outgoing gần nhất
8. Create main goal
9. Show first financial picture
10. Prompt What-if nếu user có khoản đang cân nhắc
```

Không hỏi toàn bộ tài sản ngay. Không hỏi về nợ ở bước đầu — nợ thêm ở bước 7 dưới dạng khoản chi định kỳ, hoặc sau onboarding.

## 14.7. Settings / Privacy

Groups:

```txt
Household
Members
Permission
Sharing defaults
Data safety
Export/delete
```

Danger zone ở cuối page.

## 14.8. Snapshot History

Purpose:

```txt
Review historical financial pictures.
Không dùng snapshot history làm source of truth cho current forecast.
```

Không cần chart phức tạp trong MVP.

## 14.9. Debt — tab trong trang Tài sản — MỚI

Purpose:

```txt
Quản lý các khoản nợ và cho user thấy khi nào tất toán theo tốc độ hiện tại.
```

Required row info:

```txt
Tên khoản
Chủ nợ / tổ chức
Dư nợ còn lại
Kỳ trả tiếp theo (ngày + số tiền)
Lãi suất nếu có
Người phụ trách
Ngày tất toán dự kiến
```

Layout:

```txt
Header + Thêm khoản nợ
Summary: tổng dư nợ · nghĩa vụ trong 30 ngày · ngày tất toán xa nhất
Table desktop / grouped rows mobile
Chi tiết một khoản → lịch trả, progress, What-if trả trước
```

Rules:

```txt
Không hue riêng cho nợ (§5.4).
Progress bar “đã trả được” chỉ ở trang chi tiết, không ở summary.
Kỳ trả tiếp theo tự động sinh event trong `Sắp tới`.
Copy trung tính: “Dư nợ còn lại”, không dùng “Bạn đang nợ”.
What-if trên trang này trả lời “nếu trả trước X thì tất toán sớm bao lâu”.
```

## 14.10. Nhật ký / `Lịch sử cập nhật` — MỚI

Purpose:

```txt
Shared source of truth: cho hai người thấy bức tranh đã thay đổi vì lý do gì và do ai.
```

Xem §2.14 cho ranh giới nội dung.

Entry structure:

```txt
Actor      ai làm
Action     làm gì
Object     lên đối tượng nào
Timestamp  khi nào
Impact     bức tranh đổi thế nào
```

Example:

```txt
Hôm nay
  Hà · 09:12   Cập nhật số dư VPBank        18,9tr    thanh khoản +2,4tr
  Minh · 08:40 Thêm khoản “Bảo hiểm nhân thọ” 12/09    cần sớm +6,8tr

10 Aug
  Cả hai       Xem kịch bản “Đổi xe máy”     45tr      chưa thực hiện
  Hà           Nâng mục tiêu “Sinh em bé”    120tr     dự kiến đủ chậm 4 tháng
```

Layout:

```txt
Group theo ngày
Filter: tất cả / theo người / theo loại thay đổi
Không infinite scroll không giới hạn — phân trang theo tháng
```

Rules:

```txt
Không notification realtime cho mọi entry.
Entry của nguồn `Riêng tư` chỉ hiện với người sở hữu.
Mỗi entry có thể revert nếu là thao tác dữ liệu, không revert được nếu là quyết định.
Cột Impact là bắt buộc — nếu một loại thay đổi không mô tả được impact, cân nhắc không ghi log nó.
```

---

## 15. Responsive Rules

**Desktop ≥1024px**

```txt
Sidebar 240px hiện.
Section chia hai cột bên trong: minmax(0,380px) 1fr.
Bảng đầy đủ cột.
Mô phỏng mở modal.
```

**Tablet 640–1023px**

```txt
Sidebar ẩn, thay bằng header có nút menu.
Section về một cột: khối tóm tắt trên, bảng dưới.
Bảng bỏ cột phụ (Vai trò, Ai) trước khi bỏ cột số.
```

**Mobile <640px**

```txt
Section padding p-5, radius giữ 14.
Bảng chuyển hoàn toàn thành grouped row — không scroll ngang.
Thứ tự trong Bức tranh: chip → hero → coverage strip → composition.
  Coverage strip KHÔNG được đẩy xuống dưới fold.
Bottom nav 5 mục: Tổng quan · Sắp tới · Mục tiêu · Tài sản · Nhà mình.
CTA mô phỏng sticky ở bottom, mở bottom sheet thay vì modal.
Money value không truncate.
```

---

## 16. Copywriting Rules

## 16.1. Voice

```txt
Bình tĩnh
Tôn trọng
Rõ ràng
Ngắn
Không phán xét
Không kiểm soát
Không giả vờ chắc chắn hơn dữ liệu
```

## 16.2. UI copy economy

Mỗi text line phải có job.

Allowed jobs:

```txt
label
value
scope
assumption
state
consequence
action
privacy clarification
```

Nếu text chỉ tạo “mood” nhưng không thêm meaning, bỏ khỏi Home.

## 16.3. Preferred words

```txt
Tình hình
Nhà mình
Sắp tới
Dự kiến
Có thể linh hoạt
Quỹ an toàn
Mục tiêu
Theo tốc độ hiện tại
Ảnh hưởng
Người phụ trách
Cần cập nhật
Dư nợ còn lại
Tất toán dự kiến
```

## 16.4. Avoid words / filler

Avoid judgmental:

```txt
Kiểm soát
Theo dõi đối phương
Hoang phí
Sai lầm
Không được mua
Bạn nên mua
Bạn không nên mua
Bạn đang nợ
Gánh nặng nợ
```

Avoid filler on Home:

```txt
Theo dữ liệu hiện có
Không cần tự cộng trong đầu
Cùng hiểu tài chính tốt hơn
Bức tranh chung cho hai người
Tương lai rõ ràng hơn
```

Không cấm tuyệt đối các câu này trong education/onboarding, nhưng không dùng làm subtitle mặc định trên dashboard Home.

## 16.5. Status copy

On track:

```txt
Nhà mình đang ổn
```

Nếu cần explanation vì có consequence:

```txt
Các khoản đã biết trong 30 ngày tới đều được cover.
```

Watch:

```txt
Có một thời điểm balance dự kiến xuống gần quỹ an toàn.
```

Incomplete:

```txt
2 khoản cần cập nhật để forecast đáng tin hơn.
```

Shortfall:

```txt
Có một thời điểm các khoản đã biết chưa được cover.
```

---

## 17. Button Labels

Primary decision:

```txt
Thử một khoản chi
```

Primary data action:

```txt
Cập nhật nhanh
```

Management:

```txt
Thêm nguồn tiền
Thêm khoản sắp tới
Thêm mục tiêu
Thêm khoản nợ
```

Secondary:

```txt
Xem timeline
Chi tiết
Xem cách tính
Xem nguồn tiền
Xem nhật ký
```

What-if result:

```txt
Thử số khác
Gửi cho <tên> xem
Lưu thành kịch bản
```

Avoid:

```txt
Phân tích rủi ro
Kiểm tra ngay
Cảnh báo
Mua được / Không mua được
```

---

## 18. Icon System

Use `lucide-react`, stroke 1.75.

```txt
LayoutGrid   Tổng quan
CalendarDays Sắp tới
Wallet       Nơi giữ tiền
Landmark     Tài sản & nợ
Target       Mục tiêu
Calculator   Thử một khoản chi
Bookmark     Kịch bản đã lưu
History      Nhật ký
Users        Hai người
Settings     Thiết lập
RefreshCw    Cập nhật nhanh
ChevronRight điều hướng
Plus         thêm mới
```

```txt
Icon chỉ dùng ở sidebar và ở nút. Không icon trong table row hay list row.
Không emoji.
Không icon-only cho privacy hoặc trạng thái — luôn kèm text.
Trạng thái dùng chấm màu 6px, không dùng icon.
```

---

## 19. MVP Rules

Do:

```txt
Home quét được trong 3–5 giây.
Flexible Money là money number lớn nhất.
Coverage strip nằm ngay dưới hero và luôn hiện.
Hai chip trạng thái độc lập ở đầu section 1.
Thấp nhất dự kiến là metric mở đầu section 30 ngày tới.
Bảng dòng tiền có cột số dư luỹ kế.
Goal có ngày dự kiến, không chỉ có phần trăm.
What-if là action mở modal, không phải section.
Consequence chỉ hiện sau khi user bấm.
Nợ vào bức tranh qua nghĩa vụ, không qua hero number.
Nhật ký ghi thay đổi bức tranh, không ghi giao dịch.
tabular-nums ở mọi money value.
mono chỉ chạm chuỗi ASCII.
Panel không viền, không shadow.
Phân tầng bằng độ sáng: app → panel → sunk.
```

Do not:

```txt
Không nền trắng cho toàn trang.
Không nền tối cho bất kỳ section nào.
Không viền quanh panel hay row.
Không divider giữa các dòng bảng.
Không shadow trên surface trong trang.
Không dùng Total Assets hoặc Net Worth làm hero.
Không tách “Những khoản sắp tới” khỏi “30 ngày tới”.
Không render scenario preview trước click.
Không chart làm trọng tâm Home.
Không thêm nav item cho mỗi feature mới.
Không cấp hue riêng cho mỗi loại tiền.
Không đặt freshness ở cuối trang.
Không giấu freshness sau icon hay tooltip.
Không phần trăm “độ tin cậy”.
Không làm mờ money number khi dữ liệu cũ.
Không font-weight 300.
Không verdict nên mua / không nên mua.
```

---

## 20. Example Home Content

```txt
● Nhà mình đang ổn                          ● 2 nguồn cần cập nhật

SAU NGHĨA VỤ VÀ QUỸ CẦN BẢO VỆ              ▬▬▬▬▬▬▬  ▬▬  ▬▬▬
48,2 triệu linh hoạt
trên tổng 209,7 tr tiền mặt · ròng 1,81 tỷ  Đã có nhiệm vụ  62%  130,0 tr
                                            Quỹ cần bảo vệ  15%   31,5 tr
▬▬ ▬▬ ▬▬ ▬▬ ▬▬                              Linh hoạt       23%   48,2 tr
Tính từ 5 nguồn · 3 mới trong tuần
· 2 cần cập nhật          Cập nhật nhanh    [ Thử một khoản chi ]
Số trên chưa gồm thay đổi của
Quỹ mở & ETF và tiền mặt.
```

```txt
Ba mươi ngày tới                                 13/08 — 12/09 · 4 khoản

THẤP NHẤT DỰ KIẾN        NGÀY   KHOẢN                AI   SỐ TIỀN  CÒN LẠI
36,1 tr                  24/08  Học phí               ·   −12,1     36,1
Vào 24/08, vẫn trên      25/08  Lương An  cần xác nhận A   +32,0     68,1
quỹ cần bảo vệ 31,5 tr.  05/09  Lương Bình            B   +21,5     89,6
                         10/09  Trả góp nhà           ·    −8,9     80,7
[ đường dòng tiền ]
                         ┌ Cuối kỳ dự kiến còn linh hoạt      80,7 tr ┐
```

```txt
Mục tiêu chính                                        Xem tất cả · 3

Cọc căn thứ hai [chính]        Ngày mong muốn              06/2029
160,0 / 800,0 tr        20%    Theo tốc độ hiện tại        11/2029
▬▬▬░░░░░░░░░░░░░░░░░░          Để về đúng ngày mong muốn   +4,5 tr / tháng
```

```txt
Tiền đang ở đâu                                       Xem nguồn tiền

NƠI GIỮ                    PHỤ TRÁCH  VAI TRÒ         CẬP NHẬT       SỐ DƯ
Techcombank · thanh toán   An         Chi tiêu chung  hôm nay      36,4 tr
VPBank · thanh toán        Bình       Chi tiêu chung  hôm nay      18,9 tr
Sổ tiết kiệm chung         Cả hai     Quỹ cần bảo vệ  đáo hạn 03/12 31,5 tr
Quỹ mở & ETF               Cả hai     Dài hạn         34 ngày trước 118,7 tr
Tiền mặt & ví điện tử      Cả hai     Chi tiêu chung  21 ngày trước  4,2 tr

┌ Tổng tiền mặt                                              209,7 tr ┐
```

Không có Home block:

```txt
NẾU CHI 30 TR → GOAL CHẬM 2 THÁNG
TỔNG DƯ NỢ 1,46 TỶ
```

---

## 21. Cheatsheet

```tsx
// Shell
<div className="flex min-h-screen bg-app">
  <aside className="hidden w-[240px] shrink-0 flex-col px-4 py-5 lg:flex">…</aside>
  <main className="max-w-[1220px] min-w-0 flex-1 space-y-4 px-5 py-5 lg:px-7">…</main>
</div>

// Panel
<section className="panel p-5 sm:p-8">…</section>

// Grid trong section
<div className="grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,380px)_1fr]">…</div>

// Sunk block / dòng tổng
<div className="sunk flex items-baseline justify-between px-4 py-3.5">…</div>

// Hero money
<span className="num text-[64px] font-medium leading-[.86] tracking-[-.04em]">48,2</span>

// Nhãn nhỏ
<p className="label">Sau nghĩa vụ và quỹ cần bảo vệ</p>

// Primary CTA
<button className="h-10 rounded-lg px-5 text-[14px] font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}>
  Thử một khoản chi
</button>

// Link hành động trong section header
<button className="text-[13px]" style={{ color: "var(--accent)" }}>Xem nguồn tiền</button>

// Nav row
<a className="nav-item" aria-current="page">Tổng quan</a>
```

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 33px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--ink2);
  transition:
    background 0.14s ease,
    color 0.14s ease;
}
.nav-item:hover {
  background: var(--sunk);
  color: var(--ink);
}
.nav-item[aria-current] {
  background: var(--panel);
  color: var(--ink);
  font-weight: 500;
}

tbody tr {
  transition: background 0.12s ease;
}
tbody tr:hover {
  background: var(--sunk);
}
td:first-child,
th:first-child {
  padding-left: 10px;
  border-radius: 7px 0 0 7px;
}
td:last-child,
th:last-child {
  padding-right: 10px;
  border-radius: 0 7px 7px 0;
}
```

---

## 22. Form Patterns

Áp cho mọi màn tạo và sửa: mục tiêu, nguồn tiền, khoản sắp tới, khoản nợ, quỹ an toàn.

## 22.0. Quy tắc điều phối — form không được đọc ra là màn nhập liệu

Đây là ràng buộc cao nhất của §22. Mọi mục còn lại chỉ là cách thực hiện nó. Nếu một quy tắc phía dưới xung đột với mục này, mục này thắng.

Money Space không phải công cụ ghi chép (§0.2). Nếu form tạo mục tiêu đọc ra như một bảng khai báo, người dùng sẽ kết luận sản phẩm là nơi phải nhập liệu — và đó chính là điều sản phẩm tuyên bố không phải.

**Ba bài kiểm tra, chạy trước khi merge:**

```txt
1. ĐẾM QUYẾT ĐỊNH
   Bao nhiêu thứ user phải nghĩ hoặc gõ trước khi thấy hệ quả đầu tiên?
   ≤ 2   đạt
   3     cần lý do
   ≥ 4   là form quản trị, thiết kế lại

2. XOÁ THỬ
   Xoá từng dòng một. Nếu user vẫn hoàn thành được việc, dòng đó ở lại vì thói quen,
   không vì cần thiết. Xoá thật.

3. KHÔNG BẮT TRA CỨU
   Không trường nào buộc user rời form để tìm số ở chỗ khác trong app.
   Nếu số đó nằm trong app, app phải điền sẵn.
```

**Dấu hiệu nhận biết form quản trị.** Gặp từ ba dấu hiệu trở lên là đã hỏng:

```txt
Trên 4 trường hiện cùng lúc
Mỗi trường có một dòng helper
Nhãn mono uppercase xếp thành cột
Nhiều lưới hai cột ghép các trường không liên quan
Mọi trường cùng cỡ, cùng trọng lượng, không có trường nào là chính
Bảng before/after
Khối “Danger zone” có viền
Không có gì xảy ra cho tới khi bấm Lưu
```

Điểm cuối cùng là dấu hiệu nặng nhất. Form quản trị là một cái phễu: nhập hết rồi gửi đi. Form của sản phẩm này phải là một cuộc đối thoại — user gõ một con số, app trả lời ngay bằng hệ quả (§22.7).

**Đích đến.** Form mục tiêu ở trạng thái tạo chỉ hiện: tên · số tiền · tháng mong muốn · một câu hệ quả · một link mở rộng. Mọi thứ khác — số đã dành, mức để dành mỗi tháng, ghi chú — được điền sẵn hoặc ẩn. Việc đặt mục tiêu chính không nằm trong form tạo: mục tiêu đầu tiên tự động là chính, các mục sau nâng lên từ danh sách.

## 22.1. Không hỏi thứ app đã biết

Đây là ranh giới giữa form tiêu dùng và form quản trị. Form quản trị hỏi mọi trường vì hệ thống không biết gì; form tiêu dùng đề xuất sẵn rồi để user chỉnh.

```txt
App đã biết          → điền sẵn, cho sửa
App suy ra được      → điền sẵn, ghi rõ nguồn suy ra
App không thể biết   → hỏi
```

Ví dụ ở form mục tiêu: mức để dành mỗi tháng suy từ tiền linh hoạt hiện có, điền sẵn 18 tr, kèm dòng “Mặc định lấy từ 48,2 tr đang linh hoạt của nhà mình”. User không phải gõ lại con số app vừa hiển thị trên Tổng quan.

Hệ quả trực tiếp: **khối hệ quả có số ngay từ trường thứ hai**, thay vì bắt điền hết mới thấy được gì.

## 22.2. Tối đa 3–4 trường hiện mặc định

Còn lại đưa vào một disclosure duy nhất.

```txt
Hiện mặc định     những gì app không thể suy ra
Sau disclosure    giá trị đã điền sẵn, trường tuỳ chọn, ghi chú
Không bao giờ     nhiều hơn một tầng disclosure
```

Form mục tiêu: hiện `tên · số tiền · tháng mong muốn`. Ẩn `đã dành được · mỗi tháng · ghi chú` sau “Điều chỉnh cách để dành”.

Nếu một form cần hơn 8 trường kể cả sau disclosure, nó không thuộc về modal — chuyển sang route riêng (§22.9).

## 22.3. Ô nhập bắt buộc có nền `--sunk`

Hệ thị giác không dùng viền (§2.2). Trong màn hiển thị điều đó đúng; trong form nó nguy hiểm — bỏ viền mà không thay bằng nền thì ô nhập trông y hệt văn bản tĩnh và user không biết chỗ nào bấm được.

```css
.field {
  background: var(--sunk);
  border-radius: 10px;
  height: 46px; /* 40px cho trường phụ */
  padding: 0 14px;
  font-size: 16px; /* 16px tránh iOS zoom khi focus */
  border: 1px solid transparent;
}
.field:focus {
  background: var(--panel);
  border-color: var(--accent);
}
.field.invalid {
  border-color: var(--alert);
}
```

Focus đảo ngược tầng surface: nền sáng lên thành `--panel`, viền accent xuất hiện. **Đây là chỗ duy nhất trong sản phẩm viền được dùng cho mục đích thị giác** — ngoài viền đứt của vùng mô phỏng, vốn mang nghĩa.

```txt
Không dùng viền xám tĩnh quanh ô nhập.
Không dùng shadow cho ô nhập.
Không để ô nhập nền trắng trên panel trắng.
Textarea cùng nền, padding dọc 11px, resize dọc.
Checkbox và radio dùng nền --sunk, tick màu --accent.
Segmented control: nền --sunk, mục active nền --panel.
```

## 22.4. Nhãn và helper trong form

```txt
Nhãn trường     13px, chữ thường, --ink2. KHÔNG dùng .label mono uppercase.
Helper          12px, --ink3, tối đa 1–2 dòng trên toàn form.
Lỗi             12px, --alert, ngay dưới trường.
```

`.label` mono uppercase là phụ kiện thưa của màn hiển thị. Xếp bảy cái liên tiếp trong một form thì nó thành ngôn ngữ form builder.

Helper phải qua bài kiểm tra §2.10. “Phần đã dành riêng cho mục tiêu này” dưới trường tên là “Đã dành riêng được” — không qua. “Mặc định lấy từ 48,2 tr đang linh hoạt” — qua, vì nó nói nguồn của con số đã điền sẵn.

## 22.5. Ô nhập tiền

```txt
Chiều cao chuẩn, KHÔNG dùng cỡ hero. Số lớn là output, không phải input.
weight 500, tabular-nums.
Đơn vị là hậu tố cố định trong ô (`tr`), không phải nhãn rời.
Dòng đọc ra số đầy đủ ngay dưới: 800 → “800.000.000 đ”.
Nhập theo đơn vị triệu; không bắt user gõ chín chữ số.
```

Dòng đọc ra số đầy đủ là bắt buộc với tiền Việt. Lệch một chữ số 0 là lỗi thật và không có cách nào bắt được nếu chỉ hiện `800`.

Chip gợi ý mốc tiền: mặc định **không dùng**. Một hàng bốn nút dưới ô nhập là nhiễu thị giác, và mốc tròn tuỳ ý còn là gợi ý ngầm về mức mục tiêu — sản phẩm không định hướng quyết định tài chính của user (§0.2). Chỉ cân nhắc khi mốc lấy từ dữ liệu của chính household đó, ví dụ “bằng 6 tháng chi tiêu”, và khi đó nên là một dòng text gợi ý, không phải hàng chip.

## 22.6. Độ chính xác của ngày

```txt
Mục tiêu tiết kiệm    input[type=month]   — không có độ chính xác tới ngày
Khoản sắp tới         input[type=date]    — có ngày cụ thể
Kỳ trả nợ             input[type=date]
```

Đây là §2.16 áp vào form: đừng để UI tỏ ra chắc chắn hơn dữ liệu.

## 22.7. Hệ quả hiện ngay khi gõ

Mọi form tạo/sửa có ảnh hưởng tới dự báo đều phải hiện hệ quả **trực tiếp trong form**, cập nhật theo từng phím, không chờ bấm lưu.

```txt
Mục tiêu     khi nào đủ · chậm/sớm bao lâu · cần bao nhiêu mỗi tháng để đúng hẹn
Khoản chi    thấp nhất trong kỳ đổi thế nào · quỹ an toàn có bị chạm không
Nguồn tiền   tiền linh hoạt đổi bao nhiêu
Nợ           tất toán dự kiến đổi thế nào
```

Trình bày là **một câu văn**, không phải lưới metric có nhãn:

```txt
Đúng
Với 18,0 tr mỗi tháng, nhà mình đủ vào 11/2029. Chậm 5 tháng so với
mong muốn — để đúng hẹn cần 20,2 tr mỗi tháng.

Sai
DỰ KIẾN ĐỦ VÀO    SO VỚI MONG MUỐN    ĐỂ ĐÚNG HẸN CẦN
11/2029           chậm 5 tháng        20,2 tr/th
```

Lưới ba ô có nhãn là ngôn ngữ báo cáo. Câu văn là ngôn ngữ hai người nói với nhau. Số quan trọng vẫn nhấn bằng `font-weight 500` và `tabular-nums` ngay trong câu.

Nền khối hệ quả dùng `--accent-soft`, giống vùng mô phỏng — cả hai đều là “nếu làm thế này thì sao”.

## 22.8. Khác biệt giữa tạo và sửa

|                   | Tạo               | Sửa                        |
| ----------------- | ----------------- | -------------------------- |
| Tiêu đề           | Mục tiêu mới      | Sửa mục tiêu               |
| Nút chính         | Tạo mục tiêu      | Lưu thay đổi               |
| Giá trị           | trống hoặc suy ra | điền sẵn từ bản đã lưu     |
| Tóm tắt thay đổi  | không             | một câu, hiện khi dirty    |
| Hành động phá huỷ | không             | text button trong hàng nút |
| Ghi Nhật ký       | “tạo mục tiêu X”  | “sửa mục tiêu X: …”        |

**Tóm tắt thay đổi là một câu, không phải bảng before/after.**

```txt
Đúng
Bạn đã đổi số tiền cần từ 800,0 tr thành 900,0 tr và tháng mong muốn
từ 06/2029 thành 09/2029.

Sai
Cần bao nhiêu    800,0 tr → 900,0 tr
Muốn đạt vào     06/2029  → 09/2029
Ghi chú          trống    → trống
```

Bảng before/after là công cụ audit. Ở trang Nhật ký nó hợp lý; trong hộp thoại sửa của một sản phẩm tiêu dùng thì lạnh và thừa. Chỉ liệt kê trường thực sự đổi.

## 22.9. Container

```txt
≤ 4 trường hiện, không phụ thuộc nhau   → modal (desktop) / bottom sheet (mobile)
> 8 trường, hoặc nhiều bước, hoặc upload → route riêng
Xác nhận phá huỷ                         → dialog nhỏ riêng, không lồng trong form
```

```txt
Modal width 520px cho form đơn, 660px cho form có bảng.
max-height 88vh. Body cuộn, header và footer cố định.
Footer luôn thấy được — nút chính không bao giờ nằm dưới vùng cuộn.
Esc đóng, click backdrop đóng, trap focus, trả focus về trigger.
Dirty + đóng → hỏi xác nhận. Không dirty → đóng thẳng.
```

## 22.10. Validation

```txt
Nút chính LUÔN bật. Không disable.
Kiểm tra khi bấm, không kiểm tra khi gõ.
Lỗi hiện dưới trường + viền --alert + focus về trường đầu tiên sai.
Lỗi biến mất ngay khi user bắt đầu sửa trường đó.
Bắt buộc tối thiểu: chỉ những gì thật sự không thể thiếu.
```

Nút bị disable giấu mất lý do — user không biết còn thiếu gì. Nút bật rồi báo lỗi cụ thể tốt hơn.

## 22.11. Hành động phá huỷ

```txt
Dùng động từ đúng với dữ liệu:
  “Đóng mục tiêu”   không phải “Xoá mục tiêu”   — lịch sử vẫn còn trong Nhật ký
  “Gỡ nguồn tiền”   không phải “Xoá tài khoản”
Luôn nói hệ quả bằng số: “160,0 tr đã dành sẽ quay về phần tiền linh hoạt.”
Là text button màu --alert trong hàng nút, tách bằng khoảng cách.
KHÔNG dùng khối có viền và tiêu đề “Danger zone” — đó là ngôn ngữ bảng quản trị.
Xác nhận bằng dialog nhỏ, không bằng gõ lại tên.
```

## 22.12. Minh bạch với người kia

Mọi thao tác lưu đều sinh một entry Nhật ký (§2.14). Form phải nói trước điều đó, đặt cạnh nút chính:

```txt
Bình sẽ thấy trong Nhật ký
```

Với thay đổi lớn — đổi mục tiêu chính, đổi quỹ an toàn, gỡ nguồn tiền chung — thêm lựa chọn `Gửi cho Bình xem` bên cạnh `Lưu`. Đây là cam kết “không giám sát lén” thể hiện theo chiều ngược lại: người thực hiện chủ động cho người kia biết.

---

## 23. UI States

Mỗi section và mỗi form phải định nghĩa đủ 5 trạng thái trước khi coi là xong.

**Empty — chưa có dữ liệu**

```txt
Bức tranh hôm nay  → prompt onboarding, KHÔNG hiện 0đ
Ba mươi ngày tới   → “Chưa có khoản nào sắp tới” + Thêm khoản
Mục tiêu chính     → “Chưa có mục tiêu” + Thêm mục tiêu
Tiền đang ở đâu    → “Chưa có nguồn tiền” + Thêm nguồn tiền
Tài sản / Nợ       → ẩn section
Nhật ký            → ẩn section
```

Không hiển thị `0đ` khi thực chất là chưa nhập dữ liệu. Hai thứ này khác nhau, và nhầm ở đây làm mất niềm tin ngay lần mở đầu tiên.

Empty state dùng nền `--panel` bình thường, không dùng illustration, không dùng emoji. Một dòng nói thiếu gì + một nút.

**Loading**

```txt
Skeleton dùng nền --sunk, giữ đúng chiều cao thật để layout không nhảy.
Không spinner toàn trang.
Money number không hiện giá trị trung gian khi đang tải.
Coverage strip hiện đủ số segment ở màu --committed trước khi biết trạng thái.
```

**Stale — dữ liệu cũ**

```txt
Giá trị vẫn hiện đầy đủ, không làm mờ.
Timestamp chuyển --attention.
Coverage strip đổi segment tương ứng.
Scope caveat xuất hiện dưới strip.
```

**Partial — thiếu một phần input**

Đây là trạng thái **thường gặp nhất**, không phải ngoại lệ. Dữ liệu do hai người nhập tay ở hai thời điểm khác nhau thì “tất cả nguồn đều mới” mới là trường hợp hiếm. Partial phải được thiết kế trước, không xử lý sau.

```txt
Flexible Money vẫn tính, vẫn hiện — đó là ước lượng tốt nhất đang có.
Coverage strip chỉ đúng nguồn nào thiếu.
Caveat nêu đích danh: “Số trên chưa gồm thay đổi của Quỹ mở & ETF và tiền mặt.”
Kết quả mô phỏng kèm dòng phạm vi: “Tính trên dữ liệu hiện có; 2 nguồn chưa cập nhật.”
Không chặn user dùng app cho tới khi cập nhật xong.
Không thay số bằng dấu “—” chỉ vì một nguồn cũ.
```

Kiểm tra khi review: mở Tổng quan ở trạng thái 2/5 nguồn cũ, trả lời trong 5 giây — _user có biết con số này chưa đầy đủ không, và có biết thiếu cái gì không?_

**Error**

```txt
Giữ dữ liệu đã có trên màn hình. Báo lỗi ở phạm vi nhỏ nhất có thể.
Không thay cả section bằng error state nếu chỉ một nguồn lỗi.
Copy nêu hệ quả: “Chưa lấy được số dư VCB. Con số dưới đây chưa gồm nguồn này.”
Lỗi lưu form: giữ nguyên dữ liệu user đã nhập, không đóng modal, không reset.
```

---

## 24. Accessibility và Motion

**Contrast**

```txt
--ink   trên --panel   ≈ 15:1
--ink2  trên --panel   ≈ 7:1
--ink3  trên --panel   ≈ 3.2:1  → chỉ metadata, KHÔNG dùng cho money value
--accent trên --panel  ≈ 6:1
--attention trên --panel ≈ 4.6:1 — kiểm tra lại nếu đổi tông
Trạng thái không được chỉ dựa vào màu — chấm màu luôn đi kèm text.
```

**Focus**

```txt
outline 2px --accent, offset 2px.
Modal trap focus, Esc đóng, trả focus về trigger.
Row bảng không focusable trừ khi có action thật.
```

**Touch target**

```txt
Tối thiểu 44×44px trên mobile.
Nav row, link trong section header, và CTA mô phỏng phải đạt ngưỡng này.
Trên desktop nav row 33px là chấp nhận được vì có chuột.
```

**Screen reader**

```txt
Money composition bar và coverage strip cần aria-label đọc ra đầy đủ giá trị.
Bảng dòng tiền là <table> có <thead> thật, không phải div grid.
Nhật ký là <ul>.
Trạng thái “đang thử” của modal phải được thông báo, không chỉ báo bằng nền accent-soft.
```

**Motion**

```txt
Chỉ animate lần mount đầu của thanh và strip.
Duration 120–550ms, easing cubic-bezier(.2,.7,.3,1).
Không animate money number đếm lên.
prefers-reduced-motion: tắt toàn bộ.
```

---

## 25. Deprecated Explorations

Các hướng đã thử và bị loại. Ghi lại để không quay lại.

| Hướng                                                                      | Vì sao loại                                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| White-first: nền trang trắng, section frame viền 2px alpha, accent #007AFF | Viền quanh mọi card tạo cảm giác cứng; nền trắng phẳng không cho ranh giới section nào để quét |
| Section padding p-4/p-5 trên desktop                                       | Panel không viền cần khoảng trắng trong để thành khối; p-4 làm nội dung dính mép               |
| Grid Home 7fr/5fr hai cột                                                  | Section bị nén ngang, bảng mất cột; một cột dọc quét nhanh hơn                                 |
| Dark section band cho hero                                                 | Cảm giác terminal tài chính; đã bị loại dứt khoát                                              |
| Bảng màu đá vôi / sage / đồng                                              | Đọc ra là app thiền                                                                            |
| Font-weight 300 ở cỡ lớn                                                   | Mất trọng lượng; dấu tiếng Việt bị mảnh                                                        |
| Gạch đôi 2px dưới mỗi section title                                        | Divider thừa                                                                                   |
| Hue riêng cho protected và debt                                            | Bảng màu phình; mất khả năng dùng màu báo trạng thái                                           |
| What-if là Home section                                                    | Consequence hiện trước khi user hỏi                                                            |
| Net worth làm hero number                                                  | Không giúp quyết định hôm nay                                                                  |
| Freshness là section cuối Home                                             | User đã tin và có thể đã quyết định trước khi cuộn tới                                         |
| Ẩn coverage strip khi mọi thứ đều mới                                      | Coverage là ngữ cảnh của con số, không phải cảnh báo                                           |
| Phần trăm “độ tin cậy dữ liệu”                                             | Con số bịa, tạo cảm giác chính xác giả                                                         |
| Theme switcher cho user                                                    | Chốt một bảng màu; switcher chỉ dùng trong giai đoạn thiết kế                                  |
| Form 7 trường ngang cấp, mỗi trường một helper                             | Ngôn ngữ form quản trị; §22.1–22.4                                                             |
| Nhãn `.label` mono uppercase cho từng trường form                          | Xếp chồng thành cột chữ hoa, mất chất tiêu dùng                                                |
| Bảng before/after trong hộp thoại sửa                                      | Công cụ audit; thuộc trang Nhật ký, không thuộc form                                           |
| Khối “Danger zone” có viền trong form                                      | Ngôn ngữ bảng quản trị; §22.11                                                                 |
| Số tiền cỡ hero làm ô nhập                                                 | Số lớn là output, không phải input; §22.5                                                      |

Nếu một hướng trên được đề xuất lại, cần lý do gắn với một vấn đề user thật, không phải lý do thẩm mỹ.

---

## 26. Final Product Feel

```txt
Một cuốn sổ chung được giữ tử tế cho hai người đang xây cuộc sống chung.

Mở Tổng quan là thấy ngay:
- nhà mình đang ổn không
- bức tranh này có mới không
- còn bao nhiêu linh hoạt
- thấp nhất sắp tới là bao nhiêu

Khi có một quyết định đáng cân nhắc:
- bấm Thử một khoản chi
- xem hệ quả
- tự quyết định cùng nhau
```

Không phải: expense tracker · household accounting · partner surveillance · investment terminal · BI dashboard · AI financial advisor · app thiền.

```txt
Shared Financial Clarity → Financial Foresight → Decision Support
```

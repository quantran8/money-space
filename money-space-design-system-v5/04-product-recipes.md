# 04 — Money Space Product Recipes

> v5.0 — recipe riêng của Money Space trên visual system mới. Không copy các recipe này sang product khác như visual foundation chung.

## 1. Product thesis

Money Space giúp household trả lời:

```txt
Tài chính gia đình hiện thế nào?
Tiền đang nằm ở đâu và ai phụ trách?
30 ngày tới có gì vào/ra?
Sau nghĩa vụ đã biết còn bao nhiêu linh hoạt?
Nếu chi X hôm nay thì tương lai thay đổi thế nào?
```

Không phải expense tracker, portfolio tracker hay accounting software.

---

## 2. Home priorities

Priority A:

```txt
Financial state
Data freshness
Flexible Money
30-day low point
```

Priority B:

```txt
Main goal projection
```

Priority C:

```txt
Money location / holder
Recent meaningful updates
```

Home là scan surface; detail mới là breakdown + management.

Visual system mới **không thay đổi priority**. Không tạo thêm KPI chỉ vì card language nhìn đẹp.

---

## 3. Home IA

Recommended order:

```txt
1. Bức tranh hôm nay
2. 30 ngày tới
3. Mục tiêu chính
4. Tiền đang ở đâu
5. Cần cập nhật
```

What-if là action, không phải Home section.

Debt không là Home hero metric.

Financial event log không là transaction feed.

---

## 4. Home visual composition

Desktop recommended:

```txt
[page ground — blue, full-bleed]
nav pills
Tài chính gia đình
Bức tranh hôm nay
coverage / household context

[canvas sheet, radius trên 32px]
Flexible Money — dominant
30-day low point
Main goal — nếu có đủ data

[direct card]
Money location

[direct card hoặc compact list]
Cần cập nhật — chỉ khi có item
```

Rules:

- Canvas sheet là surface duy nhất gom card grid — không thêm panel bên trong.
- Card là direct child của sheet.
- Không nested card.
- What-if CTA nằm cạnh Flexible Money hoặc mở side sheet/dialog.
- Không tạo card `Total / Committed / Flexible` nếu Flexible Money đã là primary answer.

---

## 5. Bức tranh hôm nay

Primary anchor = **Flexible Money**.

### Page ground

Vùng nền chỉ chứa:

```txt
nav
Tài chính gia đình
Bức tranh hôm nay
coverage/freshness context
```

Đây không phải nơi chứa breakdown. Text dùng `--ink`, không dùng chữ trắng.

### Flexible Money card

Canonical structure:

```txt
Label: Sau các khoản đã có nhiệm vụ
Hero money: 48,2 tr
Financial state
Coverage line/strip
Composition bar
Action: Thử một khoản chi
```

Number dùng Urbanist Light.

Không lặp:

```txt
Total cash
Net worth
Flexible Money
```

ở nhiều card.

### Composition bar

```txt
Đã có nhiệm vụ  → neutral gray
Linh hoạt        → data blue
```

Action color vẫn là ink/black.

---

## 6. 30 ngày tới

### Purpose

Trả lời:

```txt
Dòng tiền sẽ đi qua những mốc nào?
Điểm thấp nhất là bao nhiêu?
```

### Surface

Một top-level card.

Bên trong dùng:

```txt
answer
optional chart
rows/table
summary
```

Không dùng:

```txt
forecast card
→ chart card con
→ empty-state card con
```

### A. Balance available + ≥3 events

Desktop:

```txt
left: low point + consequence + optional chart
right: dense sequence table
footer: total in / total out
```

2-column chỉ khi cả hai side có weight.

### B. Balance available + 1–2 events

```txt
low point
optional compact chart nếu có meaning
single-column rows
total in/out
```

Không ép 2 cột.

### C. Dependency missing

Có event, chưa có source/balance:

```txt
Thấp nhất dự kiến
Chưa tính được
Chưa có số dư đầu kỳ.
[Thêm nguồn tiền]

31/08  thi  −1,0  Còn lại —

30 ngày tới: Vào 0,0 · Ra −1,0
```

- Không chart.
- Không gọi empty state.
- Notice là plain text + action trước khi dùng wash box.

### D. Empty

Không event:

```txt
Chưa có khoản nào
[Thêm khoản]
```

Empty content nằm trực tiếp trong card.

### Event fields

Core:

```txt
Ngày · Khoản · Số tiền
```

Conditional:

```txt
Ai       khi owner có meaning
Còn lại  khi derive được; dependency-missing dùng —
Status   khi cần xác nhận/stale
```

---

## 7. Mục tiêu chính

Home chỉ hiện một goal.

Top-level card structure:

```txt
Mục tiêu chính
Current / target
Progress bar
Ngày mong muốn
Theo tốc độ hiện tại
Để đúng hẹn cần — chỉ khi lệch
```

Không nested summary card.

Không thêm `20%` nếu fraction + bar đã đủ.

Nếu chưa có goal:

```txt
Mục tiêu chính
Chưa có mục tiêu
[Thêm mục tiêu]
```

---

## 8. Tiền đang ở đâu

Home compact preview theo density.

Canonical fields:

```txt
Nơi giữ
Phụ trách
Vai trò
Cập nhật
Số dư
```

### 1–2 sources

Grouped rows.

### 3+ sources

Compact table nếu comparison hữu ích.

Không card per source.

`Tổng tiền mặt` xuất hiện ở đây nếu cần; không lặp ở Financial Picture.

Privacy label nằm trong row/detail, không icon-only.

---

## 9. Debt

Debt là obligation input.

- Không hero `Tổng nợ`.
- Kỳ trả nợ tới là event trong `30 ngày tới`.
- Nghĩa vụ gần trừ vào Flexible Money.
- Payoff projection ở `Tài sản → Nợ`.
- Copy neutral: `Dư nợ còn lại`.

---

## 10. What-if

What-if là contextual action.

Entry:

```txt
Flexible Money
Goal detail
Upcoming detail
```

Không tạo một permanent Home section chỉ để chứa what-if.

### Desktop

```txt
dialog / side sheet
```

### Mobile

```txt
bottom sheet / dedicated route
```

### Before action

```txt
Tên khoản chi
Số tiền
[Xem ảnh hưởng]
```

### After action

```txt
Nếu thực hiện

Linh hoạt trước
Linh hoạt sau

30 ngày tới
Quỹ dự phòng
Mục tiêu chính
```

Consequence chỉ xuất hiện sau action.

Modeled result dùng columns + dividers.

Không 3–5 rounded result cards con.

---

## 11. Cần cập nhật

Chỉ render khi có item.

Ví dụ:

```txt
VCB · cập nhật 9 ngày trước
Tiền mặt · chưa xác nhận
```

Treatment:

- grouped rows;
- attention dot/text;
- một action rõ;
- không warning card per source.

Nếu không có item, collapse cả section.

---

## 12. Nhật ký / Lịch sử cập nhật

Ghi financial events làm bức tranh thay đổi, không ghi mọi transaction.

Entry:

```txt
Actor
Action
Object
Timestamp
Impact
```

Ví dụ:

```txt
thanh khoản +2,4 tr
cần sớm +6,8 tr
mục tiêu chậm 4 tháng
```

Dùng row/list, không card per event.

Không notification realtime cho mọi entry.

---

## 13. Privacy

Mỗi source phải rõ:

```txt
Ai phụ trách
Có tính vào household picture không
Partner thấy chi tiết hay chỉ tổng
Cập nhật lần cuối
```

Canonical labels:

```txt
Hiện chi tiết
Chỉ tính vào tổng
Riêng tư
```

Không icon-only.

Privacy là metadata/control, không tạo colored privacy card.

---

## 14. Canonical strings

```txt
Sau các khoản đã có nhiệm vụ
Tính từ <N> nguồn · tất cả đều mới
Tính từ <N> nguồn · <M> cần cập nhật
Chưa gồm <A> và <B>.
Theo tốc độ hiện tại
Để đúng hẹn cần
Nếu thực hiện
cần xác nhận
Chưa có số dư đầu kỳ.
```

Không đổi wording giữa Home và detail nếu cùng một fact/state.

---

## 15. App shell

### Desktop

Preferred visual direction:

```txt
compact rail 68–76px
main page canvas
optional top context switcher
optional dialog / side sheet
```

Rail icon-only chỉ khi:

```txt
icon đủ distinct
tooltip có
aria-label có
page title/context luôn visible
```

Nếu navigation khó hiểu bằng icon, dùng labeled sidebar 220–240px. Không hy sinh discoverability chỉ để giống visual reference.

### Main content

```txt
max width ~1280–1360px
page edge 28–32px
single page canvas
no sheet around card grid
```

### Mobile

Bottom nav tối đa 5 mục, có label:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Gia đình
```

Không thêm nav item cho mỗi feature mới.

---

## 16. Home card inventory guardrail

Một Home card phải trả lời một câu hỏi riêng.

Recommended:

```txt
Flexible Money
30-day outlook
Main goal
Money location
Needs update — conditional
```

Không atomize thành:

```txt
Total
Committed
Flexible
Source count
Freshness
Goal %
Upcoming count
```

nếu chúng chỉ là metadata/breakdown của các answer ở trên.

---

## 17. Visual QA checklist riêng cho Money Space

```txt
1. Flexible Money có còn là primary financial answer không?
2. Hero có đang tạo context thay vì chứa KPI dump không?
3. Có Total/Net worth nào lặp dưới Flexible Money không?
4. Card có đứng trực tiếp trên page không?
5. Có panel nào khác ngoài canvas sheet đang bọc card grid không?
6. Có card con / rounded summary box không cần thiết không?
7. Empty state có nằm trực tiếp trong card không?
8. Chart có data thật để tồn tại không?
9. What-if có còn là contextual action không?
10. Action có dùng ink/black thay vì data color không?
11. Typography có đúng Urbanist 300/400/500 không?
12. Heading/subheading/body có giữ hierarchy 72/20/16 tương ứng không?
13. Card có đang không dùng shadow không?
14. Mobile có giữ answer trước detail không?
```

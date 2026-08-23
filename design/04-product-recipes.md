# 04 — Money Space Product Recipes

> File này chứa quyết định riêng của Money Space. Không copy các recipe này sang product khác như thể chúng là visual foundation.

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

Home là scan surface; detail page mới là breakdown + management.

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

## 4. Bức tranh hôm nay

Primary anchor = Flexible Money.

```txt
Financial state
Coverage/freshness state
Label: Sau các khoản đã có nhiệm vụ
Hero: 48,2 tr
Coverage strip
Composition bar
CTA: Thử một khoản chi
```

Không lặp Total cash / Net worth dưới hero.

## 5. 30 ngày tới

### Purpose

Trả lời:

```txt
Dòng tiền sẽ đi qua những mốc nào?
Điểm thấp nhất là bao nhiêu?
```

### Composition by state

#### A. Balance available + ≥3 events

Desktop:

```txt
left: low point + consequence + optional line chart
right: dense sequence table
footer: total in / total out
```

#### B. Balance available + 1–2 events

```txt
low point
compact chart chỉ khi thật sự thêm meaning
single-column grouped event rows
summary total in/out
```

Không ép 2 cột với một row.

#### C. Dependency missing: có event, chưa có source/balance

```txt
Thấp nhất dự kiến
Chưa tính được
Chưa có số dư đầu kỳ.
[Thêm nguồn tiền]

31/08  thi  −1,0  Còn lại —

30 ngày tới: Vào 0,0 · Ra −1,0
```

Không render chart.
Không gọi đây là empty state.

#### D. Empty: không event

```txt
Chưa có khoản nào
[Thêm khoản]
```

### Event fields

Core:

```txt
Ngày · Khoản · Số tiền
```

Conditional:

```txt
Ai       chỉ khi actor/owner mang meaning
Còn lại  chỉ khi balance derive được; dependency-missing dùng —
Status   khi cần xác nhận/stale
```

## 6. Mục tiêu chính

Home chỉ hiện một goal.

```txt
Current / target
Progress bar
Ngày mong muốn
Theo tốc độ hiện tại
Để đúng hẹn cần (chỉ khi lệch)
```

Không thêm “20%” nếu fraction + bar đã đủ.

## 7. Tiền đang ở đâu

Detail/management data:

```txt
Nơi giữ
Phụ trách
Vai trò
Cập nhật
Số dư
```

Home dùng compact preview theo density. `Tổng tiền mặt` xuất hiện ở đây, không lặp ở Financial Picture.

## 8. Debt

Debt là obligation input.

- Không hero `Tổng nợ` trên Home.
- Kỳ trả nợ tới là event trong `30 ngày tới`.
- Nghĩa vụ gần trừ vào Flexible Money.
- Payoff projection ở `Tài sản → Nợ`.
- Copy neutral: `Dư nợ còn lại`.

## 9. What-if

What-if là contextual action.

Entry points:

```txt
Home cạnh Flexible Money
Goal detail
Upcoming detail
```

Consequence chỉ hiện sau user action.

Desktop: dialog/side sheet.
Mobile: bottom sheet/dedicated route.

## 10. Nhật ký / Lịch sử cập nhật

Ghi **financial events làm bức tranh thay đổi**, không ghi mọi transaction.

Entry:

```txt
Actor
Action
Object
Timestamp
Impact
```

Ví dụ impact:

```txt
thanh khoản +2,4 tr
cần sớm +6,8 tr
mục tiêu chậm 4 tháng
```

Không notification realtime cho mọi entry.

## 11. Privacy

Mỗi money source phải rõ:

```txt
Ai phụ trách
Có tính vào household picture không
Partner thấy chi tiết hay chỉ tổng
Cập nhật lần cuối
```

Labels:

```txt
Hiện chi tiết
Chỉ tính vào tổng
Riêng tư
```

Không icon-only cho privacy.

## 12. Canonical strings

```txt
Sau các khoản đã có nhiệm vụ
Tính từ <N> nguồn · tất cả đều mới
Tính từ <N> nguồn · <M> cần cập nhật
Chưa gồm <A> và <B>.
Theo tốc độ hiện tại
Để đúng hẹn cần
Nếu thực hiện
cần xác nhận
```

v4.2 thêm:

```txt
Chưa có số dư đầu kỳ.
```

Dùng khi forecast có event nhưng thiếu balance dependency.

## 13. App shell

Desktop:

```txt
Sidebar 240px
Main single column
Optional dialog/sheet
```

Mobile bottom nav tối đa 5 mục:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Gia đình
```

Không thêm nav item cho mỗi feature mới.

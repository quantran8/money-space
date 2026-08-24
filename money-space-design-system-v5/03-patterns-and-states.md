# 03 — Composition & State Patterns

> v5.0 — composition ưu tiên flat surfaces, direct cards và typography hierarchy. State logic vẫn là nguồn quyết định layout.

## 1. Nguyên tắc trung tâm

UI thích nghi theo:

```txt
Question
→ data availability
→ density
→ composition
→ component
```

Không chọn layout vì “template dashboard đẹp”.

---

## 2. Surface composition

### 2.1 Default page stack

```txt
page canvas
→ optional hero
→ top-level cards trực tiếp
```

Không dùng:

```txt
page
→ group panel / white sheet
  → card grid
```

### 2.2 Inside a card

Ưu tiên:

```txt
header
answer
divider
rows / chart
footer action
```

Không dùng:

```txt
card
→ rounded box
  → rounded box
```

### 2.3 Overlap

Cards có thể overlap hero 12–16px để tạo continuity.

Overlap không tạo một wrapper mới.

---

## 3. Primary answer availability

Trước khi chọn card size / 1 hay 2 cột, xác định answer có derive được không.

```txt
AVAILABLE
metric derive được
→ hiện answer

STALE
derive được từ data cũ
→ hiện answer + scope caveat

DEPENDENCY_MISSING
có domain data nhưng thiếu input
→ không giả metric; giữ data thật + local action

EMPTY
không có domain data
→ empty state

ERROR
lỗi kỹ thuật
→ giữ usable data + local error
```

---

## 4. Data density

```txt
0 item       empty / onboarding
1–2 item     single column / grouped rows
3–6 item     grouped rows; table nếu comparison meaningful
7+ item      top rows + “+N mục khác” trên Home; full detail view
```

Data density thấp thì composition hẹp lại.

Không tạo thêm card để lấp khoảng trống.

---

## 5. Card grid threshold

Card grid dùng khi mỗi card có **một answer độc lập**.

Ví dụ hợp lệ:

```txt
Flexible Money
30-day low point
Main goal
```

Ví dụ không hợp lệ:

```txt
Total
Committed
Flexible
Sources
Coverage
```

nếu các card chỉ là breakdown của cùng một answer và làm fact lặp lại.

### Two-column `answer | detail`

Chỉ dùng khi:

```txt
left = answer/consequence thật
AND
right = ≥3 rows hoặc chart/table đủ information weight
```

Fallback 1 column khi:

```txt
metric unavailable
1–2 rows
right side mostly empty
tablet/mobile
```

Không giữ cột rỗng để bảo toàn layout.

---

## 6. Visual hierarchy

Thứ tự ưu tiên:

```txt
type scale
spacing
alignment
data contrast
surface
divider
color
```

Không ưu tiên:

```txt
shadow
border
nested container
colored icon box
```

Nếu xóa rounded background mà relation vẫn đọc được, background đó không cần tồn tại.

---

## 7. Section header

### Home preview

```txt
title + metadata
OR
title + action
```

### Detail

Có thể:

```txt
title + metadata + primary action
```

khi ba phần trả lời ba câu khác nhau.

Không subtitle filler.

---

## 8. Copy budget

Default Home section:

```txt
1 title
0–1 metadata/action
1 label cho primary answer
0–1 consequence line
0–1 caveat
0 subtitle filler
```

Một line chỉ tồn tại nếu làm:

```txt
scope
assumption
consequence
state
action
```

Typography lớn không phải lý do để thêm nhiều copy.

---

## 9. Một dữ kiện, một chỗ

Hard constraint:

- Một number không lặp ở nhiều card để tạo hierarchy.
- Một fact có một canonical wording.
- Một action giữ cùng label xuyên app.
- Không lặp source amount trong hero nếu Home money-location đã là canonical breakdown.

Exception:

- legend trực tiếp của visualization;
- modeled value trong simulation so với actual value.

---

## 10. State matrix

### 10.1 Empty

Không có domain data.

```txt
30 ngày tới  → Chưa có khoản nào + Thêm khoản
Mục tiêu     → Chưa có mục tiêu + Thêm mục tiêu
Nguồn tiền   → Chưa có nguồn tiền + Thêm nguồn tiền
```

Empty state nằm trực tiếp trong top-level card.

Không:

```txt
card
→ empty-state card con
```

Không hiển thị 0 khi thực chất chưa nhập.

### 10.2 Partial / stale

- Derived value vẫn hiện.
- Coverage nói source nào cũ/thiếu.
- Không làm mờ số.
- Không block user.
- Không tạo warning card nếu một line text đủ.

### 10.3 Dependency missing

Ví dụ:

```txt
Có upcoming event
Không có starting balance
→ không tính low point / running balance
```

Behavior:

```txt
giữ event list
primary metric: “Chưa tính được” hoặc collapse
caveat: “Chưa có số dư đầu kỳ.”
action: “Thêm nguồn tiền”
running balance: —
không chart giả
không biến cả section thành empty
```

### 10.4 Unconfirmed event

- Đánh dấu event trực tiếp.
- Không âm thầm cộng vào confident forecast.
- Alternative range chỉ khi product logic hỗ trợ.
- Attention color nằm ở event/status, không tô cả card.

### 10.5 Error

- Giữ usable data.
- Báo lỗi ở scope nhỏ nhất.
- Không replace cả card nếu chỉ một source lỗi.

---

## 11. Forecast pattern

Forecast là sequence.

```txt
summary answer
→ optional chart
→ ordered events
→ total in / total out
→ detail action
```

Không phải:

```txt
collection of event cards
```

### Low point

Low point chỉ có nghĩa khi running balance derive được.

Nếu không derive:

```txt
không fake 0
không chart
show dependency message + action
```

### Chart placement

Chart trực tiếp trong forecast card.

Không bọc chart trong rounded box trừ khi cần contrast vì graph overlap background.

---

## 12. Empty space

Khoảng trắng là part of composition.

Không “fill” bằng:

```txt
extra card
repeated KPI
subtitle
decorative graph
illustration không có task value
nested box
```

Nếu content ít:

```txt
narrow width
stack
increase breathing room
```

Không stretch rows để lấp viewport.

---

## 13. Hero pattern

Hero dùng để tạo page identity, không phải KPI dump.

Good:

```txt
Tài chính gia đình
Bức tranh hôm nay
coverage/context
```

Bad:

```txt
hero
→ 4 KPI boxes
→ 3 source cards
→ chart
```

Primary financial answer nên có canonical card ngay sau hero nếu nó cần scan riêng.

---

## 14. Decision / modeled state

Actual state và modeled state phải đọc khác nhau.

Before action:

```txt
input
CTA
```

After action:

```txt
Nếu thực hiện
actual → modeled
consequence
dependency caveat
```

Modeled surface có thể dùng `--model`/tonal blue.

Bên trong dùng columns + dividers, không nested KPI cards.

---

## 15. Responsive

### Desktop ≥1024

- Compact rail hoặc labeled sidebar tùy discoverability.
- Hero 56–72px heading.
- Grid chỉ khi mỗi card có answer thật.
- 2-column theo threshold, không theo template.

### Tablet 640–1023

- Grid giảm column.
- Answer trước detail.
- Hero 48–56px.
- Không giữ right rail nếu nó làm content rỗng.

### Mobile <640

- Page edge 16–20px.
- Card padding 18–20px.
- Display 40–48px.
- Table → grouped rows.
- Core flow không horizontal scroll.
- Action target ≥44px.
- Primary answer xuất hiện trước decoration.
- Bottom nav có labels.

---

## 16. Information density guardrails

Trước khi thêm một surface, hỏi:

```txt
Nó có answer riêng không?
Nó có interaction riêng không?
Nó có state riêng không?
```

Nếu cả ba là “không”, surface đó có khả năng nên là:

```txt
row
divider
plain text
chart
```

chứ không phải card.

---

## 17. Decision checklist

Trước khi ship:

```txt
1. Câu hỏi chính là gì?
2. Primary answer derive được không?
3. State là available / stale / dependency-missing / empty / error?
4. Có bao nhiêu child item?
5. Mỗi top-level card có một answer riêng không?
6. Có wrapper/card group nào chỉ để “gom” card không?
7. Có rounded box con nào bỏ đi mà relation vẫn rõ không?
8. List hay table scan nhanh hơn?
9. Chart có thêm meaning không?
10. Fact/number có lặp không?
11. Copy nào xoá đi mà meaning không đổi?
12. Color đang encode data/action/state đúng vai trò không?
13. Mobile có answer trước detail không?
14. Shadow/border có thật sự cần không?
```

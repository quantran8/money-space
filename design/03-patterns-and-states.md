# 03 — Composition & State Patterns

## 1. Nguyên tắc trung tâm

UI phải thích nghi theo **answer + state + density**, không theo một layout template cố định.

```txt
Question → data availability → density → composition → component
```

## 2. Adaptive composition

### 2.1 Primary answer availability

Trước khi chọn 1 hay 2 cột, xác định metric mở đầu section có thật sự available hay không.

```txt
AVAILABLE
metric derive được → có thể dùng answer/detail split

STALE
metric derive được từ data cũ → vẫn hiện metric + scope caveat

DEPENDENCY_MISSING
có domain data nhưng thiếu input để derive metric → không giả metric; show local action

EMPTY
không có domain data → empty state

ERROR
có lỗi kỹ thuật → giữ usable data, báo lỗi nhỏ nhất
```

### 2.2 Data density

```txt
0 item       empty / onboarding
1–2 item     single-column or grouped rows
3–6 item     grouped rows; desktop có thể table nếu comparison cần thiết
7+ item      top rows + “+N mục khác” trên Home; full table ở detail
```

### 2.3 Two-column threshold

2-column `answer | detail` chỉ dùng khi **cả hai phía có đủ trọng lượng**.

Use 2-column khi:

```txt
left: metric/consequence thật
AND
right: ≥3 rows, hoặc chart/table đủ thông tin
```

Fallback 1-column khi:

```txt
metric unavailable
1–2 events
right side mostly empty
mobile/tablet
```

Không giữ cột 380px chỉ để bảo toàn template.

## 3. Section header

### Default Home preview

```txt
title + metadata
OR
title + action
```

### Detail page

Có thể dùng:

```txt
title + compact metadata + primary action
```

nếu mỗi thứ trả lời một câu khác nhau.

### Rule

Không thêm subtitle filler. Metadata phải là scope; action phải dẫn tới next step.

## 4. Copy budget

Copy budget vẫn giữ nhưng là **guardrail**, không phải quota tuyệt đối.

Default cho Home section:

```txt
1 section title
0–1 metadata/action ở header
1 label cho primary number
0–1 consequence line
0–1 caveat khi data thiếu
0 subtitle filler
```

Một dòng chỉ tồn tại nếu làm một việc:

```txt
scope / assumption
consequence / state
action
```

## 5. Một dữ kiện, một chỗ

Hard constraint:

- Một number không lặp lại ở nhiều block chỉ để tạo hierarchy.
- Một fact có một canonical wording.
- Một action giữ cùng label xuyên app.

Exception: legend trực tiếp của visualization.

## 6. State matrix

### 6.1 Empty

Không có domain data.

```txt
30 ngày tới       Chưa có khoản nào + Thêm khoản
Mục tiêu          Chưa có mục tiêu + Thêm mục tiêu
Nguồn tiền        Chưa có nguồn tiền + Thêm nguồn tiền
```

Không hiển thị 0 khi thực chất chưa nhập.

### 6.2 Partial — stale source

Có đủ dependency để derive nhưng một phần source stale.

- Derived value vẫn hiện.
- Scope/coverage chỉ rõ source thiếu/cũ.
- Không làm mờ số.
- Không block user.

### 6.3 Dependency missing — NEW v4.2

Có domain object nhưng thiếu dependency để derive result.

Ví dụ cash-flow:

```txt
Có upcoming event
Không có starting balance / money source
→ không tính low point và running balance
```

Behavior:

```txt
Giữ event list.
Primary metric: “Chưa tính được” hoặc collapse nếu context đã rõ.
Một notice gần metric: “Chưa có số dư đầu kỳ.”
Một action: “Thêm nguồn tiền”.
Running balance row dùng “—”.
Không render chart giả.
Không biến cả section thành empty state.
```

### 6.4 Unconfirmed event

Event chưa xác nhận:

- Đánh dấu event trực tiếp.
- Không âm thầm cộng vào confident forecast.
- Có thể hiển thị alternative/projected range nếu product logic hỗ trợ.

### 6.5 Error

- Giữ usable data trên màn.
- Báo lỗi ở scope nhỏ nhất.
- Không thay toàn section bằng error nếu chỉ một source lỗi.

## 7. Forecast pattern

Forecast là sequence, không phải một collection card.

```txt
summary answer
→ optional supporting visual
→ ordered events
→ total in / total out
→ detail action
```

### Low point

Low point chỉ có nghĩa khi running balance derive được.

Nếu không derive được:

```txt
không hiển thị giả 0
không dùng em dash như primary answer nếu có cách diễn đạt rõ hơn
show dependency message + action
```

## 8. Responsive

### Desktop ≥1024

- Sidebar có thể hiện.
- Section 2 cột **khi threshold §2.3 đạt**.
- Table khi density/comparison phù hợp.

### Tablet 640–1023

- Section về 1 cột.
- Summary trước, detail sau.
- Bỏ cột phụ trước cột số.

### Mobile <640

- Panel p-5.
- Table chuyển grouped rows; không horizontal scroll cho core flow.
- CTA/action 44px target.
- Primary answer + caveat không bị đẩy xuống dưới fold bởi decoration.

## 9. Information density guardrails

Không “lấp khoảng trắng” bằng:

```txt
extra cards
repeated numbers
subtitle
decorative chart
icon container
```

Nếu content ít, cho composition **hẹp lại hoặc stack lại**.

## 10. Decision checklist

Trước khi ship một section:

```txt
1. Câu hỏi chính là gì?
2. Primary answer có derive được không?
3. Đây là empty, partial, dependency-missing hay error?
4. Có bao nhiêu child item?
5. List hay table giúp user scan nhanh hơn?
6. Chart có thêm meaning không?
7. Có fact nào đang lặp lại?
8. Có text nào xoá đi mà meaning không đổi?
9. Color có đang biểu thị action hay chỉ trang trí?
10. Mobile có giữ được answer trước detail không?
```

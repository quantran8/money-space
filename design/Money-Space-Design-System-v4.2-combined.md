# Money Space Design System v4.2 — Combined

> Generated from the split v4.2 package.

---

# 01 — Foundations

## 1. Visual register

Money Space là một **sổ cái hiện đại cho household**, không phải BI dashboard, expense tracker hay wellness app.

```txt
Calm nhưng có trọng lượng
Đáng tin qua cấu trúc dữ liệu, không qua trang trí
Ấm ở nền, chặt ở thông tin
Future-oriented
Private, not controlling
```

## 2. Surface

Ba tầng cơ bản:

```css
:root {
  --app: #EEF1F3;
  --panel: #FFFFFF;
  --sunk: #F5F7F8;

  --ink: #15181C;
  --ink2: #525860;
  --ink3: #707780; /* v4.2: tăng contrast cho micro text */

  --interactive: #0A6B47;
  --interactive-soft: #E3EFEA;
  --attention: #9A6818;
  --alert: #B23A26;

  --committed: #D2D6DA;
  --protect: #A9B0B8;

  --radius-panel: 14px;
  --radius-sunk: 10px;
  --radius-control: 8px;
}
```

### Default

- App background dùng `--app`.
- Top-level panel dùng `--panel`.
- `--sunk` dùng cho block nằm chìm trong panel.
- Panel mặc định không border và không shadow.
- Không dùng `--sunk` cho toàn section.

### Exception

Divider/border được phép khi **relation không còn đọc được bằng spacing, alignment hoặc surface**. Divider là fallback của information architecture, không phải decoration.

## 3. Color semantics

v4.2 tách **interaction** khỏi **data direction**.

```txt
--interactive  CTA, active nav, action link, focus ring
--attention    stale data, unconfirmed event, user-defined threshold
--alert        deficit thật, overdue, destructive validation
--ink ramp     money direction, normal state, neutral data
```

### Money direction

Incoming/outgoing **không tự động có hue riêng**.

Default:

```txt
Incoming  → --ink
Outgoing  → --ink
Delta tốt/xấu → chỉ dùng màu khi nó thật sự mang consequence
```

Nếu một view cần encode direction bằng màu, phải có legend/context trực tiếp và không được dùng cùng màu để biểu thị clickability.

## 4. Accent discipline

Interaction accent nên chiếm diện tích rất nhỏ. Không dùng accent để “làm dashboard bớt nhạt”.

Không dùng:

```txt
gradient
nền tối section
shadow panel
nhiều hue theo category
chart trang trí
accent cho normal status
```

## 5. Typography

### Font roles

```txt
Be Vietnam Pro 400 / 500 / 600
→ mọi chuỗi tiếng Việt, title, body, money number, semantic label

IBM Plex Mono 400 / 500
→ chuỗi ASCII: ngày, giờ, đơn vị, %, count, code-like metadata
```

**Hard constraint:** IBM Plex Mono không chạm chuỗi tiếng Việt có dấu.

### Semantic text styles

```css
.ui-label {
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--ink3);
}

.meta-mono {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink3);
}

.num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

`.ui-label` là semantic label của UI. `.meta-mono` chỉ là một treatment cho ASCII metadata. Không dùng một class vừa biểu thị semantic role vừa khóa font.

### Scale

```txt
Hero money          56–64px / 500 / tracking -0.04em
Secondary metric    28–32px / 500 / tracking -0.03em
Table metric        18–22px / 500
Page title          19px / 500
Section title       16px / 500
Body                14px / 400
Secondary           13px / 400
Caption             11–12px / 400
```

Hero 64px chỉ dùng khi nó là **một visual anchor thật sự**. Không dùng cỡ hero chỉ vì một con số nằm đầu section.

### Vietnamese

- Weight tối thiểu 400.
- Line-height body ≥ 1.4.
- Tracking âm chỉ áp cho số/ASCII, không áp cho câu tiếng Việt.
- Uppercase tracking rộng chỉ dùng cho label ngắn.

## 6. Money formatting

```txt
< 1 triệu      450.000đ
1–999 triệu    48,2 tr
≥ 1 tỷ         1,81 tỷ
Delta          +32,0 / −14,2
Range          48,2 → 18,2
```

- Tabular nums bắt buộc cho money values.
- Dấu phẩy là thập phân.
- Tối đa một chữ số thập phân khi nguồn là manual estimate.
- Trong bảng có thể đưa đơn vị lên header; ngoài bảng luôn kèm đơn vị.
- Không hiển thị precision cao hơn precision của input.

## 7. Spacing

```txt
Section → section           16px
Panel padding desktop       32px
Panel padding mobile        20px
Header → body               24–28px
Large internal column gap   40–56px
Dense row                   10–12px vertical
Table/list → summary        16–20px
```

Spacing là default range, không phải fixed geometry. Data density thấp thì **thu hẹp composition**, không kéo item ra để lấp chiều ngang.

## 8. Radius & elevation

```txt
Panel          14px
Sunk block     10px
Controls       8–10px
Chip           full
Modal          14px + shadow vì thật sự nổi
```

Không dùng shadow cho surface trong page.

## 9. Accessibility

### Contrast

- `--ink`, `--ink2`, `--ink3`, `--interactive`, `--attention` phải đạt AA ở kích thước đang dùng.
- v4.2 nâng `--ink3` để micro text 10–12px không chỉ đạt vai trò “decorative metadata”.
- Money value không dùng low-contrast token.

### Focus

```css
:focus-visible {
  outline: 2px solid var(--interactive);
  outline-offset: 2px;
}
```

### Touch

Mobile target tối thiểu 44×44px cho nav, CTA và action link.

### Screen reader

- Table thật dùng `<table><thead>`.
- Timeline/list dùng semantic list.
- Chart có text summary hoặc `aria-label` đủ nghĩa.
- Không dùng màu là tín hiệu duy nhất.

## 10. Motion

- Animate supporting visual, không animate money number đếm lên.
- 120–550ms.
- `prefers-reduced-motion` tắt toàn bộ motion không thiết yếu.


---

# 02 — UI Components

## 1. Panel

Panel là top-level grouping surface.

```html
<section class="rounded-[14px] bg-[var(--panel)] p-5 sm:p-8">
  ...
</section>
```

### Default

Header:

```txt
Title trái + một secondary item phải
```

Secondary item thường là metadata **hoặc** action.

### Exception

Detail page có thể có cả metadata + action khi cả hai cần thiết và không lặp nghĩa. Home preview vẫn ưu tiên một item.

Không thêm subtitle nếu title + content đã đủ context.

## 2. Sunk block

`--sunk` là surface primitive, không phải một component duy nhất.

Variants:

```txt
summary       tổng / derived output
field         input area
notice        dependency / scope caveat
visualization chart / composition
```

Các variant cùng nền nhưng khác padding, alignment và affordance.

### Field variant

Input không cần border ở rest state nhưng phải có affordance:

```txt
background --sunk
focus ring --interactive
placeholder đủ contrast
cursor + label rõ
```

Không dùng sunk block như “card con” cho mọi item.

## 3. Semantic labels

Không còn class `.label` khóa IBM Plex Mono.

```txt
ui-label     Be Vietnam Pro; có thể chứa tiếng Việt
meta-mono    IBM Plex Mono; ASCII only
```

Ví dụ:

```html
<p class="ui-label">Thấp nhất dự kiến</p>
<p class="meta-mono">22/08 — 21/09 · 4</p>
```

## 4. Button

### Primary

- Background `--interactive`.
- Radius 8–10px.
- Không shadow.
- Nhãn ≤ 4 từ khi có thể.

### Secondary/link

Accent text chỉ dùng khi có action thật.

Không tô accent cho static metric để tránh lẫn với interaction.

## 5. Status indicator

Normal status không cần colored pill.

Default:

```txt
● + text
```

Color chỉ khi status cần attention/action. State luôn có text.

## 6. Data row primitives

### Grouped row

Dùng cho 1–6 item nhỏ, đặc biệt time sequence.

```txt
primary info
secondary metadata
amount / consequence aligned right
```

Không border mặc định. Hover/focus bằng `--sunk` khi row interactive.

### Dense table

Dùng khi:

```txt
≥3 rows trên desktop Home
hoặc management/detail view
hoặc khi cross-row comparison là nhiệm vụ chính
```

Không dùng table chỉ vì dữ liệu “có cột”. 1–2 rows thường nên là grouped rows.

Rules:

- Header có label rõ, không quá nhạt.
- Số căn phải, tabular.
- Row không divider mặc định.
- Summary là sunk block riêng.
- Table >10 rows có thể dùng zebra cực nhạt.

## 7. Timeline / sequence

Time-based data ưu tiên timeline/list primitive.

Mỗi event có thể gồm:

```txt
Date
Name
Actor nếu meaningful
Amount
Running balance nếu derive được
Confidence/unconfirmed nếu có
```

Cột/field không có data thì **collapse**, không để một cột rỗng làm layout kéo giãn.

## 8. Running balance

Running balance là derived field, không phải required UI decoration.

States:

```txt
available           hiện số
stale input          hiện số tốt nhất + scope caveat
missing dependency   hiện “—” ở row + notice ở scope gần nhất
error                 giữ số cũ nếu có + local error
```

Không lặp cùng một ending balance ở summary nếu nó đã là row cuối.

## 9. Chart

Chart chỉ render khi answer tốt hơn list.

### Render khi

- Có ít nhất 2 meaningful points.
- Có running balance/low point thật để user đọc.
- Visual giúp thấy consequence nhanh hơn row list.

### Không render khi

- Missing starting balance.
- Chỉ có một event mà list đã nói đủ.
- Chart chỉ để section “trông financial”.

Low point marker dùng attention khi cần, không tự suy ra “gần nguy hiểm” nếu user chưa đặt threshold.

## 10. Composition bar

Money composition là 2 phần:

```txt
Đã có nhiệm vụ    --committed
Linh hoạt          --interactive (do đây là primary concept của product)
```

Bar là visualization exception cho rule “một dữ kiện, một chỗ”: legend có thể lặp giá trị để hình đọc được.

## 11. Source coverage strip

Một segment = một source. Strip là context của derived number, không phải warning card.

Có stale source:

```txt
Tính từ 5 nguồn · 2 cần cập nhật
Chưa gồm VCB và tiền mặt.
```

Tất cả mới:

```txt
Tính từ 5 nguồn · tất cả đều mới
```

Không dùng confidence %.

## 12. Simulation surface

Simulation là vùng duy nhất có thể dùng treatment khác rõ ràng vì nó biểu thị “chưa phải số thật”.

- Background `--interactive-soft`.
- Có đúng một textual marker: `Nếu thực hiện`.
- Có thể dùng dashed border nếu cần để phân biệt modeled vs actual.
- Consequence chỉ xuất hiện sau user action.

## 13. Forms

### Default structure

- 3–4 fields visible mặc định.
- Không hỏi thứ app đã biết.
- Field label dùng sans, không dùng mono uppercase.
- Helper chỉ khi nói scope/constraint/consequence.
- Money input dùng normal control size, không hero size.

### Validation

- Lỗi tại field.
- Giữ input user đã nhập.
- Không đóng modal khi save lỗi.
- Destructive action đặt cuối flow; không cần “danger card” có border.


---

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


---

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


---

# 05 — Migration v4.1 → v4.2

## 1. Không đổi

Giữ:

```txt
App / panel / sunk visual language
Panel radius 14
No shadow on page surfaces
Be Vietnam Pro primary typeface
IBM Plex Mono cho ASCII metadata
Flexible Money là Home hero
Forecast-first product direction
One datum, one place
No false precision
Privacy clarity
```

## 2. Token changes

### `--ink3`

```diff
- #868D96
+ #707780
```

Lý do: tăng contrast cho 10–12px metadata/table header.

### Accent naming

```diff
- --accent
- --accent-soft
+ --interactive
+ --interactive-soft
```

Có thể alias tạm trong code migration:

```css
--accent: var(--interactive);
--accent-soft: var(--interactive-soft);
```

Không dùng interaction accent mặc định cho raw incoming money.

## 3. Typography migration

### Remove semantic coupling

```diff
-.label { font-family: IBM Plex Mono; ... }
+.ui-label { font-family: Be Vietnam Pro; ... }
+.meta-mono { font-family: IBM Plex Mono; ... }
```

Audit toàn app cho `.label` có chuỗi tiếng Việt.

## 4. Layout migration

Thay fixed rule:

```txt
Desktop section luôn 380px + 1fr
```

bằng:

```txt
2 cột khi primary answer available và detail đủ density
1 cột khi metric unavailable hoặc detail chỉ 1–2 items
```

Các section cần audit đầu tiên:

```txt
30 ngày tới
Mục tiêu chính ở account mới
Tiền đang ở đâu khi chỉ có 1 source
Cần cập nhật khi chỉ có 1 stale item
```

## 5. Table migration

Home time-based view:

```txt
1–2 rows → grouped rows
3–6 rows → grouped rows hoặc table tùy comparison need
7+ rows → preview top rows + detail CTA
```

Detail/management page vẫn ưu tiên dense table.

## 6. State migration

Thêm enum/concept:

```ts
type DataState =
  | 'ready'
  | 'stale'
  | 'dependency-missing'
  | 'empty'
  | 'error'
```

Không dùng `empty` cho trường hợp domain data đã tồn tại.

Cash-flow dependency missing example:

```txt
upcomingEvents.length > 0
&& !startingBalance
→ dependency-missing
```

## 7. Chart migration

Không mount forecast chart khi:

```txt
!startingBalance
meaningfulPoints < 2
```

Chart không là placeholder cho empty space.

## 8. Color migration

Audit nơi `text-accent` đang gắn với static money values.

Keep accent:

```txt
CTA
active nav
action link
focus
Flexible Money composition segment
```

Move to neutral:

```txt
raw incoming amount
normal positive number
normal status
```

## 9. Sunk migration

Không đổi background token, nhưng tách semantic variants trong component API:

```ts
<Sunk variant="summary" />
<Sunk variant="field" />
<Sunk variant="notice" />
<Sunk variant="visualization" />
```

Variant quyết định padding/interaction, không thêm surface level mới.

## 10. Header migration

Home:

```txt
title + metadata OR action
```

Detail page có thể:

```txt
title + metadata + action
```

nếu cả hai thật sự cần thiết.

## 11. Suggested implementation order

```txt
1. Token + typography rename
2. Add dependency-missing state
3. Adaptive section layout primitive
4. GroupedRow + density switch
5. Cash-flow 30-day recipe
6. Audit accent semantics
7. Audit micro-copy / duplicate facts
8. Regression mobile + accessibility
```

## 12. Acceptance tests

### Cash-flow: 1 event, no source

Expected:

```txt
Event vẫn hiện
Low point nói “Chưa tính được”
Có “Chưa có số dư đầu kỳ.”
Có CTA Thêm nguồn tiền
Còn lại = —
Không chart
Không 2-column whitespace lớn
```

### Cash-flow: 1 event, balance available

Expected:

```txt
Low point hiện
Grouped row
Chart optional, không bắt buộc
Summary in/out
```

### Cash-flow: 5 events, balance available

Expected:

```txt
Desktop có thể 2 cột
Table sequence có running balance
Low point + supporting chart
```

### Typography

Expected:

```txt
Không chuỗi tiếng Việt nào render bằng IBM Plex Mono
Table header đủ contrast
```

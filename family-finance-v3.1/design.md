# Web Design System — Money Space v3.2

> **Spec alignment:** Shared Financial Clarity → Financial Foresight → Decision Support for couples 25–37.
>
> **v3.2 direction:** consumer-first, scan-first, white-first.
>
> Home phải cho user hiểu tình hình household trong vài giây, không tạo cảm giác đang đọc một SaaS dashboard hoặc finance terminal.
>
> Screenshot/dashboard references chỉ được dùng để tham khảo **layout rhythm, compactness, sidebar separation, section framing**. Không mặc định kế thừa màu lime + xanh đậm, chart-heavy composition, hoặc density kiểu fintech dashboard.

---

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

---

## 1. Product Design Direction

Money Space là **consumer finance product cho household**, không phải dashboard quản trị.

Design direction:

```txt
Consumer-first
White-first
Calm finance
Glanceable
Compact but not dense
Few meaningful sections
Strong scan hierarchy
Future-oriented
Private, not controlling
Mobile-primary key flows
Clean management tools underneath
```

### 1.1. Home phải là scan surface

User mở Home và trong khoảng **3–5 giây** phải quét được những thông tin quan trọng nhất.

Priority hierarchy:

```txt
Priority A
1. Nhà mình đang ổn không?
2. Có bao nhiêu tiền linh hoạt?
3. Balance thấp nhất trong 30 ngày tới là bao nhiêu?

Priority B
4. Mục tiêu chính đang đi tới đâu?
5. Có dữ liệu nào cần cập nhật để forecast đáng tin hơn?

Priority C
6. Tổng tiền vào / ra trong 30 ngày.
7. Tiền đang ở đâu / ai đang phụ trách.
```

Không cho mọi metric cùng một visual weight.

### 1.2. Visual emphasis trên Home

```txt
Flexible Money       → money number lớn nhất.
Financial State      → status rõ ngay phía trên / cạnh primary number.
Lowest balance       → callout mạnh nhất trong section 30 ngày tới.
Incoming / Outgoing  → supporting metrics.
Goal projection      → projected date và gap-to-target quan trọng hơn progress bar.
Money location       → supporting context, không cạnh tranh với forecast.
Freshness            → chỉ nổi khi có action cần làm.
```

### 1.3. Home không phải landing page hoặc BI dashboard

Không thiết kế như:

```txt
SaaS analytics dashboard
Fintech trading dashboard
Banking admin portal
Card grid với 8–12 metric ngang cấp
Chart gallery
Marketing landing page trá hình
Expense tracker
```

Premium đến từ:

```txt
nền trắng sạch
section framing mềm
spacing có nhịp
natural card height
typography rõ
ít màu
ít divider
copy có lý do tồn tại
hierarchy mạnh
privacy rõ
calculation dễ hiểu
```

---

## 2. Consumer Product Principles

## 2.1. White-first, not gray-dashboard-first

Page background mặc định là **white**.

```txt
Page background     #FFFFFF
Section surface     #FFFFFF
Soft grouped area   #FAFAFA / #F7F7F8
Interactive muted   #F2F2F7
```

Không dùng nền xám lớn chỉ để làm card trắng nổi lên.

Section được phân biệt bằng **soft frame + spacing**, không bằng contrast nền mạnh.

## 2.2. Surface hierarchy phải nông

Recommended:

```txt
Page
→ Top-level section frame
→ optional soft group
→ row / content
```

Không nên:

```txt
Page
→ Card
→ Sub-card
→ Mini-card
→ Inner card
→ bordered row
```

Rule:

```txt
Tối đa 2 tầng surface trong một section.
Nếu đã có section frame, bên trong ưu tiên spacing, typography và soft background.
Không thêm border cho mọi child item.
Không dùng divider để bù cho hierarchy yếu.
```

## 2.3. Section frame: dày hơn nhưng nhạt hơn

Top-level section cần có ranh giới đủ rõ để scan, nhưng không được tạo cảm giác viền sắc.

Canonical treatment:

```css
.section-surface {
  background: #fff;
  border: 2px solid rgba(29, 29, 31, 0.045);
  border-radius: 20px;
}
```

Optional depth nếu thật sự cần:

```css
.section-surface {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.012);
}
```

Rules:

```txt
Border width có thể 2px nhưng opacity thấp.
Không dùng border xám 1px sắc quanh mọi card.
Không dùng shadow để giả border thứ hai.
Không dùng shadow-xl / shadow-2xl.
Section frame chỉ áp ở top-level section.
```

## 2.4. Divider là ngoại lệ, không phải default

Không dùng divider giữa mọi heading, metric, row hoặc section.

Ưu tiên:

```txt
spacing
font weight
soft background
alignment
section frame
```

Divider chỉ nên xuất hiện khi có chức năng rõ:

```txt
app chrome
sidebar separation
bottom navigation
form grouping khó hiểu nếu thiếu separator
bảng / management view thực sự cần column/row separation
```

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

Không ưu tiên `total assets` hoặc `account balance` làm con số chính trên Home.

Primary number:

```txt
Có thể linh hoạt
54M đ
```

Helper chỉ tồn tại vì nó giải thích calculation:

```txt
Sau các khoản đã biết trong thời gian tới và quỹ an toàn 40M đã đặt.
```

Supporting breakdown:

```txt
Current liquid
- required near-term outflow
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
“30M hôm nay → goal chậm 3 tháng” trước khi user chủ động thử
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
Sau các khoản đã biết và quỹ an toàn 40M đã đặt.
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

---

## 3. Tech Stack UI

Recommended:

```txt
React
Tailwind CSS v4
shadcn/ui
lucide-react
```

Base components:

```txt
Button
Badge
Input
Label
Select
Dialog
Sheet
Table
Tabs
DropdownMenu
Separator
Tooltip
Progress
Sidebar
```

CSS chỉ nên dùng cho:

```txt
design tokens
base layer
section frame
small reusable utilities
```

Layout/style còn lại ưu tiên Tailwind utility classes.

---

## 4. Visual Language

## 4.1. Brand feeling

```txt
Consumer finance clarity
Private shared space
Calm household planning
Modern but not trendy
Premium through restraint
```

Reference target:

```txt
Sạch như Apple product
Gọn như consumer productivity app
Rõ như finance tool
Nhẹ như personal wellness product
Riêng tư như shared private space
```

## 4.2. UI mood

```txt
Calm
Minimal
Warm-neutral
Trustworthy
Adult
Non-judgmental
Compact
Continuous
```

## 4.3. What to borrow from fintech dashboard references

Allowed inspiration:

```txt
sidebar proportion
navigation compactness
soft section boundary
consistent card radius
layout rhythm
clear alignment
compact metric grouping
```

Do not inherit by default:

```txt
lime as dominant brand color
deep navy as dominant dashboard surface
chart-heavy home
investment-dashboard visual language
high data density
many small KPIs
```

## 4.4. Avoid

```txt
quá nhiều màu
red background lớn
gradient lòe loẹt
emoji trong UI chính
shadow đậm
chart trang trí
card quá lớn nhưng ít nội dung
card bị stretch vì layout
nhiều divider
subtitle filler
card lồng card lồng card
border sắc
BI dashboard density
```

---

## 5. Color System

## 5.1. Core tokens

```txt
Background        #FFFFFF
Surface           #FFFFFF
Surface Soft      #FAFAFA
Surface Muted     #F2F2F7

Ink               #1D1D1F
Secondary Text    #6E6E73
Tertiary Text     #A1A1A6

Accent Blue       #007AFF
Green             #34C759
Orange            #FF9500
Red                #FF3B30
```

Section border dùng alpha thay vì solid gray token:

```txt
Section Border    rgba(29, 29, 31, 0.045)
Sidebar Border    rgba(29, 29, 31, 0.038)
Control Border    rgba(29, 29, 31, 0.10–0.14)
```

## 5.2. Semantic usage

```txt
Green  → Ổn / confirmed positive state
Orange → Cần chú ý / stale / near reserve
Red    → actual shortfall / overdue / critical
Blue   → navigation / secondary action / useful emphasis
Black  → primary CTA
Gray   → metadata / neutral context
```

Không dùng semantic colors để trang trí.

## 5.3. Accent discipline

Home không cần một brand color phủ diện tích lớn.

Accent chỉ nên xuất hiện ở:

```txt
primary decision CTA
active navigation
link / secondary action
progress
low-point callout khi cần
status badge nhỏ
```

---

## 6. Tailwind v4 + CSS Variables

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 3% 12%;

    --card: 0 0% 100%;
    --card-foreground: 240 3% 12%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 3% 12%;

    --primary: 240 3% 12%;
    --primary-foreground: 0 0% 100%;

    --secondary: 240 5% 98%;
    --secondary-foreground: 240 3% 12%;

    --muted: 240 6% 96%;
    --muted-foreground: 240 4% 44%;

    --accent: 211 100% 50%;
    --accent-foreground: 0 0% 100%;

    --destructive: 3 100% 59%;
    --destructive-foreground: 0 0% 100%;

    --input: 240 6% 91%;
    --ring: 211 100% 50%;

    --status-green: 142 71% 45%;
    --status-orange: 35 100% 50%;
    --status-red: 3 100% 59%;
    --status-blue: 211 100% 50%;
  }

  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family:
      -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter,
      system-ui, sans-serif;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }
}

@layer utilities {
  .section-surface {
    background: #fff;
    border: 2px solid rgba(29, 29, 31, 0.045);
    border-radius: 20px;
  }

  .sidebar-separator {
    border-right: 2px solid rgba(29, 29, 31, 0.038);
  }

  .money-number {
    letter-spacing: -0.065em;
    font-weight: 600;
  }

  .page-title {
    letter-spacing: -0.04em;
  }

  .section-title {
    letter-spacing: -0.025em;
  }
}
```

---

## 7. Layout and Spacing Rules

## 7.1. Global vertical rhythm

Top-level sections phải dùng **một spacing scale cố định**.

Canonical:

```txt
Section → Section       20px
Desktop column gap      20px
Header → first section  20px
Section heading → body  12–16px
Content group → group   12–16px
List row vertical gap   8–12px
```

Tailwind:

```txt
space-y-5
gap-5
mt-3 / mt-4
```

Không để mỗi section tự dùng `mb-4`, `mb-6`, `mt-8` khác nhau nếu không có lý do hierarchy.

## 7.2. Section padding

Home section nên compact hơn bản v3.1.

Recommended:

```txt
Mobile       16–18px
Desktop      18–20px
Hero money   tối đa 20px trừ khi content thật sự cần thêm
```

Canonical:

```tsx
<section className="section-surface p-4 sm:p-5">...</section>
```

Tránh mặc định `p-7`, `p-8` cho Home.

## 7.3. Natural height, never decorative height

Card phải cao theo content.

Không dùng:

```txt
min-height chỉ để cân layout
equal-height card nếu content khác nhau
stretch mặc định làm sinh empty space
```

Desktop grid:

```tsx
<div className="grid gap-5 lg:grid-cols-[7fr_5fr] lg:items-start">
  <div className="space-y-5">...</div>
  <div className="space-y-5">...</div>
</div>
```

Điểm quan trọng:

```txt
Hai cột có independent vertical flow.
Không dùng một row grid khiến card bên thấp bị stretch theo card bên cao.
```

## 7.4. Radius

```txt
Top-level section     20px
Soft grouped area     16px
Input / select        14–16px
Button / badge        rounded-full khi phù hợp
```

Không tăng radius để “premium hóa” UI.

## 7.5. Shadow

Default Home section:

```txt
No visible shadow.
```

Chỉ dùng depth cực nhẹ khi border bị mất trên một số display:

```css
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.012);
```

Dialog / floating sheet có thể dùng shadow rõ hơn.

## 7.6. Sidebar

Desktop sidebar:

```txt
Width khoảng 232–248px.
White background.
Right border mềm 2px, opacity thấp.
Navigation row compact.
Active state dùng soft fill, không cần card nổi.
```

Canonical:

```tsx
<aside className="sidebar-separator hidden min-h-screen w-[238px] lg:block">
  ...
</aside>
```

Không dùng shadow dọc cho sidebar.

---

## 8. App Shell

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

MVP navigation:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Nhà mình
```

Secondary:

```txt
Lịch sử cập nhật
Cài đặt
```

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

## 9.2. Desktop composition

Recommended:

```txt
┌ Sidebar ┐  ┌ Main ────────────────────────────────────────────┐
│         │  │ Header                                             │
│         │  │                                                    │
│         │  │ ┌ Financial Picture ───────┐ ┌ 30 ngày tới ────┐ │
│         │  │ │ status                    │ │ low point         │ │
│         │  │ │ 54M flexible              │ │ cash-flow summary │ │
│         │  │ │ breakdown + What-if CTA   │ │ timeline          │ │
│         │  │ └───────────────────────────┘ └───────────────────┘ │
│         │  │                                                    │
│         │  │ ┌ Mục tiêu chính ──────────┐ ┌ Cần cập nhật ────┐ │
│         │  │ └───────────────────────────┘ └───────────────────┘ │
│         │  │                                                    │
│         │  │ ┌ Tiền đang ở đâu ─────────┐                       │
│         │  │ └───────────────────────────┘                       │
│         │  └────────────────────────────────────────────────────┘
```

Không ép các section hai cột phải cao bằng nhau.

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

## 10.1. Scale

```txt
Page title
text-3xl md:text-4xl font-semibold tracking-[-0.04em]

Primary money
text-5xl md:text-[58px] font-semibold tracking-[-0.065em]

Important metric
text-2xl md:text-3xl font-semibold tracking-[-0.04em]

Section title
text-sm to text-base font-semibold

Body
text-sm / text-[15px]

Caption
text-[11px] to text-xs
```

Home không cần mọi section title ở `text-2xl`.

Compact title scale giúp consumer app nhẹ và scan nhanh hơn.

## 10.2. Money formatting

Prefer:

```txt
54M đ
24,5M đ
420M
1,2B
+45M
−34M
```

Tránh hero number quá dài nếu có thể abbreviate mà không mất nghĩa.

Money value không bị truncate trên mobile.

---

## 11. Core Component Patterns

## 11.1. Section Header

Default header chỉ có **title + optional action**.

Không mặc định có hint/subtitle.

```tsx
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold tracking-[-0.02em]">{title}</h2>
      {action ? (
        <Button variant="ghost" className="h-8 rounded-full px-2 text-xs text-accent">
          {action}
        </Button>
      ) : null}
    </div>
  );
}
```

Hint chỉ được thêm nếu vượt qua helper-copy test ở §2.10.

## 11.2. Top-level Section

```tsx
<section className="section-surface p-4 sm:p-5">
  ...
</section>
```

Rules:

```txt
Natural height.
No default shadow.
No internal divider by default.
Không wrap mỗi child item bằng border.
```

## 11.3. Soft Group

Dùng khi cần gom một nhóm có meaning rõ.

```tsx
<div className="rounded-2xl bg-[#fafafa] p-3.5">...</div>
```

Không cần border nếu parent section đã có frame.

## 11.4. Metric Group

3 supporting metrics có thể dùng một soft group chung:

```tsx
<div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
  ...
</div>
```

Không dùng ba card có border riêng.

## 11.5. List row

```tsx
<div className="flex items-center gap-3 py-2.5">
  <div className="min-w-0 flex-1">...</div>
  <div className="shrink-0 text-right">...</div>
</div>
```

Rows phân biệt bằng spacing/alignment trước; separator chỉ dùng khi thật sự cần.

---

## 12. Home Page Components

## 12.1. AppSidebar

Navigation:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Nhà mình
```

Secondary:

```txt
Lịch sử cập nhật
Cài đặt
```

Desktop width:

```txt
232–248px
```

Visual:

```txt
white background
2px very-low-opacity right border
compact nav rows
soft active background
minimal icons
```

## 12.2. FinancialPictureSection

Financial State và Flexible Money nên nằm trong **cùng một primary section** để giảm fragmentation và giúp scan nhanh hơn.

Purpose:

```txt
Trả lời ngay:
- Nhà mình đang ổn không?
- Còn bao nhiêu tiền linh hoạt?
```

Content hierarchy:

```txt
1. Status line
2. Flexible Money label
3. Flexible Money value
4. Calculation helper
5. What-if CTA
6. Supporting breakdown
```

Example:

```txt
● Nhà mình đang ổn                                Cập nhật

Có thể linh hoạt
54M đ                              [ Thử một khoản chi ]
Sau các khoản đã biết trong thời gian tới và quỹ an toàn 40M đã đặt.

Thanh khoản        Cần sớm        Quỹ bảo vệ
128M               −34M           −40M
```

Rules:

```txt
54M là visual anchor lớn nhất Home.
Status rõ nhưng không cạnh tranh kích thước với money number.
What-if là action duy nhất, không tạo scenario preview.
Supporting metrics cùng một soft group.
```

## 12.3. UpcomingPreviewSection — `30 ngày tới`

Không có subsection tên `Những khoản sắp tới`.

Purpose:

```txt
Cho user thấy low point và sequence sắp diễn ra.
```

Hierarchy:

```txt
1. Lowest projected balance
2. Incoming / outgoing totals
3. Optional compact cash-flow visual
4. Top 2–3 timeline events
5. Xem timeline
```

Example:

```txt
30 ngày tới                              Xem timeline
Chỉ gồm các khoản đã biết

Balance thấp nhất dự kiến
94M đ

Tiền vào +45M        Tiền ra −34M

15 Aug   Lương                 +45M  → 173M
18 Aug   Tiền nhà              −15M  → 158M
22 Aug   Thẻ tín dụng          −12M  → 146M
```

`Chỉ gồm các khoản đã biết` được phép vì đây là scope/assumption.

## 12.4. MainGoalSection

Purpose:

```txt
Cho user hiểu goal đang đi tới đâu theo tốc độ hiện tại.
```

Content:

```txt
Goal name
Primary-goal badge nếu cần
Current / target
Progress
Target date
Projected completion date
Required monthly contribution nếu behind target
```

Example:

```txt
Mua nhà     [Mục tiêu chính]                   Chi tiết

420M / 1,2B                                      35%
────────────── progress ───────────────────────────

Ngày mong muốn            Jun 2029
Theo tốc độ hiện tại      Oct 2029
Để về đúng target         +4,5M / tháng
```

Rules:

```txt
Không show hypothetical impact trước khi user bấm What-if.
Không đặt thêm What-if card trong Goal Home preview.
Progress bar là secondary; projected completion quan trọng hơn.
```

## 12.5. MoneyLocationSection

Purpose:

```txt
Cho biết tiền đang ở đâu và ai đang phụ trách.
```

Prefer compact grouped rows:

```txt
An        72M
Bình      46M
Chung     10M
```

Có thể thêm sharing state khi cần, nhưng không expose private detail vượt permission.

## 12.6. DataFreshnessSection

Chỉ nên có visual prominence khi có action.

Example:

```txt
Cần cập nhật                            Cập nhật nhanh
2 khoản nên cập nhật

VCB                    35 ngày trước
Lương tháng này        cần xác nhận
```

Không cần một subtitle chung kiểu “Theo dữ liệu hiện có”.

## 12.7. WhatIfDialog / Sheet

Input tối thiểu:

```txt
Số tiền
Ngày dự kiến
Goal optional
```

Result hierarchy:

```txt
1. Obligations covered?
2. Reserve protected?
3. Flexible Money before → after
4. Goal projected date before → after
5. Assumptions nếu cần
```

Example after user submits:

```txt
30.000.000đ

✓ Các khoản đã biết vẫn được cover
✓ Quỹ an toàn vẫn được giữ

Tiền linh hoạt
54M → 24M

Mua nhà
Oct 2029 → Jan 2030
Khoảng 3 tháng chậm hơn

[ Xem cách tính ]
[ Thử số khác ]
```

Không có verdict:

```txt
Bạn nên mua.
Bạn không nên mua.
Quyết định này tốt/xấu.
```

---

## 13. Full Home Layout Example

```tsx
export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-foreground lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
      <AppSidebar className="sidebar-separator" />

      <main className="min-w-0 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
        <PageHeader />

        <div className="mt-5 flex flex-col gap-5 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-5">
          <div className="contents lg:block lg:space-y-5">
            <FinancialPictureSection />
            <MainGoalSection />
            <MoneyLocationSection />
          </div>

          <div className="contents lg:block lg:space-y-5">
            <UpcomingPreviewSection />
            <DataFreshnessSection />
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <WhatIfSheet />
    </div>
  );
}
```

Rules:

```txt
Top-level gap luôn 20px.
Grid dùng items-start.
Mỗi desktop column có space-y-5 độc lập.
Không tạo equal-height rows.
Không thêm placeholder card để lấp khoảng trống.
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

Không hỏi toàn bộ tài sản ngay.

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

---

## 15. Responsive Rules

## 15.1. Desktop

```txt
Sidebar visible.
Main content wide but not stretched vertically.
Financial Picture + 30 days can sit side-by-side.
Natural section height.
What-if opens Dialog/Sheet.
```

## 15.2. Tablet

```txt
Sidebar collapsed / hidden.
2-column chỉ khi đủ width.
Timeline vẫn là một logical sequence.
No horizontal overflow.
```

## 15.3. Mobile Web / PWA

```txt
Single column.
Bottom nav max 5 items.
Flexible Money visible early.
What-if CTA may be sticky.
No table.
Timeline rows scan được bằng một tay.
Money values không truncate.
Top-level section gap giữ consistent.
```

Mobile ưu tiên decision moment, không phải management density.

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
```

Secondary:

```txt
Xem timeline
Chi tiết
Xem cách tính
Xem nguồn tiền
```

What-if result:

```txt
Thử số khác
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

Use `lucide-react`.

Recommended:

```txt
Home
Wallet
CalendarDays
ArrowDown
ArrowUp
Landmark
PiggyBank
Shield
Target
Calculator
RefreshCw
Settings
Users
ChevronRight
MoreHorizontal
Plus
```

Rules:

```txt
Line icons.
Stroke width 1.75–2.
No emoji in production UI.
Không icon cho mọi row nếu text đã rõ.
Privacy không icon-only.
Icon background chỉ dùng khi giúp phân loại nhanh.
```

---

## 19. MVP UI Rules

Do:

```txt
Home scan được trong 3–5 giây.
Financial State + Flexible Money là primary financial picture.
Flexible Money là money metric lớn nhất.
Lowest Projected Balance được highlight trong 30-day section.
30-day summary và timeline nằm cùng một section.
Goal có projected completion date.
What-if là action, không phải Home card.
Consequence chỉ hiện sau user action.
Có data freshness.
Có money location / holder.
Privacy dùng text rõ.
Top-level section có soft 2px frame.
Page background trắng.
Top-level vertical spacing nhất quán 20px.
Cards natural-height.
Helper copy chỉ tồn tại khi có meaning/action.
```

Do not:

```txt
Không đưa transaction nhỏ lên Home.
Không dùng Total Assets làm hero metric.
Không tách “Những khoản sắp tới” khỏi “30 ngày tới”.
Không render What-if scenario preview trước click.
Không dùng chart làm trọng tâm Home.
Không build Discussion module trong MVP.
Không dùng nested card >2 tầng.
Không dùng divider giữa mọi row.
Không stretch card chỉ để hai cột bằng nhau.
Không để card lớn nhưng trống.
Không dùng filler subtitle.
Không dùng lime/navy dashboard aesthetic chỉ vì reference có nó.
Không verdict nên mua / không nên mua.
```

---

## 20. Example Home Content

```txt
● Nhà mình đang ổn                                  Cập nhật

Có thể linh hoạt
54M đ                                [ Thử một khoản chi ]
Sau các khoản đã biết trong thời gian tới và quỹ an toàn 40M đã đặt.

Thanh khoản       Cần sớm       Quỹ bảo vệ
128M              −34M          −40M
```

```txt
30 ngày tới                                         Xem timeline
Chỉ gồm các khoản đã biết

Balance thấp nhất dự kiến
94M đ

Tiền vào +45M                    Tiền ra −34M

15 Aug  Lương                    +45M → 173M
18 Aug  Tiền nhà                 −15M → 158M
22 Aug  Thẻ tín dụng             −12M → 146M
```

```txt
Mua nhà   [Mục tiêu chính]                           Chi tiết

420M / 1,2B                                           35%

Ngày mong muốn             Jun 2029
Theo tốc độ hiện tại       Oct 2029
Để về đúng target          +4,5M / tháng
```

```txt
Tiền đang ở đâu                                      Xem nguồn tiền

An        72M
Bình      46M
Chung     10M
```

```txt
Cần cập nhật                                        Cập nhật nhanh
2 khoản nên cập nhật

VCB                     35 ngày trước
Lương tháng này         cần xác nhận
```

Không có Home block:

```txt
WHAT-IF
30M hôm nay → Goal chậm 3 tháng
```

Consequence đó chỉ xuất hiện sau khi user bấm `Thử một khoản chi`.

---

## 21. Implementation Class Cheatsheet

Page:

```tsx
<div className="min-h-screen bg-white text-foreground">
  ...
</div>
```

Desktop shell:

```tsx
<div className="min-h-screen lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
  <aside className="sidebar-separator">...</aside>
  <main className="min-w-0 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">...</main>
</div>
```

Home columns:

```tsx
<div className="flex flex-col gap-5 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-5">
  <div className="contents lg:block lg:space-y-5">...</div>
  <div className="contents lg:block lg:space-y-5">...</div>
</div>
```

Top-level section:

```tsx
<section className="section-surface rounded-[20px] bg-white p-4 sm:p-5">
  ...
</section>
```

Soft group:

```tsx
<div className="rounded-2xl bg-[#fafafa] p-3.5">...</div>
```

Supporting metrics:

```tsx
<div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
  ...
</div>
```

Money number:

```tsx
<p className="money-number text-5xl leading-none sm:text-[58px]">54M đ</p>
```

Primary decision CTA:

```tsx
<Button className="h-11 rounded-full px-5">Thử một khoản chi</Button>
```

Valid helper copy:

```tsx
<p className="text-sm text-muted-foreground">
  Sau các khoản đã biết trong thời gian tới và quỹ an toàn 40M đã đặt.
</p>
```

Avoid helper copy:

```tsx
// Không thêm nếu không truyền tải meaning/action.
<p>Theo dữ liệu hiện có</p>
<p>Không cần tự cộng trong đầu</p>
```

Sidebar separator:

```css
.sidebar-separator {
  border-right: 2px solid rgba(29, 29, 31, 0.038);
}
```

Section frame:

```css
.section-surface {
  border: 2px solid rgba(29, 29, 31, 0.045);
  border-radius: 20px;
  background: #fff;
}
```

---

## 22. Final Product Feel

Money Space phải có cảm giác:

```txt
Một private financial home sạch, trưởng thành và bình tĩnh
cho hai người đang xây cuộc sống chung.

Không cần làm kế toán.
Không cần gộp toàn bộ tiền.
Không cần theo dõi từng khoản nhỏ.

Mở Home là thấy ngay:
- tình hình household
- tiền linh hoạt
- low point sắp tới
- goal đang đi tới đâu

Khi có một quyết định đáng cân nhắc:
- bấm Thử một khoản chi
- xem consequence
- tự quyết định cùng nhau
```

Visual feel:

```txt
Consumer app first
Finance clarity second
Dashboard mechanics only where useful
White-first
Soft framed sections
Compact natural-height layout
Minimal divider
Meaningful copy only
```

Không phải:

```txt
expense tracker
household accounting
partner surveillance
investment terminal
enterprise BI dashboard
fintech chart dashboard
AI financial advisor
```

Final hierarchy:

```txt
Shared Financial Clarity
→ Financial Foresight
→ Decision Support
```

Design không phải làm dashboard “nhiều dữ liệu hơn”.

Design phải làm những điều quan trọng nhất:

```txt
dễ quét
dễ hiểu
dễ tin
dễ hành động
không phán xét
không kiểm soát
```

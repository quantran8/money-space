# Web Design System — Money Space v3.1

> **Spec alignment:** Shared Financial Clarity + Financial Foresight + Decision Support for couples 25–37.
>
> Visual foundation remains **Apple-like, white-first, calm, consumer-grade**.
> Main v3.1 correction: Home is no longer centered on `snapshot + bills + discussion`.
> It is centered on **Flexible Money + future cash-flow + goal projection + What-if**.
>
> Keep nested surfaces shallow, use grouped lists, and make privacy/calculation assumptions explicit.

---

**## 1. Product Design Direction**

Money Space là web app tài chính chung cho các couple **25–37 tuổi**, sắp cưới hoặc đã cưới, có financial goals và muốn cùng nhìn rõ tình hình tài chính mà không biến việc quản lý tiền thành bookkeeping hoặc surveillance.

Core questions của sản phẩm:

> “Nhà mình đang ổn không?”

> “Sau những gì sắp tới, còn bao nhiêu tiền thực sự linh hoạt?”

> “Nếu chi khoản này thì mục tiêu chung thay đổi thế nào?”

Design direction:

```txt
Apple-like
White-first premium
Calm finance
Consumer-grade
Glanceable modern couple finance
Fewer, richer sections
Future-oriented
Private, not controlling
Web/PWA implementation
Mobile-primary key flows
Clean admin only where management is needed
```

Không thiết kế như:

```txt
app kế toán
app ghi thu chi truyền thống
dashboard BI phức tạp
app ngân hàng doanh nghiệp
app kiểm soát người còn lại
landing page trá hình
ecommerce dashboard quá marketing
gamified Gen Z finance app
```

Premium của sản phẩm đến từ:

```txt
nền sạch
typography rõ
spacing rộng
ít surface layer
section lớn có cấu trúc rõ
list dễ scan
ít màu
ít icon trang trí
hierarchy mạnh
copy bình tĩnh
calculation dễ hiểu
privacy rõ
```

Design target:

```txt
User mở Home và hiểu trong 5–10 giây:
- Nhà mình đang ổn không?
- Hiện có bao nhiêu tiền linh hoạt?
- 30 ngày tới có gì vào / ra?
- Balance thấp nhất dự kiến là bao nhiêu?
- Mục tiêu chính đang đi tới đâu?
- Dữ liệu nào nên cập nhật?
```

Sau đó user có một next action rõ:

```txt
[ Thử một khoản chi ]
```

Product fit:

```txt
Home       = clarity + foresight + next decision
Upcoming   = cash-flow timeline
Goals      = progress + projected completion
Assets     = money location + holder + privacy
Household  = members + sharing + reserve + settings
What-if    = contextual action, không cần tab riêng
```

Product hierarchy:

```txt
Clarity
→ Foresight
→ Decision
```

Design phải reinforce đúng hierarchy này.

---

**## 2. Apple-like Product Principles**

**## 2.1. Surface hierarchy**

Apple-like không có nghĩa là càng nhiều card càng tốt. UI nên có ít lớp surface.

Recommended hierarchy:

```txt
Page background     #F5F5F7
Main section card   #FFFFFF
Grouped area        #F2F2F7 hoặc border nhẹ
List row / cell     #FFFFFF hoặc transparent
```

Không nên:

```txt
Page → Card → Sub-card → Mini-card → Inner button/card
```

Nên:

```txt
Page → Section card → Grouped list / soft group → Row
```

Rule thực tế:

```txt
Một section chỉ nên có tối đa 2 tầng surface.
Nếu đã có section card trắng, bên trong ưu tiên list row, divider, hoặc soft grouped area.
Chỉ dùng mini-card khi metric thật sự cần đứng riêng.
```

**## 2.2. Dashboard is preview, not detail page**

Home không phải nơi chứa toàn bộ dữ liệu.

```txt
Home = status + important number + future preview + next action
Detail page = breakdown + history + edit
```

Mỗi section trên Home chỉ nên trả lời một câu hỏi:

```txt
Hero / Financial State → Nhà mình đang ổn không?
Flexible Money         → Thực sự còn bao nhiêu linh hoạt?
30 ngày tới            → Sắp có gì vào / ra?
Tiền đang ở đâu        → Money location và holder ra sao?
Mục tiêu chính         → Theo tốc độ hiện tại khi nào đạt?
Cần cập nhật           → Data có đủ mới để tin forecast không?
```

**## 2.3. Flexible Money is the primary money number**

Home không ưu tiên `total assets` hay `account balance` làm con số chính.

Primary number:

```txt
Có thể linh hoạt
54.000.000đ
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
Không gọi Flexible Money là “số tiền bạn nên tiêu”.
Luôn dùng helper copy: “Sau các khoản sắp tới và quỹ an toàn đã đặt.”
```

**## 2.4. Future is a timeline, not a bill list**

Upcoming phải thể hiện cả:

```txt
Incoming
Outgoing
Running projected balance
Lowest projected balance
```

Không chỉ show:

```txt
Danh sách hóa đơn sắp trả
```

User không nên phải tự cộng tiền trong đầu.

**## 2.5. What-if is contextual, not a management module**

What-if là primary decision action nhưng không cần trở thành một tab CRUD.

Entry points:

```txt
Home
Goal detail
Upcoming
```

Interaction:

```txt
Amount
Date
Optional goal
→ result
```

Result hierarchy:

```txt
1. Obligations covered?
2. Reserve protected?
3. Flexible money before → after
4. Goal date before → after
5. Assumptions
```

Không thiết kế What-if như:

```txt
AI recommendation
risk score
buy / don't buy verdict
complex financial model
```

**## 2.6. List-first when there are many child items**

Khi trong một section có nhiều sub-item, không render thành nhiều card bằng nhau.

Ưu tiên:

```txt
1. Grouped list rows
2. Top 2–3 preview items + “Xem tất cả”
3. 2-column group only khi có đúng 2 nhóm lớn
4. Detail page nếu dữ liệu nhiều hơn 6 item
```

Rule:

```txt
0–2 nhóm lớn       → grid 2 cột hoặc stack mobile
3–6 item nhỏ       → grouped list
>6 item            → show 3 item đầu + “+N mục khác” + CTA
Nhiều loại dữ liệu → group bằng heading nhỏ
```

**## 2.7. Consumer overview, clean tools underneath**

Cách phân tầng sản phẩm:

```txt
Home              → spacious clarity + foresight
Assets            → clean management list/table
Upcoming          → time-ordered timeline/list
Goals             → goal projection + progress
Household         → members, sharing, reserve, settings
Snapshot History  → compact historical review
Quick Update      → focused confirmation/update flow
What-if           → dialog/sheet or dedicated result route
```

Không có Discussion page trong MVP.

**## 2.8. Density by page type**

```txt
Overview density
- Home
- Goal overview
- What-if result
- Empty state

Management density
- Assets
- Upcoming
- Household
- Snapshot history

Form density
- Add/edit asset
- Add cashflow event
- Add/edit goal
- Quick update
- Privacy editor
```

Practical rules:

```txt
Home:       nhiều whitespace, số chính lớn, preview ngắn.
Detail:     compact hơn, action rõ.
Form:       grouped fields, helper text ngắn.
Settings:   row-based, quyền riêng tư giải thích bằng text.
What-if:    focused, không để nhiều chrome gây nhiễu.
```

**## 2.9. Privacy clarity beats prettiness**

Vì app xử lý dữ liệu tài chính của hai người, UI đẹp nhưng mơ hồ là sai.

Mỗi money source cần rõ:

```txt
Ai đang giữ/phụ trách?
Khoản này có tính vào household picture không?
Partner thấy chi tiết hay chỉ thấy tổng?
Lần cập nhật gần nhất?
```

MVP UI nên expose 3 lựa chọn dễ hiểu:

```txt
Hiện chi tiết
Chỉ tính vào tổng
Riêng tư
```

Backend có thể support tier chi tiết hơn, nhưng UI không cần expose complexity nếu chưa có use case.

Không dùng icon-only cho privacy.

---

**## 3. Tech Stack UI**

Recommended stack:

```txt
React
Tailwind CSS v4
shadcn/ui
lucide-react
```

Component base nên dùng từ shadcn/ui:

```txt
Button
Card
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

CSS chỉ dùng để khai báo design tokens, base layer và một số utility nhỏ. Toàn bộ layout/style nên dùng Tailwind utility classes.

---

---

**## 4. Visual Language**

**## 4.1. Brand Feeling**

```txt
Sạch như Apple product
Rõ như finance dashboard
Nhẹ như personal wellness app
Riêng tư như private space
```

**## 4.2. UI Mood**

```txt
Calm
Minimal
Premium
Human
Trustworthy
Non-judgmental
```

**## 4.3. Avoid**

```txt
đỏ quá nhiều
gold quá nhiều
gradient lòe loẹt
emoji trong UI chính
shadow quá đậm
chart quá phức tạp
copy gây áp lực
quá nhiều card nhỏ
card lồng card lồng card
border đậm để tạo hierarchy
```

---

---

**## 5. Color System**

Design dùng nền trắng/xám iOS-like, không dùng dark mode làm default.

**## 5.1. Core Tokens**

```txt
Background        #F5F5F7
Surface           #FFFFFF
Surface Soft      #F2F2F7

Ink               #1D1D1F
Secondary Text    #6E6E73
Tertiary Text     #A1A1A6

Border            #E5E5EA
Muted             #F2F2F7
```

**## 5.2. Status Tokens**

```txt
Blue              #007AFF
Green             #34C759
Orange            #FF9500
Red               #FF3B30
```

**## 5.3. Semantic Usage**

```txt
Green  → Ổn
Orange → Cần chú ý
Red    → Căng / quá hạn / thiếu tiền
Blue   → link, secondary navigation
Black  → primary CTA
Gray   → metadata, helper text, inactive state
```

Red chỉ dùng khi thật sự nghiêm trọng. Không dùng red làm background lớn trên dashboard.

---

---

**## 6. Tailwind v4 + shadcn CSS Variables**

Project dùng Tailwind v4. Không phụ thuộc vào `tailwind.config.ts`. Khai báo theme trong `src/index.css` hoặc `app/globals.css`.

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 240 11% 96%;
    --foreground: 240 3% 12%;

    --card: 0 0% 100%;
    --card-foreground: 240 3% 12%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 3% 12%;

    --primary: 240 3% 12%;
    --primary-foreground: 0 0% 100%;

    --secondary: 240 6% 96%;
    --secondary-foreground: 240 3% 12%;

    --muted: 240 6% 96%;
    --muted-foreground: 240 4% 44%;

    --accent: 211 100% 50%;
    --accent-foreground: 0 0% 100%;

    --destructive: 3 100% 59%;
    --destructive-foreground: 0 0% 100%;

    --border: 240 6% 91%;
    --input: 240 6% 91%;
    --ring: 211 100% 50%;

    --radius: 1.25rem;

    --status-green: 142 71% 45%;
    --status-orange: 35 100% 50%;
    --status-red: 3 100% 59%;
    --status-blue: 211 100% 50%;
  }

  * {
    @apply border-border;
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

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-sm: calc(var(--radius) - 8px);
  --radius-md: calc(var(--radius) - 6px);
  --radius-lg: calc(var(--radius) - 2px);
  --radius-xl: var(--radius);
}

@layer utilities {
  .apple-shadow {
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.06);
  }

  .apple-shadow-soft {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .money-number {
    letter-spacing: -0.07em;
    font-weight: 600;
  }

  .page-title {
    letter-spacing: -0.045em;
  }

  .section-title {
    letter-spacing: -0.035em;
  }
}
```

---

---

**## 7. Tailwind Usage Rules**

**## 7.1. Radius**

Chỉ dùng named utilities hoặc component mặc định. Hạn chế arbitrary value tràn lan.

```txt
rounded-full   → pill: Button, Badge, avatar, toggle, progress
rounded-3xl    → 24px: grouped area, list item, nested content block
rounded-2xl    → 20px: metric cell, input, select, menu item
```

Card mặc định nên được định nghĩa trong `src/components/ui/card.tsx`:

```tsx
<div
  ref={ref}
  className={cn(
    "rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_8px_24px_rgba(0,0,0,0.04)]",
    className,
  )}
  {...props}
/>
```

Hero có thể dùng `rounded-[32px]` vì đây là deliberate exception.

**## 7.2. Shadow**

```txt
Card thường       → default shadcn Card shadow nhẹ
Hero / important  → apple-shadow
Floating panel    → glass-panel + apple-shadow
```

Không dùng:

```txt
shadow-xl
shadow-2xl
shadow-black/20
border-black/20 để tạo nổi bật
```

**## 7.3. Status colors**

Opacity modifier trên var bọc `hsl()` không chạy ổn trong nhiều setup. Dùng arbitrary tường minh:

```tsx
<Badge className="rounded-full bg-[hsla(var(--status-orange),0.1)] text-[hsl(var(--status-orange))] hover:bg-[hsla(var(--status-orange),0.1)]">
  Cần chú ý
</Badge>
```

Không dùng:

```txt
bg-status-green/10
text-status-green
bg-status-orange/10
text-status-orange
```

**## 7.4. Canonical class map**

| Không dùng | Dùng thay thế |
|---|---|
| `rounded-card` | dùng `<Card>` mặc định |
| `rounded-pill` | `rounded-full` |
| `shadow-soft` | bỏ hoặc `apple-shadow-soft` |
| `shadow-apple` | `apple-shadow` |
| `bg-status-green/10` | `bg-[hsla(var(--status-green),0.1)]` |
| `text-status-green` | `text-[hsl(var(--status-green))]` |
| `bg-status-orange/10` | `bg-[hsla(var(--status-orange),0.1)]` |
| `text-status-orange` | `text-[hsl(var(--status-orange))]` |

---

---

**## 8. Layout System for Web**

**## 8.1. App Shell**

```txt
Desktop:
Sidebar trái
Main content giữa
Right panel optional cho What-if / quick update nếu thật sự hữu ích

Tablet:
Sidebar collapsed
Main content full

Mobile:
Top header
Single column
Bottom nav
Primary contextual CTA có thể sticky bottom
```

Navigation MVP:

```txt
Tổng quan
Sắp tới
Mục tiêu
Tài sản
Nhà mình
```

Secondary destinations:

```txt
Lịch sử cập nhật
Cài đặt / Privacy
```

Không có `Discussion` tab.

What-if không bắt buộc là tab. Nó là global/contextual action.

**## 8.2. Desktop Home structure**

```txt
┌──────────────────────────────────────────────────────────────┐
│ Financial State                                      Update   │
│ Nhà mình đang on track                                        │
├──────────────────────────────────────────────────────────────┤
│ CÓ THỂ LINH HOẠT                                              │
│ 54.000.000đ                          [ Thử một khoản chi ]      │
│ Current liquid · Needed soon · Reserve                         │
├──────────────────────────────────────────────────────────────┤
│ 30 NGÀY TỚI                                                   │
│ Incoming · Outgoing · Lowest projected balance                │
│ Top 3 timeline events                              Xem timeline│
├──────────────────────────────────────────────────────────────┤
│ TIỀN ĐANG Ở ĐÂU                                               │
│ Theo loại / theo người giữ                                     │
├──────────────────────────────────────────────────────────────┤
│ MỤC TIÊU CHÍNH                                                │
│ Progress · Target · At current pace · Required contribution   │
├──────────────────────────────────────────────────────────────┤
│ CẦN CẬP NHẬT                                                   │
│ 2 nguồn tiền cần confirm                                      │
└──────────────────────────────────────────────────────────────┘
```

Rule:

```txt
Financial State = context
Flexible Money = primary number
What-if = primary decision CTA
Upcoming = primary foresight section
Assets / money location = clarity supporting section
Goal = future supporting section
Freshness = trust layer
```

**## 8.3. Container**

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
    {/* page */}
  </div>
</div>
```

**## 8.4. Home order**

Desktop:

```txt
1. Financial State
2. Flexible Money + What-if CTA
3. 30 Days Ahead
4. Money Location
5. Main Goal
6. Data Freshness
```

Mobile:

```txt
1. Financial State
2. Flexible Money
3. Sticky / prominent “Thử một khoản chi”
4. 30 Days Ahead
5. Main Goal
6. Money Location
7. Data Freshness
```

Mobile ưu tiên decision + future trước asset breakdown.

---

**## 9. Typography System**

**## 9.1. Web Type Scale**

```txt
Page Title
text-4xl md:text-5xl font-semibold tracking-[-0.045em]

Section Title
text-xl md:text-2xl font-semibold tracking-[-0.035em]

Card Title
text-lg font-semibold tracking-[-0.02em]

Body
text-sm or text-[15px]

Caption
text-xs or text-[13px] font-medium

Large Money Number
text-5xl md:text-6xl font-semibold tracking-[-0.07em]

Medium Money Number
text-2xl md:text-3xl font-semibold tracking-[-0.04em]
```

**## 9.2. Money formatting**

Ưu tiên rõ nghĩa hơn là quá ngắn.

```txt
Good: 24,5M đ
Good: 24,5 triệu
Good: 374M đ
Avoid: 24,5M nếu không rõ đơn vị
Avoid: 24.500.000đ ở Hero nếu làm khó scan
```

---

---

**## 10. Core Component Patterns**

**## 10.1. Section Header**

```tsx
import { Button } from "@/components/ui/button";

function SectionHeader({
  title,
  hint,
  action = "Xem",
}: {
  title: string;
  hint?: string;
  action?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.035em] md:text-2xl">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      </div>

      <Button variant="ghost" className="h-9 rounded-full px-3 text-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]">
        {action}
      </Button>
    </div>
  );
}
```

Rules:

```txt
Title ngắn.
Hint bình tĩnh, không phán xét.
Action là “Xem”, “Xem tất cả”, hoặc “Cập nhật”.
```

**## 10.2. Card**

Use shadcn `Card`.

```tsx
<Card className="p-5 md:p-6">...</Card>
```

Important card:

```tsx
<Card className="apple-shadow p-6 md:p-7">...</Card>
```

Rules:

```txt
Không dùng border đậm.
Không dùng shadow nặng.
Không dùng gradient nhiều.
Card content scan được trong 3 giây.
Không chia quá nhiều card nhỏ nếu mỗi card chỉ có 1 số.
Không gom nhiều thông tin vào một card lớn phẳng.
Nếu có nhiều child item, dùng list row thay vì thêm sub-card.
```

**## 10.3. Metric Cell**

Dùng khi có 2–4 số liệu quan trọng và mỗi số cần đứng riêng.

```tsx
function MetricCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
```

Rules:

```txt
MetricCell chỉ chứa label + value + optional tiny hint.
Không đưa mô tả dài vào MetricCell.
Không dùng MetricCell cho item list như cash-flow event, history, asset row.
```

**## 10.4. Soft Group**

Dùng cho 1–2 nhóm lớn trong section.

```tsx
function SoftGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-muted/50 p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
```

Rules:

```txt
SoftGroup dùng để gom ý nghĩa, không phải để tạo thêm dashboard card.
Một section nên có tối đa 2 SoftGroup trên desktop.
Nếu nhiều hơn 2, đổi sang grouped list.
```

**## 10.5. Grouped List**

Đây là pattern chính khi section có nhiều sub-card/item.

```tsx
import { ChevronRight } from "lucide-react";

function ListRow({
  eyebrow,
  title,
  meta,
  value,
}: {
  eyebrow?: string;
  title: string;
  meta?: string;
  value?: string;
}) {
  return (
    <button className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left transition hover:bg-white/80">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-muted-foreground">{eyebrow}</p>
        ) : null}
        <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">{title}</p>
        {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
      </div>

      {value ? <p className="text-sm font-semibold">{value}</p> : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
    </button>
  );
}
```

Grouped container:

```tsx
<div className="rounded-3xl border border-border bg-muted/50 p-2">
  <ListRow title="Học phí tháng 7" meta="10/07 · 12M đ" />
  <ListRow title="Tiền nhà" meta="15/07" />
  <ListRow title="Bảo hiểm xe" meta="22/07" />
</div>
```

Rules:

```txt
List row là default cho cash-flow event, recent update, asset preview.
Không biến mỗi row thành một card có shadow.
Không dùng border đậm giữa row; dùng spacing hoặc Separator rất nhẹ.
```

---

---

**## 11. Handling Dense Financial Information**

Đây là rule quan trọng cho Money Space: giảm cognitive load mà không giấu consequence quan trọng.

**## 11.1. Decision tree**

```txt
Có đúng 2 nhóm lớn?
→ Dùng 2 SoftGroup.

Có 3–6 item cùng loại?
→ Dùng Grouped List.

Có >6 item?
→ Show 3 item quan trọng nhất + “+N mục khác”.

Có dữ liệu theo thời gian?
→ Timeline/list theo date, không card grid.

Có một con số quyết định?
→ Cho metric đó đứng riêng, supporting breakdown nhỏ hơn.

Có dữ liệu cần bảng?
→ Đưa sang detail page.
```

**## 11.2. Good pattern: Upcoming preview**

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader
    title="30 ngày tới"
    hint="Theo những khoản đã biết"
    action="Xem timeline"
  />

  <div className="mb-4 grid gap-3 sm:grid-cols-3">
    <MetricCell label="Tiền vào" value="+45M đ" />
    <MetricCell label="Tiền ra" value="-34M đ" />
    <MetricCell label="Thấp nhất" value="82M đ" />
  </div>

  <div className="rounded-3xl border border-border bg-muted/50 p-2">
    <ListRow title="Lương" meta="15 Aug" value="+45M đ" />
    <ListRow title="Tiền nhà" meta="18 Aug" value="-15M đ" />
    <ListRow title="Thẻ tín dụng" meta="22 Aug" value="-12M đ" />
  </div>
</Card>
```

**## 11.3. Bad patterns**

Avoid:

```txt
- Mỗi bill là một shadow card.
- Incoming và outgoing tách sang hai màn hình khiến user không thấy sequence.
- Chỉ show end-of-month total nhưng giấu low point giữa tháng.
- Dùng chart lớn nhưng không show running balance / lowest balance.
- Dùng 5–8 metric cùng cấp trên Home.
```

Why bad:

```txt
User phải tự tính.
Hierarchy bị đều.
Không tạo foresight.
Dashboard giống SaaS admin.
Khó scan trên mobile.
```

---

**## 12. Home Page Components**

**## 12.1. AppSidebar / Navigation**

Items:

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

Desktop sidebar có thể rộng khoảng 240–260px.

Mobile dùng bottom nav tối đa 5 item.

**## 12.2. FinancialStateHeader**

Purpose:

```txt
Trả lời “Nhà mình đang ổn không?” trong vài giây.
```

Content:

```txt
Status: On track / Cần chú ý / Căng / Chưa đủ dữ liệu
Short explanation
Last calculated / freshness
Secondary CTA: Cập nhật
```

Example:

```tsx
<Card className="apple-shadow p-6 md:p-7">
  <div className="flex items-start justify-between gap-4">
    <div>
      <Badge className="rounded-full">On track</Badge>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
        Nhà mình đang ổn
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Các khoản đã biết trong 30 ngày tới đều được cover.
      </p>
    </div>

    <Button variant="ghost" className="rounded-full">
      Cập nhật
    </Button>
  </div>
</Card>
```

Hero không cần 3 metric “Dùng ngay / Sắp trả / Cần bàn” như bản cũ.

**## 12.3. FlexibleMoneySection**

Đây là **primary money section** của Home.

Purpose:

```txt
Cho user biết phần tiền household có thể cân nhắc sử dụng
sau các nghĩa vụ gần và reserve đã đặt.
```

Example:

```tsx
<Card className="p-6 md:p-7">
  <p className="text-sm font-medium text-muted-foreground">Có thể linh hoạt</p>

  <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="money-number text-5xl leading-none md:text-6xl">
        54M đ
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Sau các khoản sắp tới và quỹ an toàn đã đặt.
      </p>
    </div>

    <Button className="h-12 rounded-full px-6">
      Thử một khoản chi
    </Button>
  </div>

  <div className="mt-6 grid gap-3 sm:grid-cols-3">
    <MetricCell label="Tiền thanh khoản" value="128M đ" />
    <MetricCell label="Cần sớm" value="-34M đ" />
    <MetricCell label="Quỹ an toàn" value="-40M đ" />
  </div>
</Card>
```

Rules:

```txt
Flexible Money lớn hơn Total Assets về visual priority.
Không gọi là “Ngân sách được phép tiêu”.
CTA What-if đặt ngay cạnh hoặc ngay sau metric.
```

**## 12.4. UpcomingPreviewSection**

Name:

```txt
30 ngày tới
```

Purpose:

```txt
Cho user nhìn sequence của incoming/outgoing và cash-flow low point.
```

Must show:

```txt
Incoming total
Outgoing total
Lowest projected balance
Top 2–3 events
```

Example row:

```txt
15 Aug · Lương          +45M → 173M
18 Aug · Tiền nhà       -15M → 158M
22 Aug · Thẻ tín dụng   -12M → 146M
```

Không chỉ hiển thị “3 khoản sắp trả”.

**## 12.5. MoneyLocationSection**

Purpose:

```txt
Trả lời tiền đang ở đâu và ai đang phụ trách.
```

Default overview:

```txt
Theo người giữ
An       72M
Bình     46M
Chung    10M
```

Hoặc theo loại:

```txt
Ngân hàng
Tiết kiệm
Tiền mặt
Đầu tư
```

Không show private details nếu permission không cho phép.

**## 12.6. MainGoalSection**

Purpose:

```txt
Biến goal từ progress bar thành future projection.
```

Content:

```txt
Goal name
Current / Target
Progress
Target date
Projected completion
Required contribution nếu có target date
What-if entry
```

Example:

```txt
Mua nhà

420M / 1,2B
35%

Target: Jun 2029
Theo tốc độ hiện tại: Oct 2029
Để đạt target: cần thêm ~4,5M/tháng

[ Thử một khoản chi ]
```

Progress bar vẫn dùng, nhưng projected date là thông tin quan trọng ngang hoặc cao hơn progress.

**## 12.7. DataFreshnessSection**

Purpose:

```txt
Tạo trust cho manual-first forecast.
```

Example:

```txt
Có 2 khoản nên cập nhật

VCB · cập nhật 35 ngày trước
Lương tháng này · cần xác nhận

[ Cập nhật nhanh ]
```

Action:

```txt
Confirm unchanged
Cập nhật giá trị
Xác nhận event
```

Không dùng history activity như một Home section lớn nếu không tạo action.

**## 12.8. WhatIfSheet / Dialog**

Desktop:

```txt
Dialog hoặc side sheet.
```

Mobile:

```txt
Bottom sheet / dedicated route.
```

Input tối thiểu:

```txt
Số tiền
Ngày dự kiến
Goal optional
```

Result hierarchy:

```txt
Các khoản sắp tới
Reserve
Flexible Money before → after
Goal before → after
Assumptions
```

Example:

```txt
30.000.000đ

✓ Các khoản đã biết vẫn được cover
✓ Quỹ an toàn vẫn được giữ

Tiền linh hoạt
54M → 24M

Mua nhà
Oct 2029 → Jan 2030
Khoảng 3 tháng chậm hơn

Theo dữ liệu hiện có.

[ Xem cách tính ]
[ Thử số khác ]
```

Không có CTA “Bạn nên mua / không nên mua”.

---

**## 13. Full Home Layout Example**

```tsx
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <AppSidebar />

          <main className="space-y-5">
            <FinancialStateHeader />
            <FlexibleMoneySection />
            <UpcomingPreviewSection />
            <MoneyLocationSection />
            <MainGoalSection />
            <DataFreshnessSection />
          </main>
        </div>
      </div>
    </div>
  );
}
```

Mobile order:

```txt
1. Financial State
2. Flexible Money
3. What-if CTA
4. 30 Days Ahead
5. Main Goal
6. Money Location
7. Data Freshness
```

Rules:

```txt
Không quay lại layout nhiều card nhỏ.
Không để Total Assets cạnh tranh với Flexible Money.
Không để Recent Activity chiếm chỗ của forecast.
Không đưa Discussion lên Home MVP.
Không đưa chart chỉ để trang trí.
Detail chỉ dùng để breakdown, history hoặc edit.
```

---

**## 14. Other Web Pages**

Nguyên tắc chung:

```txt
Home = clarity + foresight + decision entry
Detail pages = quản lý data / hiểu breakdown
```

Common detail structure:

```tsx
<div className="space-y-5">
  <PageHeader />
  <SummaryStrip />
  <ToolbarOrControls />
  <PrimaryContent />
</div>
```

**## 14.1. Assets Page**

Purpose:

```txt
Quản lý money sources / assets:
tiền đang ở đâu, ai giữ, có tính vào household picture không,
partner được xem ở mức nào, data còn mới không.
```

Layout:

```txt
Header + Add source
Summary strip: Shared liquid · Long-term · Debt
Toolbar: Search · Type · Holder · Sharing · Liquidity
Desktop: table / dense grouped list
Mobile: grouped rows
```

Required row information:

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

UI sharing labels:

```txt
Hiện chi tiết
Chỉ tính vào tổng
Riêng tư
```

Backend có thể có `grouped`, nhưng UI MVP không bắt buộc expose nó như lựa chọn riêng.

**## 14.2. Upcoming / Cash-flow Page**

Name:

```txt
Sắp tới
```

Không dùng `Upcoming Payments` vì page có cả tiền vào và tiền ra.

Purpose:

```txt
Cho household nhìn dòng tiền theo thời gian và phát hiện low point trước khi xảy ra.
```

Default layout:

```txt
Header + Add event
Horizon: 7 / 30 / 60 days
Summary: Incoming · Outgoing · Lowest balance
Timeline ordered by date
```

Example:

```txt
Today                         128M

15 Aug · Lương        +45M → 173M
18 Aug · Tiền nhà     -15M → 158M
22 Aug · Thẻ          -12M → 146M
28 Aug · Bảo hiểm      -8M → 138M

Lowest projected balance
128M
```

Event UI needs:

```txt
Tên
Incoming / Outgoing
Amount
Expected date
Confirmed / Estimated
Required / Planned nếu outgoing
Owner
Recurring indicator
```

Rules:

```txt
Incoming và outgoing cùng timeline.
Confirmed vs Estimated phải phân biệt rõ nhưng không làm UI nặng.
Red chỉ dùng nếu actual projected shortfall / overdue.
Orange cho near reserve / attention.
```

**## 14.3. Goals Page**

Purpose:

```txt
Theo dõi mục tiêu chung và hiểu timeline đạt mục tiêu.
```

Layout:

```txt
Header + Add goal
Primary goal
Other goals
```

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

Primary action:

```txt
[ Thử một khoản chi ]
```

Rules:

```txt
Progress bar không phải output duy nhất.
Time-to-goal phải dễ scan.
Không giả định investment return trong MVP.
```

**## 14.4. Household Page**

Purpose:

```txt
Quản lý shared financial context mà không tạo cảm giác admin-heavy.
```

Groups:

```txt
Thành viên
Cách hai người quản lý tài chính
Quỹ an toàn
Sharing defaults
Update frequency
```

Member row:

```txt
Tên
Vai trò
Permission
Joined status
```

Privacy copy phải rõ, không icon-only.

**## 14.5. Quick Update Flow**

Không yêu cầu user nhập lại một “snapshot tổng” độc lập nếu hệ thống đã có source-of-truth records.

Purpose:

```txt
Confirm / update các input đang làm forecast stale.
```

Preferred flow:

```txt
VCB
128M
[ Không đổi ] [ Cập nhật ]

Lương tháng này
45M · 15 Aug
[ Xác nhận ] [ Chỉnh ]

Tiền nhà
15M · 18 Aug
[ Không đổi ]

Quỹ an toàn
40M
[ Không đổi ]
```

Sau update:

```txt
System tự recalculate:
- current financial state
- flexible money
- forecast
- goal projection
```

CTA:

```txt
Hoàn tất cập nhật
```

Không nên:

```txt
Bắt nhập thủ công total liquid + total savings + total long-term assets
nếu các số này đã derive được từ money sources.
```

**## 14.6. Onboarding**

Goal:

```txt
Đưa user tới Clarity Moment nhanh nhất,
sau đó tới first What-if.
```

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
10. Prompt: “Có khoản nào đang cân nhắc không?”
```

Rules:

```txt
One-screen-per-step hoặc compact wizard.
Không hỏi toàn bộ tài sản ngay.
Luôn có skip partner.
Giải thích rõ “không cần nhập từng khoản nhỏ”.
Sau mỗi step nên cho user thấy progress có ý nghĩa, không chỉ step count.
```

First insight screen:

```txt
Nhà mình hiện có 128M thanh khoản.
Sau các khoản sắp tới và quỹ an toàn,
có khoảng 54M linh hoạt.
```

**## 14.7. Settings / Privacy**

Groups:

```txt
Household
Members
Permission
Sharing defaults
Data safety
Export/delete
```

MVP sharing copy:

```txt
Hiện chi tiết
→ Partner thấy tên và số tiền.

Chỉ tính vào tổng
→ Khoản này được tính vào bức tranh chung nhưng không hiện chi tiết.

Riêng tư
→ Partner không thấy và khoản này không tham gia tính toán chung.
```

Danger zone đặt cuối page.

**## 14.8. Snapshot History**

Purpose:

```txt
Cho user xem các historical financial pictures đã freeze,
không dùng nó làm source of truth cho current forecast.
```

Layout:

```txt
Header
Summary trend nhỏ
Snapshot list/table
Filter month
```

Snapshot detail có thể show:

```txt
Liquid
Reserve
Flexible Money
Upcoming incoming/outgoing
Lowest projected balance
Goal state
Data source freshness
```

Không cần chart phức tạp trong MVP.

**## 14.9. What-if Result Route (optional)**

MVP có thể dùng dialog/sheet.

Dedicated route chỉ cần nếu:

```txt
mobile deep-link
share result
need larger explanation
```

What-if mặc định không phải persistent object và không có scenario-history UI ở MVP.

---

**## 15. Responsive Rules**

**## Desktop**

```txt
Sidebar allowed.
Wide main area.
Flexible Money + CTA có thể cùng hàng.
Upcoming summary có 3 metrics.
Tables chỉ dùng detail pages.
What-if dùng Dialog/Sheet.
```

**## Tablet**

```txt
Sidebar collapsed.
Grid 2 cột chỉ khi còn dễ đọc.
Upcoming timeline giữ single logical sequence.
Dialogs có thể thành sheets.
```

**## Mobile Web / PWA**

Key flows phải được thiết kế mobile-primary:

```txt
Home
What-if
Upcoming
Quick Update
Goal detail
```

Rules:

```txt
Single column.
Bottom nav tối đa 5 item.
Flexible Money visible trước fold khi hợp lý.
Primary What-if CTA có thể sticky bottom.
Không dùng table.
Timeline rows phải scan được bằng một tay.
Money values không bị truncate.
No horizontal overflow.
```

Desktop là nơi tốt cho setup/review; mobile phải tốt cho decision moment.

---

**## 16. Copywriting Rules**

**## 16.1. Voice**

```txt
Bình tĩnh
Tôn trọng
Rõ ràng
Không phán xét
Không kiểm soát
Không giả vờ chắc chắn hơn dữ liệu
```

**## 16.2. Preferred Words**

```txt
Tình hình
Nhà mình
Cùng xem
Sắp tới
Dự kiến
Có thể linh hoạt
Quỹ an toàn
Mục tiêu
Theo tốc độ hiện tại
Theo dữ liệu hiện có
Ảnh hưởng
Người phụ trách
Cần cập nhật
```

**## 16.3. Avoid Words**

```txt
Kiểm soát
Theo dõi đối phương
Truy vết
Đáng ngờ
Hoang phí
Sai lầm
Không được mua
Cảnh báo nghiêm trọng
Vượt chi
Ai tiêu khoản này?
Bạn nên mua
Bạn không nên mua
```

**## 16.4. Status Copy**

On track:

```txt
Theo dữ liệu hiện có, các khoản trong 30 ngày tới đều được cover.
```

Watch:

```txt
Có một vài điểm nên xem trước trong thời gian tới.
```

Tight:

```txt
Có một thời điểm balance dự kiến xuống thấp.
```

Incomplete:

```txt
Cần cập nhật thêm một vài khoản để forecast chính xác hơn.
```

**## 16.5. What-if Copy**

Good:

```txt
Các khoản đã biết vẫn được cover.
Quỹ an toàn vẫn được giữ.
Tiền linh hoạt: 54M → 24M.
Mục tiêu mua nhà dự kiến chậm khoảng 3 tháng.
Theo dữ liệu hiện có.
```

Avoid:

```txt
Bạn đủ khả năng mua.
Bạn không nên mua.
Quyết định này rủi ro.
Đây là lựa chọn tài chính tốt/xấu.
```

---

**## 17. Button Labels**

Primary decision CTA:

```txt
Thử một khoản chi
```

Primary data CTA khi stale:

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
Xem mục tiêu
Xem cách tính
Xem chi tiết
```

What-if:

```txt
Kiểm tra ảnh hưởng
Thử số khác
```

Avoid:

```txt
Phân tích rủi ro
Kiểm tra ngay
Cảnh báo
Theo dõi chi tiêu
Mua được / Không mua được
```

---

**## 18. Icon System**

Use `lucide-react`.

Recommended icons:

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
Use line icons.
Stroke width 1.75–2.
No emoji in production UI.
Không dùng icon cho mọi row nếu text đã rõ.
Privacy không bao giờ icon-only.
Incoming/outgoing có thể dùng direction icon nhưng vẫn phải có dấu +/- hoặc label.
```

Soft icon:

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5 text-foreground" strokeWidth={1.8} />
</div>
```

---

**## 19. MVP UI Rules**

Do:

```txt
Home trả lời “nhà mình đang ổn không?”.
Flexible Money là money metric chính.
Có 30-day incoming/outgoing timeline.
Hiện Lowest Projected Balance.
Goal có projected completion date.
What-if prominent nhưng không phán quyết.
Có data freshness.
Có money location / holder.
Privacy dùng text rõ.
Dùng grouped list thay card proliferation.
Detail pages đủ density để thao tác.
Quick Update confirm source-of-truth data.
```

Do not:

```txt
Không đưa giao dịch nhỏ lên Home.
Không dùng Total Assets làm hero metric chính.
Không chỉ show bill list mà thiếu incoming/running balance.
Không build Discussion module trong MVP.
Không bắt user nhập snapshot totals nếu derive được.
Không tạo What-if history UI khi chưa validate save/compare behavior.
Không dùng nested cards quá 2 tầng.
Không dùng chart trang trí.
Không hỏi “ai tiêu khoản này?”.
Không dùng verdict “nên mua / không nên mua”.
Không hy sinh privacy clarity để tối giản UI.
```

---

**## 20. Example Home Content**

```txt
NHÀ MÌNH

ON TRACK

Các khoản đã biết trong 30 ngày tới đều được cover.
Cập nhật gần nhất: hôm nay
```

```txt
CÓ THỂ LINH HOẠT

54.000.000đ

Sau các khoản sắp tới và quỹ an toàn đã đặt.

Tiền thanh khoản     128M
Cần trong thời gian tới   -34M
Quỹ an toàn          -40M

[ THỬ MỘT KHOẢN CHI ]
```

```txt
30 NGÀY TỚI

Tiền vào             +45M
Tiền ra              -34M
Thấp nhất             82M

15 Aug · Lương              +45M
18 Aug · Tiền nhà           -15M
22 Aug · Thẻ tín dụng       -12M

[ Xem timeline ]
```

```txt
MỤC TIÊU CHÍNH

Mua nhà

420M / 1,2B
35%

Target
Jun 2029

Theo tốc độ hiện tại
Oct 2029

[ Thử một khoản chi ]
```

```txt
TIỀN ĐANG Ở ĐÂU

An        72M
Bình      46M
Chung     10M

[ Xem nguồn tiền ]
```

```txt
CẦN CẬP NHẬT

2 khoản nên xác nhận để forecast chính xác hơn.

VCB · 35 ngày chưa cập nhật
Lương tháng này · cần xác nhận

[ Cập nhật nhanh ]
```

---

**## 21. Implementation Class Cheatsheet**

Page:

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">...</div>
</div>
```

Header:

```tsx
<div className="mb-5 flex items-start justify-between gap-4">...</div>
```

Card default:

```tsx
<Card className="p-5 md:p-6">...</Card>
```

Important card:

```tsx
<Card className="apple-shadow p-6 md:p-7">...</Card>
```

Soft group:

```tsx
<div className="rounded-3xl border border-border bg-muted/50 p-4">...</div>
```

Grouped list wrapper:

```tsx
<div className="rounded-3xl border border-border bg-muted/50 p-2">...</div>
```

List row:

```tsx
<button className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left transition hover:bg-white/80">...</button>
```

Money number:

```tsx
<p className="money-number text-5xl leading-none md:text-6xl">54M đ</p>
```

Muted text:

```tsx
<p className="text-sm text-muted-foreground">Theo dữ liệu hiện có · cập nhật hôm nay</p>
```

Primary button:

```tsx
<Button className="h-11 rounded-full px-5">Thử một khoản chi</Button>
```

Soft icon:

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5" strokeWidth={1.8} />
</div>
```

Status badge:

```tsx
<Badge className="rounded-full bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))] hover:bg-[hsla(var(--status-green),0.1)]">
  Ổn
</Badge>
```

Glass sticky action:

```tsx
<div className="glass-panel fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-full border border-white/60 p-1 apple-shadow">
  <Button className="w-full rounded-full">Thử một khoản chi</Button>
</div>
```

---

---

**## 22. Final Product Feel**

Money Space phải có cảm giác:

```txt
Một private financial space sạch, trưởng thành và bình tĩnh
cho hai người đang xây cuộc sống chung.

Không cần làm kế toán.
Không cần gộp toàn bộ tiền.
Không cần theo dõi từng khoản nhỏ.

Chỉ cần đủ dữ liệu để:
biết tình hình,
nhìn những gì sắp tới,
và hiểu consequence trước quyết định.
```

Visual feel:

```txt
Apple-like clarity
Consumer finance trust
Personal wellness calmness
Clean tool utility
```

Không phải:

```txt
expense tracker
household accounting
partner surveillance
investment terminal
enterprise BI dashboard
gamified finance app
AI financial advisor
```

Design goal:

```txt
User mở app và hiểu trong 5–10 giây:

1. Nhà mình đang ổn không?
2. Còn bao nhiêu tiền linh hoạt?
3. 30 ngày tới có gì?
4. Goal đang đi tới đâu?

Và khi có một khoản chi đáng cân nhắc:
“Thử xem khoản này ảnh hưởng gì.”
```

Product hierarchy cuối cùng:

```txt
Shared Financial Clarity
→ Financial Foresight
→ Decision Support
```

Design không chỉ làm dashboard đẹp hơn.

Design phải khiến consequence tài chính trở nên:
```txt
dễ thấy
dễ hiểu
không đáng sợ
không phán xét
và đủ đáng tin để hai người cùng dùng.
```

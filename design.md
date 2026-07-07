# Web Design System — Money Space

> Updated guideline: Apple-like, white-first, section-based dashboard.  
> Main correction from the latest UI review: **reduce nested cards**, use **grouped lists** when a section has many child items, and keep Home as a calm overview instead of a dense finance dashboard.  
> Spec alignment: Money Space is a **consumer-grade family finance dashboard** with admin-like detail pages, not a landing page/ecommerce UI and not a dense enterprise BI dashboard.

---

## 1. Product Design Direction

Money Space là web app dashboard tài chính chung cho couple/family trẻ.

Core question của Home:

> “Nhà mình đang ổn không?”

Design direction:

```txt
Apple-like
White-first premium
Calm finance
Consumer-grade dashboard
Clean admin when needed
Glanceable Gen Z overview
Fewer, richer sections
Private, not controlling
Web-first but mobile responsive
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
```

Design target:

```txt
User mở Home và hiểu trong 5–10 giây:
- Nhà mình đang ổn không?
- Dùng ngay còn bao nhiêu?
- Sắp phải trả gì?
- Có việc nào cần bàn không?
- Kế hoạch dài hạn đang đi tới đâu?
```

Product fit:

```txt
Home dùng Apple-like overview vì sản phẩm xoay quanh financial snapshot.
Detail pages dùng clean admin UI vì MVP vẫn có CRUD: asset, payment, goal, discussion, permissions.
Không dùng cùng một density cho toàn app.
```

---

## 2. Apple-like Product Principles

## 2.1. Surface hierarchy

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

## 2.2. Dashboard is preview, not detail page

Home không phải nơi chứa toàn bộ dữ liệu.

```txt
Home = status + preview + next action
Detail page = breakdown + table + history + edit
```

Mỗi section trên Home chỉ nên trả lời một câu hỏi:

```txt
Hero              → Nhà mình đang ổn không?
Tiền nhà mình     → Tiền hiện tại có đủ nhìn nhanh không?
Cần chú ý         → Có gì cần xem trong tuần này?
Kế hoạch dài hạn  → Mục tiêu chính đang đi tới đâu?
Gần đây           → Dữ liệu có còn mới không?
```

## 2.3. List-first when there are many child items

Khi trong một section có nhiều sub-card, **không render thành nhiều card bằng nhau**.

Ưu tiên theo thứ tự:

```txt
1. Grouped list rows
2. Top 2–3 preview items + “Xem tất cả”
3. 2-column group only khi có đúng 2 nhóm lớn
4. Detail page nếu dữ liệu nhiều hơn 6 item
```

Rule:

```txt
0–2 nhóm lớn       → dùng grid 2 cột hoặc stack mobile
3–6 item nhỏ       → dùng grouped list
>6 item            → show 3 item đầu + “+N mục khác” + CTA
Nhiều loại dữ liệu → chia group bằng heading nhỏ, không thêm card mới liên tục
```

## 2.4. Dashboard app, not landing page

Style này phù hợp với Money Space vì sản phẩm là **family finance dashboard**: user cần xem tình hình chung, không phải đọc marketing content hay quản trị hàng nghìn record.

Cách phân tầng sản phẩm:

```txt
Home                → consumer-grade overview, spacious, calm
Assets              → clean admin list/table, filter rõ, vẫn ít nhiễu
Upcoming Payments   → grouped list/table theo thời gian
Goals               → progress cards + detail list
Discussion          → inbox-like lightweight discussion, không biến thành chat app nặng
Settings/Privacy    → grouped settings rõ như iOS Settings
Update Snapshot     → focused form trong dialog/sheet
```

Rule:

```txt
Apple-like cho overview, không đồng nghĩa với ít chức năng.
Detail pages vẫn cần toolbar, filter, table/list, row actions và empty states rõ.
```

## 2.5. Density by page type

Không dùng một mức spacing cho toàn app.

```txt
Overview density
- Home
- Goal overview
- Privacy intro
- Empty state

Management density
- Assets
- Upcoming payments
- Snapshot history
- Discussion list

Form density
- Update snapshot
- Add asset
- Add payment
- Permission editor
```

Practical density rules:

```txt
Home:       nhiều whitespace, ít data, số lớn, preview 2–3 item.
Detail:     compact hơn, list/table rõ, action dễ thấy.
Form:       grouped field, label rõ, helper text ngắn.
Settings:   row-based, mô tả quyền thật rõ, không giấu ý nghĩa sau icon.
```

## 2.6. CRUD pages should still feel like tools

Các page quản lý không được quá giống landing page.

Nên có:

```txt
Header + primary action
Summary strip
Search/filter/tabs
Grouped list hoặc table
Row action
Empty state
Permission/visibility indicator khi liên quan đến dữ liệu nhạy cảm
```

Không nên:

```txt
Mỗi record là một card lớn nếu list dài.
Hero quá to trên page quản lý.
CTA marketing-style.
Chart trang trí không giúp quyết định.
Ẩn filter/action vì muốn UI quá tối giản.
```

## 2.7. Privacy clarity beats prettiness

Vì app xử lý dữ liệu tài chính gia đình, UI đẹp nhưng mơ hồ là sai.

Mỗi thông tin nhạy cảm cần rõ:

```txt
Ai đang giữ/phụ trách?
Ai được xem?
Đang chia sẻ ở mức nào?
Lần cập nhật gần nhất là khi nào?
Có ghi chú nhạy cảm không?
```

Visibility labels nên dùng copy dễ hiểu:

```txt
Hiện đầy đủ
Chỉ hiện số tổng
Hiện theo nhóm
Riêng tư
```

Không dùng icon-only cho quyền riêng tư. Icon có thể đi kèm text, không thay text.

---

## 3. Tech Stack UI

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

## 4. Visual Language

## 4.1. Brand Feeling

```txt
Sạch như Apple product
Rõ như finance dashboard
Nhẹ như personal wellness app
Riêng tư như private space
```

## 4.2. UI Mood

```txt
Calm
Minimal
Premium
Human
Trustworthy
Non-judgmental
```

## 4.3. Avoid

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

## 5. Color System

Design dùng nền trắng/xám iOS-like, không dùng dark mode làm default.

## 5.1. Core Tokens

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

## 5.2. Status Tokens

```txt
Blue              #007AFF
Green             #34C759
Orange            #FF9500
Red               #FF3B30
```

## 5.3. Semantic Usage

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

## 6. Tailwind v4 + shadcn CSS Variables

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

## 7. Tailwind Usage Rules

## 7.1. Radius

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

## 7.2. Shadow

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

## 7.3. Status colors

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

## 7.4. Canonical class map

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

## 8. Layout System for Web

## 8.1. App Shell

```txt
Desktop:
Sidebar trái
Main content giữa
Right panel optional, chỉ dùng cho quick action thật sự quan trọng

Tablet:
Sidebar collapsed
Main content full

Mobile:
Top header
Single column
Bottom CTA hoặc bottom nav
```

## 8.2. Desktop structure

Home dashboard desktop không nên chia thành quá nhiều card nhỏ. Cấu trúc recommended:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Hero Snapshot: Tình hình nhà mình             Update CTA     │
│ Status · Dùng ngay · Sắp trả · Cần bàn                       │
├──────────────────────────────────────────────────────────────┤
│ Tiền nhà mình                                                │
│ Thanh khoản                         Tổng tài sản             │
│ Dùng ngay · Dự phòng                Tài sản · Nợ              │
├──────────────────────────────────────────────────────────────┤
│ Cần chú ý                                                    │
│ Sắp trả list                         Cần bàn preview          │
├──────────────────────────────────────────────────────────────┤
│ Kế hoạch dài hạn                                             │
│ Mục tiêu chính                      Bổ sung                   │
├──────────────────────────────────────────────────────────────┤
│ Gần đây                                                       │
└──────────────────────────────────────────────────────────────┘
```

Rule:

```txt
Section lớn = container theo chủ đề
Sub-section = nhóm ý nghĩa bên trong
Metric = số liệu cụ thể
Row = item có hành động hoặc metadata
```

Không dùng:

```txt
Section → nhiều text/value rải ngang
Section → 5–8 card nhỏ ngang nhau
Section → card lớn phẳng không có group/list
```

Nên:

```txt
Section → Header → 1–2 grouped areas hoặc grouped list rows
```

## 8.3. Container

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
    {/* page */}
  </div>
</div>
```

## 8.4. Home order

```txt
1. Hero Snapshot
2. Tiền nhà mình
3. Cần chú ý
4. Kế hoạch dài hạn
5. Gần đây
```

---

## 9. Typography System

## 9.1. Web Type Scale

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

## 9.2. Money formatting

Ưu tiên rõ nghĩa hơn là quá ngắn.

```txt
Good: 24,5M đ
Good: 24,5 triệu
Good: 374M đ
Avoid: 24,5M nếu không rõ đơn vị
Avoid: 24.500.000đ ở Hero nếu làm khó scan
```

---

## 10. Core Component Patterns

## 10.1. Section Header

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

## 10.2. Card

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

## 10.3. Metric Cell

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
Không dùng MetricCell cho item list như payment, discussion, history.
```

## 10.4. Soft Group

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

## 10.5. Grouped List

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
List row là default cho payment, discussion, recent update, asset preview.
Không biến mỗi row thành một card có shadow.
Không dùng border đậm giữa row; dùng spacing hoặc Separator rất nhẹ.
```

---

## 11. Handling Many Sub-cards inside One Section

Đây là rule quan trọng nhất cho Home.

## 11.1. Decision tree

```txt
Có đúng 2 nhóm lớn?
→ Dùng 2 SoftGroup, desktop 2 cột, mobile 1 cột.

Có 3–6 item cùng loại?
→ Dùng Grouped List.

Có nhiều hơn 6 item?
→ Show 3 item quan trọng nhất + “+N mục khác” + “Xem tất cả”.

Có nhiều loại item trong cùng section?
→ Chia bằng heading nhỏ trong cùng grouped list, không tạo nhiều card ngang hàng.

Có dữ liệu cần bảng?
→ Đưa sang detail page. Home chỉ preview.
```

## 11.2. Good pattern: section with list

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader title="Cần chú ý" hint="Có vài việc nên xem trong tuần này" action="Xem tất cả" />

  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
    <div className="rounded-3xl border border-border bg-muted/50 p-2">
      <div className="px-3 pb-2 pt-2">
        <p className="text-sm font-medium text-[hsl(var(--status-orange))]">Sắp trả · 3 khoản</p>
      </div>
      <ListRow title="Học phí tháng 7" meta="Gần nhất · 10/07 · 12M đ" />
      <ListRow title="Tiền nhà" meta="15/07" />
      <ListRow title="Bảo hiểm xe" meta="22/07" />
    </div>

    <div className="rounded-3xl border border-border bg-muted/50 p-2">
      <div className="px-3 pb-2 pt-2">
        <p className="text-sm font-medium text-muted-foreground">Cần bàn · 1 việc</p>
      </div>
      <ListRow title="Học phí tháng 7" meta="Nên thống nhất nguồn tiền" value="Bàn" />
    </div>
  </div>
</Card>
```

## 11.3. Bad pattern: too many nested cards

```tsx
// Avoid
<Card>
  <Card>
    <Card>Học phí tháng 7</Card>
    <Card>Tiền nhà</Card>
    <Card>Bảo hiểm xe</Card>
  </Card>
  <Card>
    <Card>Cần bàn</Card>
  </Card>
</Card>
```

Why bad:

```txt
Quá nhiều border/shadow.
Hierarchy bị đều.
Dashboard giống SaaS admin hơn Apple-like.
Khó scan trên mobile.
```

---

## 12. Home Page Components

## 12.1. AppSidebar

Items:

```txt
Tổng quan
Tài sản
Khoản sắp tới
Mục tiêu
Lịch sử cập nhật
Thành viên
Cài đặt
```

Style:

```txt
width: 260px
background: transparent hoặc white tinh tế
active item: bg-muted + text-foreground
icon: lucide line icon
```

Example:

```tsx
<aside className="hidden h-screen w-[260px] border-r border-border/70 bg-background px-3 py-4 lg:block">
  {/* nav */}
</aside>
```

## 12.2. HeroSnapshot

Purpose:

```txt
Trả lời “Nhà mình đang ổn không?” trong 5 giây.
```

Content:

```txt
Status badge: Ổn / Cần chú ý / Căng / Chưa đủ dữ liệu
Last updated: Cập nhật 05/07
Title: Tình hình nhà mình
Three quick signals:
- Dùng ngay
- Sắp trả
- Cần bàn
Primary CTA: Cập nhật tình hình
```

Recommended style:

```tsx
<Card className="apple-shadow overflow-hidden p-6 md:p-7">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-[hsla(var(--status-orange),0.1)] px-3 py-1 font-medium text-[hsl(var(--status-orange))]">
          Cần chú ý
        </span>
        <span className="text-muted-foreground">Cập nhật 05/07</span>
      </div>

      <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
        Tình hình nhà mình
      </h1>
    </div>

    <Button className="h-11 rounded-full px-5">Cập nhật tình hình</Button>
  </div>

  <div className="mt-7 grid gap-3 md:grid-cols-3">
    <MetricCell label="Dùng ngay" value="24,5M đ" />
    <MetricCell label="Sắp trả" value="3 khoản" />
    <MetricCell label="Cần bàn" value="1 việc" />
  </div>
</Card>
```

Rules:

```txt
Hero không giải thích dài.
Hero phải có status + 3 tín hiệu chính.
CTA rõ nhưng không tạo cảm giác bị thúc ép.
Không đưa chart vào Hero MVP.
```

## 12.3. QuickUpdateCard

Quick update card là optional. Chỉ dùng nếu CTA cập nhật là hành động cốt lõi.

```tsx
<Card className="flex min-h-[220px] flex-col justify-between bg-primary p-5 text-primary-foreground">
  <div className="flex items-center justify-between text-sm text-primary-foreground/70">
    <span>Nhanh</span>
    <Bell className="size-4" strokeWidth={1.8} />
  </div>

  <div>
    <h3 className="text-2xl font-semibold tracking-[-0.04em]">Cập nhật</h3>
    <p className="mt-1 text-sm text-primary-foreground/65">Mất khoảng 2 phút</p>
  </div>
</Card>
```

Rules:

```txt
Không để Quick card cạnh tranh quá mạnh với Hero.
Không thêm nhiều CTA phụ trong card này.
Mobile nên biến thành button/card nhỏ dưới Hero.
```

## 12.4. MoneyOverviewSection

Name:

```txt
Tiền nhà mình
```

Purpose:

```txt
Cho user biết bức tranh tiền chính mà không cần bấm detail.
```

Sub-sections:

```txt
Thanh khoản
- Dùng ngay
- Dự phòng

Tổng tài sản
- Tài sản
- Nợ
```

Recommended pattern: 2 SoftGroup vì có đúng 2 nhóm lớn.

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader title="Tiền nhà mình" hint="Dùng ngay đủ tháng này" />

  <div className="grid gap-4 md:grid-cols-2">
    <SoftGroup title="Thanh khoản">
      <div className="grid grid-cols-2 gap-3">
        <MetricCell label="Dùng ngay" value="24,5M đ" />
        <MetricCell label="Dự phòng" value="86M đ" />
      </div>
    </SoftGroup>

    <SoftGroup title="Tổng tài sản">
      <div className="grid grid-cols-2 gap-3">
        <MetricCell label="Tài sản" value="374M đ" />
        <MetricCell label="Nợ" value="18M đ" />
      </div>
    </SoftGroup>
  </div>
</Card>
```

Rules:

```txt
Không tách 4 metric thành 4 card rời ở cấp section.
Không đặt cả 4 metric ngang hàng trong một card phẳng.
Được dùng metric cell vì chỉ có 4 số chính.
```

## 12.5. AttentionSummarySection

Name:

```txt
Cần chú ý
```

Purpose:

```txt
Gom các việc cần xem trong tuần/tháng này.
Không phải cảnh báo nặng.
Không phải chat.
```

Sub-sections:

```txt
Sắp trả
- Số khoản
- Khoản gần nhất
- Ngày hạn
- Số tiền nếu có

Cần bàn
- Số việc
- Chủ đề gần nhất
```

Important IA rule:

```txt
“Gần nhất” thuộc nhóm “Sắp trả”.
Không đặt “Sắp trả”, “Gần nhất”, “Cần bàn” thành 3 cột cùng cấp.
```

Recommended pattern: grouped list, không dùng nhiều sub-card.

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader title="Cần chú ý" hint="Có vài việc nên xem trong tuần này" action="Xem tất cả" />

  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
    <div className="rounded-3xl border border-border bg-muted/50 p-2">
      <div className="px-3 pb-2 pt-2">
        <p className="text-sm font-medium text-[hsl(var(--status-orange))]">
          Sắp trả · 3 khoản
        </p>
      </div>

      <ListRow title="Học phí tháng 7" meta="Gần nhất · 10/07 · 12M đ" />
      <ListRow title="Tiền nhà" meta="15/07" />
      <ListRow title="Bảo hiểm xe" meta="22/07" />
    </div>

    <div className="rounded-3xl border border-border bg-muted/50 p-2">
      <div className="px-3 pb-2 pt-2">
        <p className="text-sm font-medium text-muted-foreground">Cần bàn · 1 việc</p>
      </div>

      <ListRow title="Học phí tháng 7" meta="Nên thống nhất nguồn tiền" value="Bàn" />
    </div>
  </div>
</Card>
```

Tone:

```txt
Dùng “Cần chú ý”, “Cần bàn”, “Xem”.
Không dùng “Cảnh báo”, “Đáng ngờ”, “Vượt chi”.
```

## 12.6. LongTermPlanSection

Name:

```txt
Kế hoạch dài hạn
```

Purpose:

```txt
Cho user thấy mục tiêu và tài sản dài hạn đang đi về đâu.
```

Recommended pattern: 2 SoftGroup hoặc một progress block + side list.

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader title="Kế hoạch dài hạn" hint="Mục tiêu chính đang tiến triển tốt" />

  <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
    <div className="rounded-3xl border border-border bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Mục tiêu chính</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Quỹ dự phòng</h3>
        </div>
        <p className="text-2xl font-semibold tracking-[-0.04em]">72%</p>
      </div>

      <Progress value={72} className="mt-5 h-2 rounded-full bg-card" />
    </div>

    <div className="rounded-3xl border border-border bg-muted/50 p-2">
      <ListRow title="Còn thiếu" value="34M đ" />
      <ListRow title="Tài sản chính" meta="Vàng, đầu tư" />
    </div>
  </div>
</Card>
```

Rules:

```txt
Progress bar là visual chính.
Không dùng chart phức tạp trong MVP.
Không tách “Còn thiếu” và “Tài sản chính” thành card lớn riêng nếu chỉ có 1 dòng thông tin.
```

## 12.7. RecentUpdateCard

Name:

```txt
Gần đây
```

Purpose:

```txt
Cho biết dữ liệu có còn mới không và ai vừa cập nhật gì.
```

Recommended pattern: compact list/card phụ.

```tsx
<Card className="p-5 md:p-6">
  <SectionHeader title="Gần đây" hint="Dữ liệu mới nhất trong nhà" />

  <div className="rounded-3xl border border-border bg-muted/50 p-2">
    <ListRow title="Minh cập nhật khoản học phí" meta="2 giờ trước" />
  </div>
</Card>
```

Rules:

```txt
Đặt cuối Home.
Không để history chiếm nhiều diện tích hơn overview.
Không dùng timeline phức tạp trong MVP.
```

---

## 13. Full Home Layout Example

```tsx
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <AppSidebar />

          <main className="space-y-5">
            <section className="grid gap-4 xl:grid-cols-[1fr_280px]">
              <HeroSnapshot />
              <QuickUpdateCard />
            </section>

            <MoneyOverviewSection />
            <AttentionSummarySection />
            <LongTermPlanSection />
            <RecentUpdateCard />
          </main>
        </div>
      </div>
    </div>
  );
}
```

Mobile order:

```txt
1. Hero Snapshot
2. Quick Update CTA/card
3. Tiền nhà mình
4. Cần chú ý
5. Kế hoạch dài hạn
6. Gần đây
```

Rules:

```txt
Không quay lại layout quá nhiều card nhỏ.
Không dùng card lớn phẳng chỉ rải text/value ngang hàng.
Mỗi section lớn phải có cấu trúc nội bộ rõ.
Detail chỉ để xem breakdown, lịch sử, note hoặc chỉnh sửa.
```

---

## 14. Other Web Pages

Nguyên tắc chung cho các page ngoài Home:

```txt
Home là overview.
Các page còn lại là nơi quản lý dữ liệu.
Vẫn giữ visual language Apple-like, nhưng tăng density đủ dùng.
```

Common detail page structure:

```tsx
<div className="space-y-5">
  <PageHeader title="Tài sản" description="Tiền và tài sản nhà mình đang nằm ở đâu" />
  <SummaryStrip />
  <Toolbar />
  <DataListOrTable />
</div>
```

Không dùng Hero quá lớn cho mọi page. Detail page chỉ cần header rõ, action rõ, dữ liệu dễ thao tác.

## 14.1. Assets Page

Purpose:

```txt
Quản lý tiền và tài sản gia đình đang nằm ở đâu, ai đang giữ, mức chia sẻ thế nào.
```

Layout:

```txt
Header + Add asset button
Summary strip: Tổng tài sản · Có thể dùng ngay · Dài hạn · Nợ nếu cần
Toolbar: Search · Loại tài sản · Người giữ · Mức chia sẻ · Tính thanh khoản
Desktop: table hoặc dense grouped list
Mobile: grouped list row
```

Recommended shadcn components:

```txt
Card
Button
Table
Badge
DropdownMenu
Select
Input
Dialog
Sheet
```

Required row information:

```txt
Tên tài sản
Loại
Giá trị
Người giữ/phụ trách
Tính thanh khoản
Mức chia sẻ
Ngày cập nhật
Action
```

Desktop example shape:

```txt
Tài sản
Tổng tài sản 374M · Dùng ngay 24,5M · Dài hạn 263M

[Search] [Loại] [Người giữ] [Mức chia sẻ]

Tiền mặt          Tiền mặt      Minh      12M      Dùng ngay      Hiện đầy đủ      ⋯
Ngân hàng         Bank          Linh      45M      Dùng ngay      Chỉ hiện tổng    ⋯
Vàng              Vàng          Chung     86M      Dài hạn        Theo nhóm        ⋯
```

Rules:

```txt
Không dùng card lớn cho từng asset nếu có nhiều hơn 4 asset.
Desktop detail page được dùng table.
Mobile dùng list row.
Amount align right.
Visibility luôn có text label, không icon-only.
Row action dùng DropdownMenu.
```

## 14.2. Upcoming Payments Page

Purpose:

```txt
Quản lý khoản sắp tới để gia đình tránh bị động.
```

Layout:

```txt
Header + Add payment button
Summary strip: 7 ngày tới · 30 ngày tới · Quá hạn · Cần trao đổi
Tabs: 7 ngày / 30 ngày / Quá hạn / Đã trả / Lặp lại
Payment table/list grouped by due date
```

Recommended shadcn components:

```txt
Tabs
Table
Badge
Button
DropdownMenu
Dialog
Sheet
Calendar
```

Required row information:

```txt
Tên khoản
Số tiền
Hạn trả
Người phụ trách
Trạng thái
Có cần trao đổi không
Action
```

Tone rules:

```txt
Dùng “Cần xem lại” thay vì “Cảnh báo”.
Dùng orange cho gần hạn.
Chỉ dùng red cho quá hạn hoặc thiếu tiền rõ ràng.
```

## 14.3. Goals Page

Purpose:

```txt
Theo dõi mục tiêu tài chính chung và giúp user hiểu tiền đang được giữ vì mục tiêu gì.
```

Layout:

```txt
Header + Add goal button
Primary goal card nếu có mục tiêu chính
Goal list/grid
Progress
Priority
Deadline
```

Recommended shadcn components:

```txt
Card
Progress
Badge
Button
Dialog
Sheet
DropdownMenu
```

Rules:

```txt
Goal ít hơn 6 item → card grid được.
Goal nhiều hơn 6 item → list compact.
Progress bar là visual chính.
Không dùng chart phức tạp trong MVP.
```

## 14.4. Discussions Page

Purpose:

```txt
Biến việc hỏi về tiền thành trao đổi nhẹ nhàng có ngữ cảnh.
```

Layout:

```txt
Header + New discussion button
Tabs: Đang mở / Cần quyết định / Đã thống nhất / Đã đóng
Discussion list
Detail drawer/page cho comment và kết luận
```

Recommended shadcn components:

```txt
Tabs
Card
Badge
Button
Textarea
DropdownMenu
Dialog
Sheet
Separator
```

Rules:

```txt
Không làm cảm giác như app chat realtime nặng.
Không dùng bubble chat quá vui/emoji trong UI chính.
Mỗi discussion cần có kết luận hoặc trạng thái.
Template câu hỏi nên nhẹ nhàng, không chất vấn.
```

Good row shape:

```txt
Sửa xe phát sinh 4M
Cần quyết định · Liên quan: Khoản tháng 7 · Minh tạo · 2 bình luận
```

## 14.5. Update Snapshot Flow

Purpose:

```txt
Cho user cập nhật nhanh tình hình tuần/tháng này mà không phải nhập giao dịch nhỏ.
```

Preferred UI:

```txt
Desktop: Dialog
Mobile/tablet: Sheet
```

Fields MVP:

```txt
Tiền có thể dùng ngay
Tiền tiết kiệm/dự phòng
Tài sản dài hạn
Nợ/khoản phải trả
Khoản cần chú ý optional
Ghi chú optional
```

Rules:

```txt
Form chỉ nên có 3–5 số chính.
Không hỏi giao dịch nhỏ.
Input tiền có suffix “đ”.
Có preview trước khi lưu nếu tính toán status.
CTA: “Lưu cập nhật” hoặc “Cập nhật tình hình”.
```

## 14.6. Onboarding

Purpose:

```txt
Giải thích app này là financial snapshot chung, không phải app ghi thu chi.
```

Flow UI:

```txt
1. Create household
2. Chọn vai trò tài chính hiện tại
3. Chọn mục tiêu sử dụng
4. Mời partner
5. Tạo snapshot đầu tiên
```

Rules:

```txt
Dùng one-screen-per-step hoặc compact card wizard.
Không hỏi quá nhiều ngay đầu.
Copy phải giảm lo lắng: “không cần nhập từng khoản nhỏ”.
Luôn cho skip invite nếu user chưa sẵn sàng.
```

## 14.7. Settings / Privacy Page

Purpose:

```txt
Household, members, permissions, privacy, export/delete data.
```

Recommended shadcn components:

```txt
Card
Form
Select
Switch
Separator
AlertDialog
Badge
Table hoặc grouped list
```

Layout:

```txt
Household info
Members
Permission levels
Visibility defaults
Data safety
Export/delete data
```

Permission display rules:

```txt
Permission phải dùng text rõ, không icon-only.
Mỗi mức quyền có mô tả 1 dòng.
Danger zone đặt cuối trang.
Không dùng red cho toàn bộ privacy page; red chỉ cho delete/destructive.
```

Permission copy:

```txt
View Summary  → Chỉ thấy tổng quan.
View Grouped  → Thấy theo nhóm tài sản/khoản.
View Detail   → Thấy chi tiết khoản được chia sẻ.
Edit Content  → Có thể thêm/sửa dữ liệu.
Admin         → Quản lý thành viên, quyền và dữ liệu.
```

## 14.8. Snapshot History Page

Purpose:

```txt
Cho user xem dữ liệu có được cập nhật đều không và tình hình thay đổi thế nào.
```

Layout:

```txt
Header
Summary trend nhỏ
Timeline hoặc table
Filter by month/member
```

Rules:

```txt
Không cần chart phức tạp trong MVP.
Desktop có thể dùng table.
Mobile dùng timeline/list.
Luôn hiện người cập nhật và thời điểm cập nhật.
```


---

## 15. Responsive Rules

## Desktop

```txt
Use sidebar
Use wide main area
Hero can have right quick card
2-column groups allowed
Tables allowed on detail pages
Primary action in header or Hero
```

## Tablet

```txt
Sidebar collapsed
Grid 2 columns only when content still readable
Dialogs can become sheets
Keep grouped list pattern
```

## Mobile Web

```txt
Single column
No table on Home
Use cards/list
Primary CTA can be sticky bottom
Hero metrics stack or 1-column grid
Avoid horizontal overflow
```

---

## 16. Copywriting Rules

## 16.1. Voice

```txt
Bình tĩnh
Tôn trọng
Rõ ràng
Không phán xét
Không kiểm soát
```

## 16.2. Preferred Words

```txt
Tình hình
Nhà mình
Cùng xem
Cần chú ý
Cập nhật
Theo dữ liệu hiện có
Khoản sắp tới
Mục tiêu chung
```

## 16.3. Avoid Words

```txt
Kiểm soát
Theo dõi đối phương
Truy vết
Đáng ngờ
Cảnh báo nghiêm trọng
Vượt chi
Ai tiêu khoản này?
```

## 16.4. Status Copy

Ổn:

```txt
Theo dữ liệu hiện có, nhà mình đang ổn.
```

Cần chú ý:

```txt
Có một vài khoản cần xem lại.
```

Căng:

```txt
Tháng này có thể hơi căng.
```

Chưa đủ dữ liệu:

```txt
Cần thêm dữ liệu để xem tình hình.
```

---

## 17. Button Labels

Primary:

```txt
Cập nhật tình hình
```

Secondary:

```txt
Xem chi tiết
```

Text link:

```txt
Xem
Xem tất cả
```

Optional:

```txt
Đánh dấu đã xem
```

Avoid:

```txt
Kiểm tra ngay
Cảnh báo
Phân tích rủi ro
Theo dõi chi tiêu
```

---

## 18. Icon System

Use `lucide-react`.

Recommended icons:

```txt
Home
Wallet
CalendarDays
Landmark
PiggyBank
Shield
Target
Bell
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
Icon container should be soft gray circle or rounded square.
Không dùng icon cho mọi row nếu text đã rõ.
```

Example:

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5 text-foreground" strokeWidth={1.8} />
</div>
```

---

## 19. MVP UI Rules

Do:

```txt
Home trả lời “nhà mình đang ổn không?”
Hiển thị số tiền lớn, dễ scan.
Dùng ít section hơn nhưng mỗi section đủ overview.
Section lớn phải có sub-section hoặc grouped list rõ ràng.
Có lần cập nhật gần nhất.
Có khoản sắp tới.
Có tài sản/tổng nợ rõ ràng.
Cập nhật snapshot nhanh.
Dùng list khi có nhiều item trong một section.
Detail pages có toolbar/filter/list/table rõ ràng.
Permission/privacy phải có text giải thích, không icon-only.
```

Do not:

```txt
Không đưa giao dịch nhỏ lên Home.
Không chia quá nhiều card nhỏ chỉ để hiển thị từng chỉ số.
Không gom nhiều thông tin vào một card lớn phẳng không có group/list.
Không build module chat/discussion trong MVP.
Không dùng đỏ nếu chỉ là khoản cần chú ý.
Không biến web thành bảng kế toán.
Không hỏi “ai tiêu khoản này?”.
Không dùng nested cards quá 2 tầng surface.
Không dùng hero/marketing layout cho các trang quản lý dữ liệu.
Không hy sinh clarity của quyền riêng tư để UI trông tối giản hơn.
```

---

## 20. Example Home Content

```txt
Tình hình nhà mình
Cần chú ý · Cập nhật 05/07

Dùng ngay
24,5M đ

Sắp trả
3 khoản

Cần bàn
1 việc

[Cập nhật tình hình]
```

```txt
Tiền nhà mình
Dùng ngay đủ tháng này

Thanh khoản
Dùng ngay: 24,5M đ
Dự phòng: 86M đ

Tổng tài sản
Tài sản: 374M đ
Nợ: 18M đ

[Xem]
```

```txt
Cần chú ý
Có vài việc nên xem trong tuần này

Sắp trả · 3 khoản
Học phí tháng 7 · Gần nhất · 10/07 · 12M đ
Tiền nhà · 15/07
Bảo hiểm xe · 22/07

Cần bàn · 1 việc
Học phí tháng 7 · Nên thống nhất nguồn tiền

[Xem tất cả]
```

```txt
Kế hoạch dài hạn
Mục tiêu chính đang tiến triển tốt

Mục tiêu chính
Quỹ dự phòng · 72%

Bổ sung
Còn thiếu: 34M đ
Tài sản chính: Vàng, đầu tư

[Xem]
```

```txt
Gần đây
Minh cập nhật khoản học phí · 2 giờ trước

[Xem]
```

---

## 21. Implementation Class Cheatsheet

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
<p className="money-number text-5xl leading-none md:text-6xl">24,5M đ</p>
```

Muted text:

```tsx
<p className="text-sm text-muted-foreground">Cập nhật gần nhất · 05/07/2026</p>
```

Primary button:

```tsx
<Button className="h-11 rounded-full px-5">Cập nhật tình hình</Button>
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
  <Button className="w-full rounded-full">Cập nhật tình hình</Button>
</div>
```

---

## 22. Final Product Feel

Money Space trên web phải có cảm giác:

```txt
Một consumer-grade dashboard tài chính riêng tư, sạch và cao cấp
cho couple/family trẻ cùng nhìn tình hình chung.
Home thoáng như Apple-like overview.
Detail pages rõ và thao tác được như clean admin app.
```

Không phải:

```txt
app ghi chi tiêu
app kế toán gia đình
app kiểm soát người giữ tiền
dashboard tài chính phức tạp
```

Design goal:

```txt
Người dùng mở web lên và hiểu trong 5–10 giây:
nhà mình đang ổn không,
tiền dùng ngay còn bao nhiêu,
sắp phải trả gì,
có khoản nào cần chú ý,
kế hoạch dài hạn đang tiến triển thế nào.

User không cần bấm detail để hiểu overview cơ bản.
Detail chỉ dùng để xem breakdown, lịch sử, note hoặc chỉnh sửa.
```

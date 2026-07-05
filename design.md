# Web Design System — Money Space

## 1. Product Design Direction

Money Space là web app dashboard tài chính chung cho couple/family trẻ.

Core question của Home:

> “Nhà mình đang ổn không?”

Design direction:

```txt
Apple-like
White-first premium
Calm finance
Clean dashboard
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
```

Premium của sản phẩm đến từ:

```txt
nền sạch
typography rõ
spacing rộng
card gọn
ít màu
ít icon trang trí
hierarchy mạnh
copy bình tĩnh
```

---

## 2. Tech Stack UI

Recommended stack:

```txt
React
Tailwind CSS
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

CSS chỉ dùng để khai báo design tokens và base layer.
Toàn bộ layout/style nên dùng Tailwind utility classes.

---

## 3. Visual Language

## 3.1. Brand Feeling

```txt
Sạch như Apple product
Rõ như finance dashboard
Nhẹ như personal wellness app
Riêng tư như private space
```

## 3.2. UI Mood

```txt
Calm
Minimal
Premium
Human
Trustworthy
Non-judgmental
```

## 3.3. Avoid

```txt
đỏ quá nhiều
gold quá nhiều
gradient lòe loẹt
emoji trong UI chính
shadow quá đậm
chart quá phức tạp
copy gây áp lực
```

---

## 4. Color System

Design dùng nền trắng/xám iOS-like, không dùng dark mode làm default.

## 4.1. Core Tokens

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

## 4.2. Status Tokens

```txt
Blue              #007AFF
Green             #34C759
Orange            #FF9500
Red               #FF3B30
```

## 4.3. Semantic Usage

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

## 5. shadcn CSS Variables

Copy vào `src/index.css` hoặc `app/globals.css`.

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
      -apple-system,
      BlinkMacSystemFont,
      "SF Pro Display",
      "SF Pro Text",
      Inter,
      system-ui,
      sans-serif;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }
}

@layer utilities {
  .apple-shadow {
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
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

## 6. Tailwind Theme Extension

Copy vào `tailwind.config.ts` nếu project đang dùng Tailwind config.

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif"
        ]
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        status: {
          green: "hsl(var(--status-green))",
          orange: "hsl(var(--status-orange))",
          red: "hsl(var(--status-red))",
          blue: "hsl(var(--status-blue))"
        }
      },
      borderRadius: {
        xl: "calc(var(--radius) - 2px)",
        "2xl": "var(--radius)",
        "3xl": "1.75rem",
        card: "1.75rem",
        pill: "999px"
      },
      boxShadow: {
        apple: "0 16px 40px rgba(0, 0, 0, 0.06)",
        soft: "0 8px 24px rgba(0, 0, 0, 0.04)"
      }
    }
  },
  plugins: []
}

export default config
```

---

## 7. Layout System for Web

Web không nên copy mobile 1 cột hoàn toàn.
Web nên dùng layout rộng hơn nhưng vẫn tối giản.

## 7.1. App Shell

Recommended layout:

```txt
Desktop:
Sidebar trái
Main content giữa
Right panel optional

Tablet:
Sidebar collapsed
Main content full

Mobile:
Top header
Single column
Bottom CTA hoặc bottom nav
```

## 7.2. Desktop Grid

Home dashboard desktop:

```txt
┌───────────────────────────────────────────────┐
│ Header: Tình hình nhà mình        Update CTA  │
├───────────────┬───────────────┬───────────────┤
│ Status Card   │ Available     │ Reserve/Debt  │
├───────────────┴───────────────┬───────────────┤
│ Upcoming Payments             │ Assets        │
├───────────────────────────────┴───────────────┤
│ Attention Items / Snapshot History            │
└───────────────────────────────────────────────┘
```

## 7.3. Container

```txt
max-w-screen-2xl
px-6 desktop
px-4 mobile
py-6 desktop
py-4 mobile
```

Tailwind:

```tsx
<div className="min-h-screen bg-background">
  <div className="mx-auto max-w-screen-2xl px-6 py-6">
    ...
  </div>
</div>
```

---

## 8. Typography System

## 8.1. Web Type Scale

```txt
Page Title
text-4xl font-semibold tracking-[-0.045em]

Section Title
text-2xl font-semibold tracking-[-0.035em]

Card Title
text-lg font-semibold

Body
text-sm or text-[15px]

Caption
text-xs or text-[13px] font-medium

Large Money Number
text-6xl font-semibold tracking-[-0.07em]

Medium Money Number
text-3xl font-semibold tracking-[-0.04em]
```

## 8.2. Tailwind Examples

```tsx
<h1 className="text-4xl font-semibold tracking-[-0.045em]">
  Tình hình nhà mình
</h1>

<h2 className="text-2xl font-semibold tracking-[-0.035em]">
  Khoản sắp tới
</h2>

<p className="text-sm text-muted-foreground">
  Cập nhật gần nhất · 05/07/2026
</p>

<p className="text-6xl font-semibold tracking-[-0.07em]">
  24.5
</p>
```

---

## 9. Component Style Rules

## 9.1. Card

Use shadcn `Card`.

Default card style:

```tsx
<Card className="rounded-card border border-border bg-card shadow-soft">
  ...
</Card>
```

Important cards:

```tsx
<Card className="rounded-card border border-border bg-card shadow-apple">
  ...
</Card>
```

Rules:

```txt
Không dùng border quá đậm.
Không dùng shadow nặng.
Không dùng gradient nhiều.
Card title ngắn.
Card content scan được trong 3 giây.
```

---

## 9.2. Button

Primary CTA:

```tsx
<Button className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
  Cập nhật tình hình
</Button>
```

Secondary CTA:

```tsx
<Button variant="secondary" className="rounded-full">
  Xem chi tiết
</Button>
```

Ghost link:

```tsx
<Button variant="ghost" className="text-accent hover:text-accent">
  Xem tất cả
</Button>
```

Avoid button labels:

```txt
Cảnh báo ngay
Kiểm tra đối phương
Phân tích rủi ro
Theo dõi chi tiêu
```

---

## 9.3. Badge / Status Chip

Status “Ổn”:

```tsx
<Badge className="rounded-full bg-status-green/10 text-status-green hover:bg-status-green/10">
  Ổn
</Badge>
```

Status “Cần chú ý”:

```tsx
<Badge className="rounded-full bg-status-orange/10 text-status-orange hover:bg-status-orange/10">
  Cần chú ý
</Badge>
```

Status “Căng”:

```tsx
<Badge className="rounded-full bg-status-red/10 text-status-red hover:bg-status-red/10">
  Căng
</Badge>
```

Status “Chưa đủ dữ liệu”:

```tsx
<Badge variant="secondary" className="rounded-full">
  Chưa đủ dữ liệu
</Badge>
```

---

## 9.4. Input

Use shadcn `Input`.

```tsx
<Input
  className="h-11 rounded-2xl border-border bg-white px-4 shadow-none"
  placeholder="24.500.000"
/>
```

Rules:

```txt
Input cao 44px hoặc 48px.
Radius mềm.
Không dùng border đậm.
Không dùng placeholder dài.
Money input nên có suffix “đ”.
```

---

## 9.5. Select

Use shadcn `Select`.

```tsx
<Select>
  <SelectTrigger className="h-11 rounded-2xl border-border bg-white">
    <SelectValue placeholder="Chọn loại tài sản" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="cash">Tiền mặt</SelectItem>
    <SelectItem value="bank">Tài khoản ngân hàng</SelectItem>
    <SelectItem value="saving">Tiết kiệm</SelectItem>
  </SelectContent>
</Select>
```

---

## 9.6. Table

Table chỉ dùng cho web detail pages, không dùng làm UI chính của Home.

Use cases:

```txt
Danh sách tài sản
Danh sách khoản sắp tới
Lịch sử snapshot
```

Table style:

```tsx
<div className="rounded-card border border-border bg-card shadow-soft">
  <Table>
    ...
  </Table>
</div>
```

Rules:

```txt
Home không dùng table.
Detail page được dùng table.
Amount align right.
Status dùng Badge.
Row action dùng DropdownMenu.
```

---

## 9.7. Dialog / Sheet

Use `Dialog` cho desktop.
Use `Sheet` cho mobile/tablet quick form.

Use cases:

```txt
Cập nhật snapshot
Thêm khoản sắp tới
Thêm tài sản
Chỉnh quyền xem
```

Dialog style:

```tsx
<DialogContent className="rounded-card border-border sm:max-w-xl">
  ...
</DialogContent>
```

Sheet style:

```tsx
<SheetContent className="border-border bg-background">
  ...
</SheetContent>
```

---

## 9.8. Progress

Use for goals/assets.

```tsx
<Progress value={72} className="h-2 rounded-full bg-muted" />
```

Rules:

```txt
Progress bar mỏng.
Không dùng quá nhiều màu.
Không biến dashboard thành analytics app.
```

---

## 10. Core Web Components

## 10.1. AppSidebar

Items:

```txt
Tổng quan
Tài sản
Khoản sắp tới
Mục tiêu
Lịch sử cập nhật
Cài đặt
```

Style:

```txt
width: 260px
background: white hoặc transparent
active item: bg-muted + text-foreground
icon: lucide line icon
```

Example classes:

```tsx
<aside className="hidden h-screen w-[260px] border-r border-border bg-background px-3 py-4 lg:block">
  ...
</aside>
```

---

## 10.2. PageHeader

Content:

```txt
Title
Description
Primary action
Optional metadata
```

Example:

```tsx
<div className="mb-6 flex items-start justify-between gap-4">
  <div>
    <p className="text-sm text-muted-foreground">
      Cập nhật gần nhất · 05/07/2026
    </p>
    <h1 className="mt-1 text-4xl font-semibold tracking-[-0.045em]">
      Tình hình nhà mình
    </h1>
  </div>

  <Button className="rounded-full">
    Cập nhật tình hình
  </Button>
</div>
```

---

## 10.3. StatusCard

Purpose:

```txt
Trả lời “Nhà mình đang ổn không?”
```

Content:

```txt
Label
Status
Status chip
Short explanation
Last updated
```

Example copy:

```txt
Nhà mình đang thế nào?
Ổn
Theo dữ liệu hiện có

Không có khoản quá hạn. Có 2 khoản sắp tới trong 30 ngày cần theo dõi.
```

Style:

```tsx
<Card className="rounded-card border-border bg-card shadow-apple">
  ...
</Card>
```

---

## 10.4. MoneyCard

Purpose:

```txt
Hiển thị tiền có thể dùng ngay.
```

Content:

```txt
Tiền có thể dùng ngay
Tiền mặt + tài khoản
24.5M đ
Breakdown tiền mặt / tài khoản
```

Style rules:

```txt
Money number là điểm nhấn lớn nhất.
Không đặt chart phức tạp trong card này.
Không dùng màu đỏ/orange cho tiền khả dụng nếu không có vấn đề.
```

---

## 10.5. UpcomingPaymentCard

Purpose:

```txt
Hiển thị khoản sắp tới trong 7–30 ngày.
```

Item structure:

```txt
Icon
Tên khoản
Hạn trả
Số tiền
Status badge nếu cần
```

Status:

```txt
Sắp tới → gray/blue
Gần hạn → orange
Quá hạn → red
Đã trả → green
```

---

## 10.6. AssetOverviewCard

Purpose:

```txt
Tóm tắt tài sản dài hạn.
```

Content:

```txt
Total assets
Breakdown:
- Tiết kiệm
- Vàng
- Bất động sản
- Đầu tư
- Bảo hiểm
```

UI:

```txt
Progress bars
Simple list
No pie chart in MVP
```

---

## 10.7. AttentionCard

This replaces “Trao đổi tài chính” in MVP.

Name:

```txt
Khoản cần chú ý
```

Purpose:

```txt
Hiển thị các khoản nên cùng xem lại.
Không phải chat.
Không phải discussion module.
Không phải cảnh báo.
```

Content:

```txt
Tên khoản
Lý do ngắn
Amount
CTA: Xem chi tiết
Optional: Đánh dấu đã xem
```

Example:

```txt
Sửa xe phát sinh
Cao hơn dự kiến trong tháng 7.
4M
```

---

## 11. Web Page Structure

## 11.1. Home / Dashboard

Desktop layout:

```txt
Header full width

Grid:
- StatusCard          span 2
- MoneyCard           span 1
- Reserve/Debt cards  span 1
- UpcomingPayment     span 2
- AssetOverview       span 1
- AttentionCard       span 1
- SnapshotHistory     span 2 optional
```

Tailwind structure:

```tsx
<div className="grid gap-4 lg:grid-cols-12">
  <section className="lg:col-span-7">
    <StatusCard />
  </section>

  <section className="lg:col-span-5">
    <MoneyCard />
  </section>

  <section className="lg:col-span-4">
    <ReserveCard />
  </section>

  <section className="lg:col-span-4">
    <DebtCard />
  </section>

  <section className="lg:col-span-4">
    <AttentionCard />
  </section>

  <section className="lg:col-span-7">
    <UpcomingPaymentCard />
  </section>

  <section className="lg:col-span-5">
    <AssetOverviewCard />
  </section>
</div>
```

---

## 11.2. Assets Page

Purpose:

```txt
Quản lý tiền và tài sản đang nằm ở đâu.
```

Layout:

```txt
Header + Add asset button
Summary cards
Asset table
Filter by type/liquidity/holder
```

Recommended shadcn components:

```txt
Card
Button
Table
Badge
DropdownMenu
Select
Dialog
```

---

## 11.3. Upcoming Payments Page

Purpose:

```txt
Quản lý khoản sắp tới.
```

Layout:

```txt
Header + Add payment button
Tabs: 7 ngày / 30 ngày / Quá hạn / Đã trả
Payment table/list
```

Recommended shadcn components:

```txt
Tabs
Table
Badge
Button
DropdownMenu
Dialog
Calendar
```

---

## 11.4. Goals Page

Purpose:

```txt
Theo dõi mục tiêu tài chính chung.
```

Layout:

```txt
Goal cards
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
```

---

## 11.5. Settings Page

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
```

---

## 12. Responsive Rules

## Desktop

```txt
Use sidebar
Use 12-column grid
Show more detail
Tables allowed
Primary action in header
```

## Tablet

```txt
Sidebar collapsed
Grid 2 columns
Dialogs can become sheets
```

## Mobile Web

```txt
Single column
No table on Home
Use cards/list
Primary CTA can be sticky bottom
```

---

## 13. Copywriting Rules

## 13.1. Voice

```txt
Bình tĩnh
Tôn trọng
Rõ ràng
Không phán xét
Không kiểm soát
```

## 13.2. Preferred Words

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

## 13.3. Avoid Words

```txt
Kiểm soát
Theo dõi đối phương
Truy vết
Đáng ngờ
Cảnh báo nghiêm trọng
Vượt chi
Ai tiêu khoản này?
```

## 13.4. Status Copy

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

## 14. Button Labels

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

## 15. Icon System

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
```

Example:

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5 text-foreground" strokeWidth={1.8} />
</div>
```

---

## 16. MVP UI Rules

Do:

```txt
Home trả lời “nhà mình đang ổn không?”
Hiển thị số tiền lớn, dễ scan.
Có lần cập nhật gần nhất.
Có khoản sắp tới.
Có tài sản/tổng nợ rõ ràng.
Cập nhật snapshot nhanh.
```

Do not:

```txt
Không đưa giao dịch nhỏ lên Home.
Không build module chat/discussion trong MVP.
Không dùng đỏ nếu chỉ là khoản cần chú ý.
Không biến web thành bảng kế toán.
Không hỏi “ai tiêu khoản này?”.
```

---

## 17. Example Home Content

```txt
Tình hình nhà mình
Cập nhật gần nhất · 05/07/2026

Nhà mình đang thế nào?
Ổn
Theo dữ liệu hiện có

Không có khoản quá hạn. Có 2 khoản sắp tới trong 30 ngày cần theo dõi.

Tiền có thể dùng ngay
24.5M đ

Dự phòng
86M

Tổng nợ
18M

Khoản sắp tới
Học phí · Hạn 10/07 · 12M
Tiền nhà · Hạn 15/07 · 8M

Tài sản
320M

Khoản cần chú ý
Sửa xe phát sinh · 4M

Cập nhật tình hình
```

---

## 18. Implementation Class Cheatsheet

Page:

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-6 py-6">
    ...
  </div>
</div>
```

Header:

```tsx
<div className="mb-6 flex items-start justify-between gap-4">
  ...
</div>
```

Card:

```tsx
<Card className="rounded-card border-border bg-card shadow-soft">
  ...
</Card>
```

Important card:

```tsx
<Card className="rounded-card border-border bg-card shadow-apple">
  ...
</Card>
```

Money number:

```tsx
<p className="money-number text-6xl leading-none">
  24.5
</p>
```

Muted text:

```tsx
<p className="text-sm text-muted-foreground">
  Cập nhật gần nhất · 05/07/2026
</p>
```

Primary button:

```tsx
<Button className="rounded-full px-5">
  Cập nhật tình hình
</Button>
```

Soft icon:

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5" strokeWidth={1.8} />
</div>
```

Status badge:

```tsx
<Badge className="rounded-full bg-status-green/10 text-status-green hover:bg-status-green/10">
  Ổn
</Badge>
```

Glass sticky action:

```tsx
<div className="glass-panel fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-full border border-white/60 p-1 shadow-apple">
  <Button className="w-full rounded-full">
    Cập nhật tình hình
  </Button>
</div>
```

---

## 19. Final Product Feel

Money Space trên web phải có cảm giác:

```txt
Một dashboard tài chính riêng tư, sạch và cao cấp
cho couple/family trẻ cùng nhìn tình hình chung.
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
Người dùng mở web lên và hiểu trong 5 giây:
nhà mình đang ổn không,
tiền dùng ngay còn bao nhiêu,
sắp phải trả gì,
có khoản nào cần chú ý.
```

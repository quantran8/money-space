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
```

Premium của sản phẩm đến từ:

```txt
nền sạch
typography rõ
spacing rộng
card gọn nhưng đủ overview
section lớn có sub-section rõ
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
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
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
          "sans-serif",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        status: {
          green: "hsl(var(--status-green))",
          orange: "hsl(var(--status-orange))",
          red: "hsl(var(--status-red))",
          blue: "hsl(var(--status-blue))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) - 2px)",
        "2xl": "var(--radius)",
        "3xl": "1.75rem",
        card: "1.75rem",
        pill: "999px",
      },
      boxShadow: {
        apple: "0 16px 40px rgba(0, 0, 0, 0.06)",
        soft: "0 8px 24px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
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

Home dashboard desktop không nên chia thành quá nhiều card nhỏ.
Cũng không nên gom tất cả vào một card lớn phẳng.

Recommended structure:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Hero Snapshot: Tình hình nhà mình             Update CTA     │
│ Status · Dùng ngay · Sắp trả · Cần bàn                       │
├──────────────────────────────────────────────────────────────┤
│ Tiền nhà mình                                                │
│ ┌──────────────────────────┬───────────────────────────────┐ │
│ │ Thanh khoản              │ Tổng tài sản                   │ │
│ │ Dùng ngay · Dự phòng     │ Tài sản · Nợ                   │ │
│ └──────────────────────────┴───────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Cần chú ý                                                    │
│ ┌──────────────────────────┬───────────────────────────────┐ │
│ │ Sắp trả                  │ Cần bàn                       │ │
│ │ 3 khoản · gần nhất       │ 1 việc                        │ │
│ └──────────────────────────┴───────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Kế hoạch dài hạn                                             │
│ ┌──────────────────────────┬───────────────────────────────┐ │
│ │ Mục tiêu chính           │ Bổ sung                       │ │
│ │ Quỹ dự phòng · 72%       │ Còn thiếu · Tài sản chính     │ │
│ └──────────────────────────┴───────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Gần đây                                                       │
└──────────────────────────────────────────────────────────────┘
```

Rule:

```txt
Section lớn = container theo chủ đề.
Sub-section = nhóm ý nghĩa bên trong.
Metric = số liệu cụ thể.

Không dùng dạng:
Section → nhiều text/value rải ngang.

Nên dùng dạng:
Section → Sub-section → Metric cells.
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
  <div className="mx-auto max-w-screen-2xl px-6 py-6">...</div>
</div>
```

---

## 7.4. Home Information Architecture

Home phải theo nguyên tắc:

```txt
Ít section hơn
Mỗi section đủ overview
Có cấu trúc nội bộ rõ
Detail là optional, không bắt buộc để hiểu tình hình cơ bản
```

Recommended order:

```txt
1. Hero Snapshot
2. Tiền nhà mình
3. Cần chú ý
4. Kế hoạch dài hạn
5. Gần đây
```

Không nên:

```txt
Dùng ngay / Dự phòng / Tài sản / Nợ / Sắp trả / Cần bàn
mỗi thứ là một card riêng nếu làm dashboard bị vụn.
```

Cũng không nên:

```txt
Gom tất cả metric vào một card lớn nhưng không có sub-section.
```

Nên:

```txt
Card lớn có nested blocks:
- Thanh khoản
- Tổng tài sản
- Sắp trả
- Cần bàn
- Mục tiêu chính
- Bổ sung
```

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
Không chia quá nhiều card nhỏ nếu mỗi card chỉ có 1 số.
Không gom nhiều thông tin vào một card lớn phẳng.
Card lớn phải có sub-section, divider, nested block hoặc background nhẹ để tách nhóm.
Metric cùng cấp phải có visual treatment nhất quán.
Không highlight ngẫu nhiên một metric nếu các metric khác cùng cấp không được highlight.
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
  <Table>...</Table>
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
<SheetContent className="border-border bg-background">...</SheetContent>
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

## 9.9. Grouped Summary Section

Use this pattern for Home dashboard sections.

Purpose:

```txt
Giữ dashboard ít card nhưng vẫn đủ overview.
Tạo cấu trúc rõ: section lớn → sub-section → metric.
```

Recommended structure:

```tsx
<Card className="rounded-card border-border bg-card p-6 shadow-soft">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold tracking-[-0.035em]">
        Tiền nhà mình
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dùng ngay đủ tháng này
      </p>
    </div>

    <Button variant="ghost" className="rounded-full text-accent">
      Xem
    </Button>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    <div className="rounded-3xl border border-border bg-muted/50 p-4">
      <p className="text-sm font-medium text-muted-foreground">Thanh khoản</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCell label="Dùng ngay" value="24,5M" />
        <MetricCell label="Dự phòng" value="86M" />
      </div>
    </div>

    <div className="rounded-3xl border border-border bg-muted/50 p-4">
      <p className="text-sm font-medium text-muted-foreground">Tổng tài sản</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCell label="Tài sản" value="374M" />
        <MetricCell label="Nợ" value="18M" />
      </div>
    </div>
  </div>
</Card>
```

Metric cell:

```tsx
function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}
```

Rules:

```txt
MetricCell chỉ chứa label + value + optional tiny hint.
Sub-section mới là nơi giải thích nhóm thông tin.
Không đưa đoạn mô tả dài vào MetricCell.
```

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

  <Button className="rounded-full">Cập nhật tình hình</Button>
</div>
```

---

## 10.3. HeroSnapshot

Purpose:

```txt
Trả lời “Nhà mình đang ổn không?” trong 5 giây.
```

Content:

```txt
Title: Tình hình nhà mình
Status badge: Ổn / Cần chú ý / Căng / Chưa đủ dữ liệu
Last updated: Cập nhật 05/07
Three quick signals:
- Dùng ngay
- Sắp trả
- Cần bàn
Primary CTA: Cập nhật
```

Example copy:

```txt
Cần chú ý · Cập nhật 05/07
Tình hình nhà mình
Dùng ngay 24,5M · Sắp trả 3 khoản · Cần bàn 1 việc
```

Style:

```tsx
<Card className="rounded-card border-border bg-card shadow-apple">...</Card>
```

Rules:

```txt
Hero không cần giải thích dài.
Hero phải cho user biết status + 3 tín hiệu chính.
CTA cập nhật phải dễ thấy nhưng không gây áp lực.
```

---

## 10.4. MoneyOverviewSection

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

Example copy:

```txt
Tiền nhà mình
Dùng ngay đủ tháng này

Thanh khoản
Dùng ngay 24,5M
Dự phòng 86M

Tổng tài sản
Tài sản 374M
Nợ 18M
```

Rules:

```txt
Không tách 4 metric này thành 4 card rời nếu làm dashboard bị vụn.
Không đặt cả 4 metric ngang hàng trong một card phẳng.
Dùng nested blocks hoặc mini-cells để user thấy 2 nhóm: thanh khoản và tổng tài sản.
```

---

## 10.5. AttentionSummarySection

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

Example copy:

```txt
Cần chú ý
Có vài việc nên xem trong tuần này

Sắp trả
3 khoản
Gần nhất: Học phí tháng 7 · 10/07 · 12M

Cần bàn
1 việc
Sửa xe phát sinh
```

Tone:

```txt
Dùng “Cần chú ý”, “Cần bàn”, “Xem”.
Không dùng “Cảnh báo”, “Đáng ngờ”, “Vượt chi”.
```

---

## 10.6. LongTermPlanSection

Name:

```txt
Kế hoạch dài hạn
```

Purpose:

```txt
Cho user thấy mục tiêu và tài sản dài hạn đang đi về đâu.
```

Sub-sections:

```txt
Mục tiêu chính
- Tên mục tiêu
- Tiến độ
- Progress bar

Bổ sung
- Còn thiếu
- Tài sản chính
```

Example copy:

```txt
Kế hoạch dài hạn
Mục tiêu chính đang tiến triển tốt

Mục tiêu chính
Quỹ dự phòng
72%

Bổ sung
Còn thiếu 34M
Tài sản chính: Vàng, Đầu tư
```

Rules:

```txt
Progress bar là visual chính.
Không dùng chart phức tạp trong MVP.
Không tách “Còn thiếu” và “Tài sản chính” thành card lớn riêng nếu chỉ có 1 dòng thông tin.
```

---

## 10.7. RecentUpdateCard

Name:

```txt
Gần đây
```

Purpose:

```txt
Cho biết dữ liệu có còn mới không và ai vừa cập nhật gì.
```

Content:

```txt
Lần cập nhật gần nhất
Người cập nhật
Thay đổi chính nếu có
CTA: Xem
```

Example:

```txt
Gần đây
Minh cập nhật khoản học phí · 2 giờ trước
```

Rules:

```txt
Đây là card phụ, đặt cuối Home.
Không để history chiếm nhiều diện tích hơn overview.
```

## 11. Web Page Structure

## 11.1. Home / Dashboard

Home dashboard phải ưu tiên overview đủ hiểu, không bắt user bấm detail để hiểu tình hình cơ bản.

Information hierarchy:

```txt
1. Hero Snapshot
2. Tiền nhà mình
3. Cần chú ý
4. Kế hoạch dài hạn
5. Gần đây
```

Desktop layout:

```txt
Hero Snapshot full width / wide card
Quick Update card optional on right

Tiền nhà mình
- Thanh khoản: Dùng ngay · Dự phòng
- Tổng tài sản: Tài sản · Nợ

Cần chú ý
- Sắp trả: số khoản · gần nhất · hạn · số tiền
- Cần bàn: số việc · chủ đề gần nhất

Kế hoạch dài hạn
- Mục tiêu chính: tên · tiến độ · progress
- Bổ sung: còn thiếu · tài sản chính

Gần đây
- cập nhật gần nhất
```

Tailwind structure:

```tsx
<div className="space-y-5">
  <section className="grid gap-4 xl:grid-cols-[1fr_280px]">
    <HeroSnapshot />
    <QuickUpdateCard />
  </section>

  <MoneyOverviewSection />
  <AttentionSummarySection />
  <LongTermPlanSection />
  <RecentUpdateCard />
</div>
```

Grouped section structure:

```tsx
<Card className="rounded-card border-border bg-card p-6 shadow-soft">
  <SectionHeader title="Tiền nhà mình" hint="Dùng ngay đủ tháng này" />

  <div className="grid gap-4 md:grid-cols-2">
    <SubSection title="Thanh khoản">
      <MetricCell label="Dùng ngay" value="24,5M" />
      <MetricCell label="Dự phòng" value="86M" />
    </SubSection>

    <SubSection title="Tổng tài sản">
      <MetricCell label="Tài sản" value="374M" />
      <MetricCell label="Nợ" value="18M" />
    </SubSection>
  </div>
</Card>
```

Mobile layout:

```txt
1. Hero Snapshot
2. Quick Update CTA
3. Tiền nhà mình
   - Thanh khoản
   - Tổng tài sản
4. Cần chú ý
   - Sắp trả
   - Cần bàn
5. Kế hoạch dài hạn
6. Gần đây
```

Rules:

```txt
Không quay lại layout quá nhiều card nhỏ.
Không dùng card lớn phẳng chỉ rải text/value ngang hàng.
Mỗi section lớn phải có sub-section rõ ràng.
Detail chỉ để xem breakdown, lịch sử, note hoặc chỉnh sửa.
```

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
Dùng ít section hơn nhưng mỗi section đủ overview.
Section lớn phải có sub-section rõ ràng.
Có lần cập nhật gần nhất.
Có khoản sắp tới.
Có tài sản/tổng nợ rõ ràng.
Cập nhật snapshot nhanh.
```

Do not:

```txt
Không đưa giao dịch nhỏ lên Home.
Không chia quá nhiều card nhỏ chỉ để hiển thị từng chỉ số.
Không gom nhiều thông tin vào một card lớn phẳng không có sub-section.
Không build module chat/discussion trong MVP.
Không dùng đỏ nếu chỉ là khoản cần chú ý.
Không biến web thành bảng kế toán.
Không hỏi “ai tiêu khoản này?”.
```

---

## 17. Example Home Content

```txt
Tình hình nhà mình
Cần chú ý · Cập nhật 05/07

Dùng ngay
24,5M

Sắp trả
3 khoản

Cần bàn
1 việc

[Cập nhật]
```

```txt
Tiền nhà mình
Dùng ngay đủ tháng này

Thanh khoản
Dùng ngay: 24,5M
Dự phòng: 86M

Tổng tài sản
Tài sản: 374M
Nợ: 18M

[Xem]
```

```txt
Cần chú ý
Có vài việc nên xem trong tuần này

Sắp trả
3 khoản
Gần nhất: Học phí tháng 7 · 10/07 · 12M

Cần bàn
1 việc
Sửa xe phát sinh

[Xem]
```

```txt
Kế hoạch dài hạn
Mục tiêu chính đang tiến triển tốt

Mục tiêu chính
Quỹ dự phòng
72%

Bổ sung
Còn thiếu: 34M
Tài sản chính: Vàng, Đầu tư

[Xem]
```

```txt
Gần đây
Minh cập nhật khoản học phí · 2 giờ trước

[Xem]
```

## 18. Implementation Class Cheatsheet

Page:

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-6 py-6">...</div>
</div>
```

Header:

```tsx
<div className="mb-6 flex items-start justify-between gap-4">...</div>
```

Card:

```tsx
<Card className="rounded-card border-border bg-card shadow-soft">...</Card>
```

Important card:

```tsx
<Card className="rounded-card border-border bg-card shadow-apple">...</Card>
```

Money number:

```tsx
<p className="money-number text-6xl leading-none">24.5</p>
```

Muted text:

```tsx
<p className="text-sm text-muted-foreground">Cập nhật gần nhất · 05/07/2026</p>
```

Primary button:

```tsx
<Button className="rounded-full px-5">Cập nhật tình hình</Button>
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
  <Button className="w-full rounded-full">Cập nhật tình hình</Button>
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
Người dùng mở web lên và hiểu trong 5–10 giây:
nhà mình đang ổn không,
tiền dùng ngay còn bao nhiêu,
sắp phải trả gì,
có khoản nào cần chú ý,
kế hoạch dài hạn đang tiến triển thế nào.

User không cần bấm detail để hiểu overview cơ bản.
Detail chỉ dùng để xem breakdown, lịch sử, note hoặc chỉnh sửa.
```

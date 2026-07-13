# Money Space — Apple-like Product & Web Design System

> Version 2.0 — implementation-ready guideline.  
> Product type: consumer-grade family finance dashboard with focused management pages.  
> Primary goal: help a couple or family understand their shared financial situation in 5–10 seconds without creating a feeling of surveillance, judgment, or accounting complexity.

---

## 0. Document Status

This document is the source of truth for:

```txt
Product principles
Information architecture
Visual foundations
Interaction behavior
Accessibility
Privacy communication
Financial status logic
Responsive behavior
Core UI components
Home and management-page patterns
Implementation acceptance criteria
```

When a design decision conflicts with a component example, use the principles in this order:

```txt
1. User trust and privacy clarity
2. Information comprehension
3. Accessibility and interaction safety
4. Product hierarchy
5. Visual consistency
6. Decorative preference
```

“Apple-like” in this document means:

```txt
Content-first
Calm and direct
Few meaningful surfaces
Strong hierarchy
Progressive disclosure
Immediate feedback
Predictable interaction
Accessible by default
Premium through restraint
```

It does not mean copying Apple screens, using excessive blur, or making every element a rounded card.

---

## 1. Product Design Direction

Money Space is a shared financial snapshot for young couples and families.

The core question of Home is:

> “Nhà mình đang ổn không?”

### 1.1. Product promise

```txt
See the shared situation quickly.
Understand what can be used now.
Know what is due soon.
Notice what requires a conversation.
See whether long-term goals are progressing.
```

### 1.2. Design direction

```txt
Apple-like product thinking
White-first premium
Calm finance
Consumer-grade overview
Clean management tools when needed
Glanceable information hierarchy
Fewer, richer sections
Private, not controlling
Web-first, fully responsive
```

### 1.3. Do not design Money Space like

```txt
A household accounting system
A traditional expense tracker
A dense BI dashboard
An enterprise banking portal
A tool for monitoring a partner
A marketing landing page
An ecommerce admin dashboard
A social feed or heavy chat app
```

### 1.4. Premium comes from

```txt
Clean background
Clear typography
Generous but purposeful spacing
Few surface layers
Strong section structure
Lists that scan quickly
Restrained color
Minimal decorative icons
Calm, non-judgmental copy
Polished transitions and feedback
```

### 1.5. Five-second Home test

A user should understand, without opening a detail page:

```txt
Is the household currently stable?
How much is available now?
What must be paid soon?
Is there anything to discuss?
How is the main long-term goal progressing?
How fresh is the data?
```

---

## 2. Apple-like Product Principles

## 2.1. Content first

The interface should make important content visually dominant. Decoration must not compete with status, money values, dates, or actions.

```txt
Primary information  → status, amount, due date, progress, data freshness
Secondary information → owner, visibility, note, category
Decoration            → subtle icon, border, tint, motion
```

Rule:

```txt
If removing a visual element does not reduce understanding or interaction confidence, remove it.
```

## 2.2. Surface hierarchy: maximum two real surfaces

A surface is any block that visually separates itself through background, border, elevation, or strong radius.

Recommended hierarchy:

```txt
Page background        #F5F5F7
Section surface        #FFFFFF
Grouped surface        #F2F2F7 or #FFFFFF with a subtle border
Row / metric content   transparent by default
```

Good:

```txt
Page → Section surface → Grouped surface → transparent row
Page → Section surface → metric content with dividers
Page → Grouped white list → rows
```

Avoid:

```txt
Page → Card → Soft card → White mini-card → Inner control card
Card → Card → Card
A shadow on every child item
A separate white tile for every small number
```

Implementation rule:

```txt
A section may contain at most two visually distinct surface layers.
Rows inside a grouped list are transparent and separated with spacing or dividers.
Metric items inside a grouped surface do not create another background.
Use elevation only for the primary hero, floating dialogs, and sticky controls.
```

## 2.3. Progressive disclosure

Home shows the answer and the next action, not the full dataset.

```txt
Home        = status + preview + next action
Detail page = breakdown + filters + history + edit
Dialog/Sheet = focused creation or update flow
```

Each Home section answers one question:

```txt
Hero              → Nhà mình đang ổn không?
Tiền nhà mình     → Hiện có bao nhiêu tiền và tài sản?
Cần chú ý         → Có gì cần xem trong thời gian gần?
Kế hoạch dài hạn  → Mục tiêu chính đang tiến triển thế nào?
Gần đây           → Dữ liệu có còn mới không?
```

## 2.4. List-first for repeated information

Use this decision tree:

```txt
Exactly 2 large conceptual groups
→ Use a two-column grouped layout on desktop and one column on mobile.

3–6 items of the same type
→ Use a grouped list.

More than 6 items
→ Show the 3 most relevant items, “+N mục khác”, and “Xem tất cả”.

Mixed item types
→ Separate with small headings inside one grouped surface.

Data requires sorting, comparison, or bulk action
→ Move it to a management page and use a table or dense list.
```

Do not render repeated records as equal-sized cards when a list communicates the same content more clearly.

## 2.5. Direct and predictable interaction

Every interactive element should clearly communicate:

```txt
What can be clicked
What will happen
What changed after the action
How to recover from a mistake
```

Rules:

```txt
Rows that navigate include a chevron or clear action label.
Buttons use verbs that describe the result.
Saving provides immediate success or error feedback.
Destructive actions require confirmation and explain the consequence.
Actions hidden in a menu must also be keyboard accessible.
Hover is enhancement, never the only interaction signal.
```

## 2.6. Feedback and system status

The interface must never appear frozen or ambiguous.

Required states:

```txt
Idle
Hover
Focus-visible
Pressed
Loading
Success
Error
Disabled
Empty
Partial data
Offline or failed refresh when relevant
```

Examples:

```txt
“Đang lưu…” while updating a snapshot.
“Đã cập nhật tình hình” after success.
“Chưa thể lưu. Dữ liệu của bạn vẫn chưa thay đổi.” after failure.
Skeleton only when layout is known; otherwise use a concise loading message.
```

## 2.7. Forgiveness and reversibility

```txt
Use undo for reversible list actions when practical.
Do not silently discard unsaved form changes.
Explain destructive outcomes before confirmation.
Keep cancel actions available in dialogs and sheets.
Preserve entered data after recoverable validation errors.
```

## 2.8. Consistency without uniform density

Visual language stays consistent, while density changes by task.

```txt
Overview pages    → spacious, low density, large numbers
Management pages  → compact, scannable, sortable
Forms             → grouped fields and explicit labels
Settings          → row-based, descriptive, predictable
```

Do not use a large marketing hero on management pages.

## 2.9. Privacy clarity beats prettiness

Every sensitive item must make these questions answerable:

```txt
Who owns or manages it?
Who can see it?
What level of detail is shared?
When was it last updated?
Does it contribute to the household summary?
```

Visibility labels:

```txt
Hiện đầy đủ      → amount and details are shared
Chỉ hiện số tổng → contributes to totals; item details remain hidden
Hiện theo nhóm   → visible as a grouped category
Riêng tư         → excluded unless aggregate sharing is explicitly enabled
```

Never use icon-only privacy indicators. Icons may support text but never replace it.

## 2.10. Accessibility is a product principle

Accessibility is not a final QA step. It is part of every component contract.

Minimum requirements:

```txt
WCAG AA contrast for normal text and controls
Visible keyboard focus
Logical focus order
44×44px minimum target where practical
No information communicated by color alone
Reduced-motion support
Semantic headings, lists, tables, labels, and dialogs
Screen-reader-friendly money and status text
Error messages connected to their fields
```

---

## 3. Financial Status and Trust Model

A beautiful status label is harmful if users cannot understand why it exists. All household health conclusions must be explainable.

## 3.1. Minimum status inputs

MVP status may use:

```txt
available_now          Money that can be used immediately
mandatory_due_7d       Mandatory payments due in 7 days
mandatory_due_30d      Mandatory payments due in 30 days
overdue_amount         Confirmed overdue amount
open_decisions         Important unresolved discussions
data_age_days           Days since the latest valid snapshot
shared_data_coverage    Whether required household data is included
```

## 3.2. Default MVP status rules

These are default product rules and should remain configurable.

```txt
CHƯA ĐỦ DỮ LIỆU
- No valid snapshot, or
- Required fields are missing, or
- Data is older than 30 days, or
- Shared-data coverage is insufficient to make a household conclusion.

CĂNG
- There is an overdue mandatory payment, or
- available_now < mandatory_due_7d.

CẦN CHÚ Ý
- available_now is enough for 7 days but less than mandatory_due_30d, or
- There is an important unresolved decision, or
- Data is 8–30 days old.

ỔN
- available_now >= mandatory_due_30d,
- No overdue mandatory payment,
- Required shared data is available,
- Data is no older than 7 days.
```

Status priority:

```txt
Chưa đủ dữ liệu → Căng → Cần chú ý → Ổn
```

A privacy-related lack of data must not be interpreted as financial instability.

## 3.3. Explain every status

The status UI must include a short reason:

```txt
Ổn
“Tiền dùng ngay đang đủ cho các khoản bắt buộc trong 30 ngày tới.”

Cần chú ý
“Có 3 khoản sắp tới; tiền dùng ngay chưa bao phủ toàn bộ 30 ngày.”

Căng
“Có khoản quá hạn hoặc tiền dùng ngay chưa đủ cho 7 ngày tới.”

Chưa đủ dữ liệu
“Cần cập nhật thêm dữ liệu để đánh giá tình hình.”
```

Use “Theo dữ liệu được chia sẻ” when private or hidden data may affect completeness.

## 3.4. Data freshness

```txt
0–7 days    → Mới cập nhật
8–30 days   → Nên cập nhật
More than 30 days → Dữ liệu đã cũ; do not show a definitive health status
```

Display an absolute date in detail contexts:

```txt
Cập nhật gần nhất · 05/07/2026
```

Relative time may supplement it:

```txt
2 giờ trước · 05/07/2026
```

## 3.5. Privacy-aware aggregation

Rules:

```txt
Private items do not contribute to household totals by default.
“Chỉ hiện số tổng” may contribute to aggregate totals without exposing details.
The UI must state when totals are based only on shared data.
A member must never infer another member’s private item value from subtotals.
Permission changes must describe how totals and status will be affected.
```

---

## 4. Information Architecture

## 4.1. Main navigation

```txt
Tổng quan
Tài sản
Khoản sắp tới
Mục tiêu
Trao đổi
Lịch sử cập nhật
Thành viên
Cài đặt
```

## 4.2. Page types and density

### Overview density

```txt
Home
Goal overview
Privacy introduction
Empty states
```

Characteristics:

```txt
More whitespace
Large status and money values
Two or three preview items
One primary action
Minimal controls
```

### Management density

```txt
Assets
Upcoming payments
Snapshot history
Discussion list
Members and permissions
```

Characteristics:

```txt
Compact header
Summary strip
Search, filter, or tabs
Grouped list or table
Visible row actions
Bulk behavior only when genuinely needed
```

### Form density

```txt
Update snapshot
Add asset
Add payment
Add goal
Permission editor
```

Characteristics:

```txt
Explicit labels
Short helper text
Grouped related fields
Clear validation
One primary submit action
```

## 4.3. Common management-page structure

```tsx
<div className="space-y-5">
  <PageHeader
    title="Tài sản"
    description="Tiền và tài sản nhà mình đang nằm ở đâu"
    action={<Button>Thêm tài sản</Button>}
  />
  <SummaryStrip />
  <Toolbar />
  <DataListOrTable />
</div>
```

A management page should feel like a dependable tool, not a landing page.

---

## 5. Visual Language

## 5.1. Brand feeling

```txt
Clean like a premium consumer product
Clear like a finance tool
Light like a wellness experience
Private like a trusted household space
```

## 5.2. Mood

```txt
Calm
Minimal
Premium
Human
Trustworthy
Non-judgmental
```

## 5.3. Avoid

```txt
Large red backgrounds
Excessive gold
Decorative gradients
Emoji in primary UI
Heavy shadows
Complex charts without a decision purpose
Copy that creates fear or guilt
Repeated mini-cards
Deeply nested surfaces
Strong borders used as hierarchy
Blur everywhere
```

---

## 6. Color System

## 6.1. Core colors

| Token | Hex | Usage |
|---|---:|---|
| Background | `#F5F5F7` | App canvas |
| Surface | `#FFFFFF` | Section and list surfaces |
| Surface Soft | `#F2F2F7` | Grouping, inactive areas |
| Ink | `#1D1D1F` | Primary text |
| Secondary Text | `#6E6E73` | Supporting text |
| Tertiary Text | `#A1A1A6` | Low-priority metadata; avoid for essential information |
| Border | `#E5E5EA` | Subtle separation |

## 6.2. Semantic colors

| Token | Hex | Meaning |
|---|---:|---|
| Blue | `#007AFF` | Links, selection, focus, secondary navigation |
| Green | `#34C759` | Stable or completed |
| Orange | `#FF9500` | Attention or approaching due date |
| Red | `#FF3B30` | Overdue, destructive, or clearly insufficient |

## 6.3. Semantic rules

```txt
Green  → stable, complete, on track
Orange → needs attention, near due, stale-but-usable data
Red    → overdue, destructive action, critical insufficiency
Blue   → link, selected state, focus, secondary navigation
Black  → primary CTA
Gray   → metadata, inactive state, grouping
```

Never rely on color alone. Pair color with text, icon, shape, or position.

Red is reserved for real severity. Do not use it for a normal upcoming payment.

---

## 7. Tailwind v4 and shadcn Tokens

Use one source of truth. The HSL values below match the published hex values.

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 240 11.1% 96.5%;
    --foreground: 240 3.3% 11.8%;

    --card: 0 0% 100%;
    --card-foreground: 240 3.3% 11.8%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 3.3% 11.8%;

    --primary: 240 3.3% 11.8%;
    --primary-foreground: 0 0% 100%;

    --secondary: 240 23.8% 95.9%;
    --secondary-foreground: 240 3.3% 11.8%;

    --muted: 240 23.8% 95.9%;
    --muted-foreground: 240 2.2% 44.1%;

    --accent: 211.3 100% 50%;
    --accent-foreground: 0 0% 100%;

    --destructive: 3.2 100% 59.4%;
    --destructive-foreground: 0 0% 100%;

    --border: 240 10.6% 90.8%;
    --input: 240 10.6% 90.8%;
    --ring: 211.3 100% 50%;

    --status-green: 135.1 58.6% 49.2%;
    --status-orange: 35.1 100% 50%;
    --status-red: 3.2 100% 59.4%;
    --status-blue: 211.3 100% 50%;

    --radius: 1rem;
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
      "Segoe UI",
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

  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
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

  --radius-sm: calc(var(--radius) - 6px);
  --radius-md: calc(var(--radius) - 4px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer utilities {
  .apple-shadow {
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.02),
      0 16px 40px rgba(0, 0, 0, 0.055);
  }

  .apple-shadow-soft {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .money-number {
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.035em;
    font-weight: 600;
  }

  .page-title {
    letter-spacing: -0.035em;
  }

  .section-title {
    letter-spacing: -0.025em;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Tailwind Usage Rules

## 8.1. Radius hierarchy

Use radius to communicate containment, not as decoration.

```txt
Section / hero        → rounded-[24px] to rounded-[28px]
Grouped surface       → rounded-2xl or rounded-[20px]
Input / select        → rounded-xl or rounded-2xl
List row inside group → no independent radius by default
Button                → rounded-full for compact primary actions; rounded-xl for utility actions
Badge / avatar        → rounded-full
```

Avoid making every row, icon, input, card, and button equally rounded.

## 8.2. Shadow hierarchy

```txt
Normal section      → border only or very soft shadow
Primary hero        → apple-shadow
Dialog / popover    → shadcn elevation or apple-shadow-soft
Sticky glass action → glass-panel + apple-shadow-soft
```

Do not use:

```txt
shadow-xl
shadow-2xl
shadow-black/20
Heavy elevation on repeated rows
```

## 8.3. Status color classes

Use explicit HSLA for status tints:

```tsx
<Badge className="rounded-full bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] hover:bg-[hsla(var(--status-orange),0.12)]">
  Cần chú ý
</Badge>
```

## 8.4. Canonical class map

| Avoid | Use |
|---|---|
| `rounded-card` | section component default |
| `rounded-pill` | `rounded-full` |
| `shadow-apple` | `apple-shadow` |
| `bg-status-green/10` | `bg-[hsla(var(--status-green),0.12)]` |
| `text-status-green` | `text-[hsl(var(--status-green))]` |
| `tracking-[-0.07em]` | `money-number` or `tracking-[-0.035em]` |
| white card per row | transparent row + divider |

---

## 9. Layout System

## 9.1. App shell

```txt
Desktop
- Left sidebar
- Main content
- Optional right utility panel only for a genuinely separate task

Tablet
- Collapsed sidebar or top navigation
- Main content full width

Mobile
- Top header
- Single column
- Bottom navigation or one sticky primary action, not both competing
```

## 9.2. Container

```tsx
<div className="min-h-screen bg-background text-foreground">
  <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
    {/* page */}
  </div>
</div>
```

## 9.3. Desktop Home structure

```txt
┌──────────────────────────────────────────────────────────┐
│ Hero Snapshot: Tình hình nhà mình         Primary CTA    │
│ Status · reason · updated date                            │
│ Dùng ngay · Sắp trả · Cần bàn                            │
├──────────────────────────────────────────────────────────┤
│ Tiền nhà mình                                            │
│ Thanh khoản                    Tổng tài sản              │
├──────────────────────────────────────────────────────────┤
│ Cần chú ý                                                │
│ Sắp trả list                   Cần bàn preview            │
├──────────────────────────────────────────────────────────┤
│ Kế hoạch dài hạn                                         │
│ Main goal progress              Supporting list          │
├──────────────────────────────────────────────────────────┤
│ Gần đây                                                   │
└──────────────────────────────────────────────────────────┘
```

## 9.4. Home order

```txt
1. Hero Snapshot
2. Tiền nhà mình
3. Cần chú ý
4. Kế hoạch dài hạn
5. Gần đây
```

Quick Update should not appear as a second large competing card beside the Hero. Use one of these patterns:

```txt
Preferred: primary CTA inside Hero
Alternative: compact sticky action on mobile
Alternative: small utility action in page header
```

---

## 10. Typography

## 10.1. Type scale

```txt
Page title
text-4xl md:text-5xl font-semibold tracking-[-0.035em]

Section title
text-xl md:text-2xl font-semibold tracking-[-0.025em]

Card / group title
text-lg font-semibold tracking-[-0.015em]

Body
text-sm or text-[15px] leading-6

Caption
text-xs or text-[13px] font-medium

Large money
text-5xl md:text-6xl money-number leading-none

Medium money
text-2xl md:text-3xl money-number
```

Do not use very tight tracking for Vietnamese text or long monetary values. Test with the system-font fallback on Windows and Android.

## 10.2. Money formatting

```txt
Preferred: 24,5M đ
Preferred: 24,5 triệu
Preferred: 374M đ
Avoid: 24,5M without a unit
Avoid in Hero: 24.500.000đ when it reduces scan speed
```

Use tabular numerals for tables and aligned metric groups.

For assistive technology, provide a readable label when abbreviating:

```tsx
<span aria-label="24 triệu 500 nghìn đồng">24,5M đ</span>
```

---

## 11. Interaction and Motion

## 11.1. Motion principles

Motion should explain continuity, not decorate the interface.

```txt
Fast feedback     → 120–180ms
Standard change   → 180–240ms
Sheet / dialog    → 220–300ms
```

Use ease-out for entering and ease-in for exiting. Avoid springy or playful motion in critical finance flows.

Allowed uses:

```txt
Row hover tint
Button press feedback
Dialog and sheet transition
Accordion expansion
Progress update
Success confirmation
```

Avoid:

```txt
Large parallax
Continuous floating animation
Animated gradients
Number counters that delay comprehension
Motion that obscures final values
```

## 11.2. Loading

```txt
Use skeletons for known repeated layouts.
Use a compact spinner only for short local actions.
Disable duplicate submission while saving.
Keep existing data visible during background refresh.
Do not replace a stable page with a full-screen loader for a small update.
```

## 11.3. Validation and errors

```txt
Validate on blur or submit; avoid noisy validation on every keystroke.
Place the error next to the affected field.
Keep the user’s entered value.
Explain how to fix the problem.
Use a top-level summary only when multiple errors exist.
```

---

## 12. Accessibility Requirements

## 12.1. Keyboard

```txt
All actions are reachable by Tab.
Focus order follows visual order.
Escape closes dismissible dialogs and menus.
Enter/Space activates buttons and selectable rows.
Focus returns to the trigger after a dialog closes.
```

## 12.2. Touch and pointer

```txt
Primary targets should be at least 44×44px.
Dense table controls may be visually smaller but need adequate clickable padding.
Do not place two destructive or high-impact actions too close together.
```

## 12.3. Contrast

```txt
Normal text: WCAG AA minimum.
Large text: WCAG AA minimum.
Focus indicators must remain visible on white and gray surfaces.
Tertiary text cannot carry essential information.
Status tint backgrounds must be tested with actual foreground colors.
```

## 12.4. Semantics

```txt
Use one h1 per page.
Section titles follow heading order.
Use table markup for comparative tabular data.
Use list markup for repeated rows when appropriate.
Inputs always have visible labels.
Dialog and Sheet include accessible title and description.
Icons without text require accessible names; decorative icons are aria-hidden.
```

## 12.5. Status and money

```txt
Do not announce “green” or “orange”; announce the status meaning.
Abbreviated values need readable labels when context is not sufficient.
Progress includes text such as “72% hoàn thành”.
Privacy labels are exposed as text.
```

---

## 13. Core Component Patterns

## 13.1. Section Header

```tsx
import { Button } from "@/components/ui/button";

function SectionHeader({
  title,
  hint,
  action,
  onAction,
}: {
  title: string;
  hint?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="section-title text-xl font-semibold md:text-2xl">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>

      {action ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onAction}
          className="min-h-11 shrink-0 rounded-full px-3 text-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]"
        >
          {action}
        </Button>
      ) : null}
    </div>
  );
}
```

Rules:

```txt
Title is short.
Hint is calm and informative.
Action is “Xem”, “Xem tất cả”, or “Cập nhật”.
Do not show an action when the entire section is already the destination.
```

## 13.2. Section Card

```tsx
<Card className="rounded-[26px] border-border/80 p-5 shadow-none md:p-6">
  {/* section content */}
</Card>
```

Primary hero:

```tsx
<Card className="apple-shadow rounded-[28px] border-border/70 p-6 md:p-7">
  {/* hero content */}
</Card>
```

## 13.3. Grouped Surface

Use for a meaningful subgroup, not to create another dashboard card.

```tsx
function GroupedSurface({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted">
      {title ? (
        <div className="px-4 pb-2 pt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
      ) : null}
      {children}
    </div>
  );
}
```

A section should normally contain no more than two large grouped surfaces on desktop.

## 13.4. Metric Item

Metric items inside a grouped surface are content, not a third surface.

```tsx
function MetricItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="money-number mt-1.5 text-2xl">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
```

Two-metric group:

```tsx
<GroupedSurface title="Thanh khoản">
  <div className="grid grid-cols-2 divide-x divide-border/80">
    <MetricItem label="Dùng ngay" value="24,5M đ" />
    <MetricItem label="Dự phòng" value="86M đ" />
  </div>
</GroupedSurface>
```

## 13.5. Grouped List and List Row

Rows are transparent inside one shared surface.

```tsx
import { ChevronRight } from "lucide-react";

function ListRow({
  eyebrow,
  title,
  meta,
  value,
  actionLabel,
  onClick,
}: {
  eyebrow?: string;
  title: string;
  meta?: string;
  value?: string;
  actionLabel?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.025] focus-visible:relative focus-visible:z-10"
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">
          {title}
        </p>
        {meta ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{meta}</p>
        ) : null}
      </div>

      {value ? <p className="shrink-0 text-sm font-semibold">{value}</p> : null}
      {actionLabel ? (
        <span className="shrink-0 text-sm font-medium text-[hsl(var(--accent))]">
          {actionLabel}
        </span>
      ) : null}
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </button>
  );
}
```

Wrapper:

```tsx
<div className="overflow-hidden rounded-2xl border border-border/80 bg-card divide-y divide-border/70">
  <ListRow title="Học phí tháng 7" meta="10/07 · 12M đ" />
  <ListRow title="Tiền nhà" meta="15/07" />
  <ListRow title="Bảo hiểm xe" meta="22/07" />
</div>
```

Rules:

```txt
Default for payments, discussions, history, assets preview, and settings.
No individual row shadow.
No independent white mini-card around each row.
Use a chevron only when navigation occurs.
Use a switch, checkbox, or menu when that is the real action.
```

## 13.6. Status Badge

```tsx
function StatusBadge({ status }: { status: "stable" | "attention" | "critical" | "unknown" }) {
  const styles = {
    stable:
      "bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))]",
    attention:
      "bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]",
    critical:
      "bg-[hsla(var(--status-red),0.10)] text-[hsl(var(--status-red))]",
    unknown: "bg-muted text-muted-foreground",
  };

  const labels = {
    stable: "Ổn",
    attention: "Cần chú ý",
    critical: "Căng",
    unknown: "Chưa đủ dữ liệu",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
```

## 13.7. Summary Strip

Use on management pages for 2–4 compact totals.

```tsx
<div className="overflow-hidden rounded-2xl border bg-card">
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
    <MetricItem label="Tổng tài sản" value="374M đ" />
    <MetricItem label="Dùng ngay" value="24,5M đ" />
    <MetricItem label="Dài hạn" value="263M đ" />
    <MetricItem label="Nợ" value="18M đ" />
  </div>
</div>
```

## 13.8. Empty State

```tsx
<div className="rounded-[26px] border border-dashed bg-card px-6 py-12 text-center">
  <h2 className="text-xl font-semibold tracking-[-0.02em]">
    Chưa có khoản sắp tới
  </h2>
  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
    Thêm các khoản cần trả để nhà mình chủ động hơn trong những tuần tới.
  </p>
  <Button className="mt-5 min-h-11 rounded-full px-5">Thêm khoản</Button>
</div>
```

Do not make empty states overly celebratory or use large decorative illustrations by default.

---

## 14. Home Page Components

## 14.1. App Sidebar

Items:

```txt
Tổng quan
Tài sản
Khoản sắp tới
Mục tiêu
Trao đổi
Lịch sử cập nhật
Thành viên
Cài đặt
```

Style:

```txt
Width: 248–260px
Background: transparent or subtly white
Active item: muted background + foreground text
Icons: lucide line icons, 1.75–2 stroke
Labels remain visible on desktop
```

```tsx
<aside className="hidden h-screen w-[256px] border-r border-border/70 bg-background px-3 py-4 lg:block">
  {/* navigation */}
</aside>
```

## 14.2. Hero Snapshot

Purpose:

```txt
Answer “Nhà mình đang ổn không?” in five seconds.
```

Required content:

```txt
Status badge
Status reason
Last updated date
Page title
Dùng ngay
Sắp trả
Cần bàn
One primary CTA
```

```tsx
<Card className="apple-shadow rounded-[28px] overflow-hidden border-border/70 p-6 md:p-7">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status="attention" />
        <span className="text-sm text-muted-foreground">
          Cập nhật 05/07/2026
        </span>
      </div>

      <h1 className="page-title mt-5 max-w-2xl text-4xl font-semibold md:text-5xl">
        Tình hình nhà mình
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
        Có 3 khoản sắp tới; tiền dùng ngay chưa bao phủ toàn bộ 30 ngày.
      </p>
    </div>

    <Button className="min-h-11 shrink-0 rounded-full px-5">
      Cập nhật tình hình
    </Button>
  </div>

  <div className="mt-7 overflow-hidden rounded-2xl border border-border/80 bg-muted">
    <div className="grid md:grid-cols-3 md:divide-x divide-border/80">
      <div className="border-b border-border/80 md:border-b-0">
        <MetricItem label="Dùng ngay" value="24,5M đ" />
      </div>
      <div className="border-b border-border/80 md:border-b-0">
        <MetricItem label="Sắp trả" value="3 khoản" />
      </div>
      <MetricItem label="Cần bàn" value="1 việc" />
    </div>
  </div>
</Card>
```

Rules:

```txt
No chart in the MVP Hero.
No long explanation.
No second large Quick Update card competing with the CTA.
Status must include a reason and freshness.
```

## 14.3. Money Overview Section

Name:

```txt
Tiền nhà mình
```

Pattern: two meaningful groups, no nested metric cards.

```tsx
<Card className="rounded-[26px] border-border/80 p-5 shadow-none md:p-6">
  <SectionHeader title="Tiền nhà mình" hint="Theo dữ liệu được chia sẻ" action="Xem" />

  <div className="grid gap-4 md:grid-cols-2">
    <GroupedSurface title="Thanh khoản">
      <div className="grid grid-cols-2 divide-x divide-border/80">
        <MetricItem label="Dùng ngay" value="24,5M đ" />
        <MetricItem label="Dự phòng" value="86M đ" />
      </div>
    </GroupedSurface>

    <GroupedSurface title="Tổng tài sản">
      <div className="grid grid-cols-2 divide-x divide-border/80">
        <MetricItem label="Tài sản" value="374M đ" />
        <MetricItem label="Nợ" value="18M đ" />
      </div>
    </GroupedSurface>
  </div>
</Card>
```

## 14.4. Attention Summary Section

Name:

```txt
Cần chú ý
```

Information architecture:

```txt
“Sắp trả” is the group.
“Gần nhất” is metadata of the first upcoming payment.
“Cần bàn” is a separate group.
```

```tsx
<Card className="rounded-[26px] border-border/80 p-5 shadow-none md:p-6">
  <SectionHeader
    title="Cần chú ý"
    hint="Có vài việc nên xem trong tuần này"
    action="Xem tất cả"
  />

  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-medium text-[hsl(var(--status-orange))]">
          Sắp trả · 3 khoản
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card divide-y divide-border/70">
        <ListRow title="Học phí tháng 7" meta="Gần nhất · 10/07 · 12M đ" />
        <ListRow title="Tiền nhà" meta="15/07" />
        <ListRow title="Bảo hiểm xe" meta="22/07" />
      </div>
    </div>

    <div>
      <div className="mb-2 px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Cần bàn · 1 việc
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <ListRow
          title="Học phí tháng 7"
          meta="Nên thống nhất nguồn tiền"
          actionLabel="Bàn"
        />
      </div>
    </div>
  </div>
</Card>
```

Tone:

```txt
Use: Cần chú ý, Cần bàn, Xem
Avoid: Cảnh báo, Đáng ngờ, Vượt chi
```

## 14.5. Long-term Plan Section

```tsx
<Card className="rounded-[26px] border-border/80 p-5 shadow-none md:p-6">
  <SectionHeader
    title="Kế hoạch dài hạn"
    hint="Mục tiêu chính đang tiến triển tốt"
    action="Xem"
  />

  <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
    <div className="rounded-2xl border border-border/80 bg-muted p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Mục tiêu chính</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
            Quỹ dự phòng
          </h3>
        </div>
        <p className="money-number text-2xl" aria-label="72 phần trăm hoàn thành">
          72%
        </p>
      </div>

      <Progress
        value={72}
        aria-label="Quỹ dự phòng đã hoàn thành 72 phần trăm"
        className="mt-5 h-2 rounded-full bg-card"
      />
    </div>

    <div className="overflow-hidden rounded-2xl border bg-card divide-y divide-border/70">
      <ListRow title="Còn thiếu" value="34M đ" />
      <ListRow title="Tài sản chính" meta="Vàng, đầu tư" />
    </div>
  </div>
</Card>
```

## 14.6. Recent Updates

```tsx
<Card className="rounded-[26px] border-border/80 p-5 shadow-none md:p-6">
  <SectionHeader title="Gần đây" hint="Dữ liệu mới nhất trong nhà" action="Xem" />

  <div className="overflow-hidden rounded-2xl border bg-card divide-y divide-border/70">
    <ListRow title="Minh cập nhật khoản học phí" meta="2 giờ trước · 05/07/2026" />
  </div>
</Card>
```

Keep this section compact and last on Home.

## 14.7. Full Home layout

```tsx
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[256px_1fr]">
          <AppSidebar />

          <main className="min-w-0 space-y-5">
            <HeroSnapshot />
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

---

## 15. Management Pages

## 15.1. Assets

Purpose:

```txt
Understand where household money and assets are held, who manages them, how liquid they are, and what is shared.
```

Structure:

```txt
Header + Add asset
Summary strip
Search and filters
Desktop table or dense grouped list
Mobile grouped list
```

Required fields:

```txt
Name
Type
Value
Owner or manager
Liquidity
Visibility
Last updated
Actions
```

Desktop behavior:

```txt
Use a table when more than four assets exist.
Align monetary values to the right.
Keep visibility as a text badge.
Use DropdownMenu for secondary row actions.
Keep the asset name and primary action visible without horizontal scrolling where possible.
```

## 15.2. Upcoming Payments

Structure:

```txt
Header + Add payment
Summary: 7 days · 30 days · Overdue · Needs discussion
Tabs: 7 ngày / 30 ngày / Quá hạn / Đã trả / Lặp lại
Rows grouped by due date
```

Required fields:

```txt
Payment name
Amount
Due date
Responsible member
Status
Discussion indicator
Actions
```

Tone:

```txt
Orange for approaching due dates.
Red only for overdue or clear insufficiency.
Use “Cần xem lại” rather than an exaggerated warning.
```

## 15.3. Goals

```txt
Header + Add goal
Primary goal block
Goal list or grid
Progress
Priority
Deadline
```

Rules:

```txt
Fewer than 6 goals → card grid is acceptable.
More than 6 goals → compact list.
Progress is the main visual.
No complex chart in MVP.
```

## 15.4. Discussions

Purpose:

```txt
Create calm, contextual financial conversations with a clear decision state.
```

Structure:

```txt
Header + New discussion
Tabs: Đang mở / Cần quyết định / Đã thống nhất / Đã đóng
Discussion list
Detail drawer or page for comments and conclusion
```

Rules:

```txt
Do not imitate a heavy real-time chat app.
Do not use playful chat bubbles or emoji in the primary UI.
Every discussion has a status and an optional conclusion.
Templates should sound collaborative, not accusatory.
```

## 15.5. Snapshot History

```txt
Header
Small trend summary
Table on desktop
Timeline/list on mobile
Filter by month and member
```

Always show who updated the snapshot and when.

## 15.6. Members and Privacy

Structure:

```txt
Household information
Members
Permission levels
Default visibility
Data safety
Export and delete data
```

Permission copy:

```txt
View Summary  → Chỉ thấy tổng quan.
View Grouped  → Thấy theo nhóm tài sản hoặc khoản.
View Detail   → Thấy chi tiết dữ liệu được chia sẻ.
Edit Content  → Có thể thêm và sửa dữ liệu.
Admin         → Quản lý thành viên, quyền và dữ liệu.
```

Rules:

```txt
Every permission includes a one-line explanation.
Danger Zone is last.
Red is used only for destructive actions.
Changing a permission explains its effect on household totals and status.
```

---

## 16. Forms and Update Snapshot Flow

## 16.1. Preferred container

```txt
Desktop → Dialog for short flows; dedicated page for complex flows
Tablet/mobile → Sheet or dedicated page
```

## 16.2. Snapshot fields

```txt
Tiền có thể dùng ngay
Tiền tiết kiệm / dự phòng
Tài sản dài hạn
Nợ / khoản phải trả
Khoản cần chú ý — optional
Ghi chú — optional
```

## 16.3. Form rules

```txt
Keep the MVP to 3–5 primary numbers.
Do not ask for individual transactions.
Money inputs include a visible “đ” suffix.
Show a preview when the update changes household status.
Explain which values are shared.
Preserve data after recoverable errors.
Use “Lưu cập nhật” or “Cập nhật tình hình”.
```

## 16.4. Unsaved changes

When a user attempts to close a changed form:

```txt
Title: Bỏ thay đổi?
Body: Những thông tin bạn vừa nhập sẽ không được lưu.
Actions: Tiếp tục chỉnh sửa / Bỏ thay đổi
```

---

## 17. Responsive Rules

## 17.1. Desktop

```txt
Sidebar visible
Wide main content
Two-column conceptual groups allowed
Tables allowed on management pages
Primary action in page header or Hero
```

## 17.2. Tablet

```txt
Sidebar collapsed
Two columns only when values remain readable
Dialogs may become sheets
Grouped-list pattern remains intact
```

## 17.3. Mobile

```txt
Single column
No table on Home
Management tables become grouped rows or horizontal containers only when comparison is essential
Hero metrics stack or use a readable 2+1 layout
One sticky primary action maximum
No horizontal overflow for primary content
Keep headings and actions in natural reading order
```

Mobile Home order:

```txt
1. Hero Snapshot
2. Tiền nhà mình
3. Cần chú ý
4. Kế hoạch dài hạn
5. Gần đây
```

---

## 18. Copywriting

## 18.1. Voice

```txt
Calm
Respectful
Clear
Collaborative
Non-judgmental
Non-controlling
```

## 18.2. Preferred words

```txt
Tình hình
Nhà mình
Cùng xem
Cần chú ý
Cập nhật
Theo dữ liệu hiện có
Theo dữ liệu được chia sẻ
Khoản sắp tới
Mục tiêu chung
```

## 18.3. Avoid

```txt
Kiểm soát
Theo dõi đối phương
Truy vết
Đáng ngờ
Cảnh báo nghiêm trọng
Vượt chi
Ai tiêu khoản này?
```

## 18.4. Status copy

```txt
Ổn
“Tiền dùng ngay đang đủ cho các khoản bắt buộc trong 30 ngày tới.”

Cần chú ý
“Có một vài khoản nên xem lại trong thời gian gần.”

Căng
“Có khoản quá hạn hoặc tiền dùng ngay chưa đủ cho 7 ngày tới.”

Chưa đủ dữ liệu
“Cần cập nhật thêm dữ liệu để xem tình hình.”
```

## 18.5. Button labels

Primary:

```txt
Cập nhật tình hình
Lưu cập nhật
Thêm tài sản
Thêm khoản
```

Secondary:

```txt
Xem chi tiết
Tiếp tục chỉnh sửa
```

Text links:

```txt
Xem
Xem tất cả
```

Avoid:

```txt
Kiểm tra ngay
Cảnh báo
Phân tích rủi ro
Theo dõi chi tiêu
```

---

## 19. Icon System

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
Line icons only.
Stroke width 1.75–2.
No emoji in production UI.
Do not add an icon to every row when text is already clear.
Decorative icons are aria-hidden.
Icon-only actions require a tooltip and accessible label.
```

```tsx
<div className="flex size-10 items-center justify-center rounded-full bg-muted">
  <Wallet className="size-5" strokeWidth={1.8} aria-hidden="true" />
</div>
```

---

## 20. Data, Empty, and Edge States

Every major component must define:

```txt
Complete data
Partial data
No data
Stale data
Loading
Error
Permission-restricted data
Long text
Large money value
Zero value
Negative or overdue value
```

Examples:

```txt
No upcoming payment
→ “Chưa có khoản sắp tới.”

Private data affects completeness
→ “Tổng quan này dựa trên dữ liệu đang được chia sẻ.”

Stale snapshot
→ “Dữ liệu đã hơn 30 ngày. Cập nhật để xem tình hình hiện tại.”

Failed update
→ “Chưa thể lưu cập nhật. Thông tin cũ vẫn được giữ nguyên.”
```

Do not display a false zero when the value is unknown. Use `—` and explain why.

---

## 21. Implementation Checklist

A feature is not ready when it only matches a screenshot. It must pass these criteria.

### Product hierarchy

```txt
Home answers the five-second questions.
Detail data is not duplicated excessively on Home.
One clear primary action per section or flow.
```

### Surface restraint

```txt
No more than two real surfaces per section.
Repeated rows share one list surface.
Metric items do not create white mini-cards inside a grouped surface.
Shadows are limited to Hero, dialogs, popovers, and sticky controls.
```

### Financial trust

```txt
Every health status has a reason.
Data freshness is visible.
Unknown and private data are not shown as zero.
Privacy-aware aggregation is respected.
```

### Accessibility

```txt
Keyboard navigation works.
Focus is visible.
Contrast passes WCAG AA.
Status is understandable without color.
Labels and errors are programmatically connected.
Reduced motion is supported.
```

### Responsive behavior

```txt
No primary-content horizontal overflow.
Home remains understandable in one column.
Tables transform appropriately on mobile.
Touch targets are usable.
```

### Content

```txt
Copy is calm and non-judgmental.
Dates and money units are clear.
Permission labels use text.
Empty and error states are defined.
```

---

## 22. MVP Rules

### Do

```txt
Make Home answer “nhà mình đang ổn không?”
Show large, scannable money values.
Use fewer sections with richer internal structure.
Use grouped lists for repeated items.
Show status reason and last update.
Show upcoming payments and total debt clearly.
Keep snapshot update fast.
Use toolbar, filter, list, or table on management pages.
Explain privacy and permissions in text.
```

### Do not

```txt
Do not show individual transactions on Home.
Do not create a card for every metric.
Do not create flat large cards with unrelated values scattered inside.
Do not build a heavy chat system for MVP.
Do not use red for ordinary attention.
Do not make the product feel like accounting software.
Do not ask accusatory questions.
Do not exceed two real surface layers.
Do not use marketing heroes on management pages.
Do not sacrifice privacy clarity for visual minimalism.
Do not claim a household status from stale or incomplete data.
```

---

## 23. Example Home Content

```txt
Tình hình nhà mình
Cần chú ý · Cập nhật 05/07/2026
Có 3 khoản sắp tới; tiền dùng ngay chưa bao phủ toàn bộ 30 ngày.

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
Theo dữ liệu được chia sẻ

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

Quỹ dự phòng · 72%
Còn thiếu: 34M đ
Tài sản chính: Vàng, đầu tư

[Xem]
```

```txt
Gần đây
Minh cập nhật khoản học phí · 2 giờ trước · 05/07/2026

[Xem]
```

---

## 24. Final Product Feel

Money Space should feel like:

```txt
A private, premium consumer finance dashboard
for young couples and families to understand a shared situation calmly.
Home is spacious and glanceable.
Management pages are clear, compact, and dependable.
Privacy, status logic, and feedback are explicit.
```

It should not feel like:

```txt
An expense logger
A household accounting tool
A partner-monitoring system
A complex financial BI dashboard
A rounded SaaS template
```

Final design goal:

```txt
Within 5–10 seconds, a user understands:
- whether the household is currently stable,
- how much can be used now,
- what must be paid soon,
- what needs discussion,
- how the main long-term goal is progressing,
- and how reliable or fresh the displayed data is.
```

# Oursight — App-wide UI, Component & Copy Principles

> App-wide guideline for Oursight.  
> This document has **two layers**:
>
> 1. **Canonical Design System Rules** — source of truth from Foundations + Components v5.
> 2. **Product/UI Review Principles** — product-level decisions added through later design reviews.
>
> When the two conflict, **Canonical Design System Rules win unless an explicit product override is documented**.

---

# Part I — Canonical Design System Rules

## 1. Design character

Oursight is an:

> **airy, cool, flat financial workspace**

Core qualities:

- calm,
- financial,
- lightweight,
- data-focused,
- low visual noise,
- minimal elevation,
- clear hierarchy from type and spacing.

Avoid drifting toward:

- heavy SaaS dashboard styling,
- nested panels,
- excessive outlines,
- strong shadows,
- decorative cards.

---

# 2. Surface system

## 2.1. Page ground

The outermost visual ground is a cool blue gradient:

```text
#C2D7EE → #ACC6E3
```

Use this for the page atmosphere / shell when the layout exposes the page ground.

---

## 2.2. Canvas

The inner workspace canvas is:

```text
#EDF3F8
```

This is the main flat surface on which top-level cards sit.

---

## 2.3. Card

```text
Background: #FFFFFF
Radius: 22px
Typical padding: 20–24px
Shadow: none in-page
```

Top-level cards sit directly on the canvas.

Do not add:

- a white group panel around multiple cards,
- a second nested rounded card,
- unnecessary borders around every block.

---

## 2.4. Wash

```text
#E3ECF2
```

Wash is a **control surface**, not a second card level.

Valid examples:

- segmented control,
- secondary button,
- row hover,
- small chart bed when needed,
- selected/soft interaction state.

Do not use wash to visually group ordinary content inside a card.

---

# 3. Elevation

In-page cards carry no meaningful shadow.

White-on-canvas separation is enough.

Real elevation belongs to:

- Dialog,
- Sheet,
- Popover,
- overlay surfaces.

Recommended overlay radius:

```text
22–28px
```

---

# 4. Radius system

```text
Hero      28px
Card      22px
Control   14px
Pill      999px
```

Use radius by semantic level rather than inventing per-screen values.

---

# 5. Typography

Primary typeface:

```text
Urbanist
```

Canonical weights:

```text
300
400
500
```

These are the only weights **loaded** (`web/index.html`). `600` is not a
heavier option that is merely discouraged — it does not exist in the family, so
asking for it makes the browser synthesise a smeared approximation. Enforced by
`npm run lint`.

---

## 5.1. Type scale

Eleven steps, and nothing between them. Size and weight are **never written at
the call site** — a component names the role the text plays and the scale
decides what that looks like.

```text
t-display       72px · 500 · -0.035em · lh 1.02    page hero, one per page
t-hero          56px · 400 · -0.04em  · lh 1.05    the page's primary money figure
t-figure        40px · 400 · -0.035em · lh 1.1     a section's primary figure
t-metric        28px · 400 · -0.03em  · lh 1.15    a summary-strip figure
t-title         24px · 500 · -0.02em  · lh 1.3     the <h2> at the top of a card
t-subtitle      20px · 500 · -0.01em  · lh 1.35    an <h3> one level inside it
t-subhead       20px · 400            · lh 1.3     a subheading in running copy
t-body          16px · 300            · lh 1.5     body copy
t-body-sm       14px · 300            · lh 1.5     dense rows — tables, list items
t-caption       12px · 300            · lh 1.45    metadata
t-caption-sm    11px · 300            · lh 1.4     axis ticks, chart labels — the floor
```

Weight descends as size does, which is what makes the surface read airy: the
display line is the only 500 among the figures, the money tiers are 400, and
everything at body size and below sits at 300.

### The weight in a step is a default, not a lock

Emphasis **inside** a step is allowed and expected — a name in a dense row
takes `font-medium` to separate it from the note beneath it. What the scale
does not permit is a size that is not one of the eleven.

### Headings outrank the text they introduce

```text
t-title     24 · 500   ↑ a full size above t-subhead
t-subtitle  20 · 500   ↑ same size as t-subhead, wins on weight
t-subhead   20 · 400
t-body      16 · 300
```

`t-title` and `t-subtitle` are **complete steps**: each sets its own size and
weight and must never be paired with another `t-*` class. A section heading is
one role, so it gets one appearance — pairing it with a step is what once let
the same heading render at three different sizes across the app.

`t-page-tracking` is the single exception: a **modifier** carrying tracking
only, meant to be paired with a step, because page titles legitimately range
from `t-metric` on a detail page to `t-display` on the dashboard.

### Never

- A raw `text-[Npx]` or a Tailwind preset (`text-sm`, `text-xs`, `text-2xl`).
- `font-semibold` and above. Urbanist loads 300/400/500 only, so 600 is
  synthesised by the browser — a smeared approximation of a weight the family
  does not have.
- A `t-*` step or `font-*` beside `t-title` / `t-subtitle`.

All three fail `npm run lint` via `web/scripts/check-type-scale.mjs`.

---

## 5.2. Financial numerals

All important numeric values use tabular numerals:

```css
font-variant-numeric: tabular-nums lining-nums;
font-feature-settings: "tnum" 1;
```

---

# 6. Text colors

```text
Ink    #0F1011
Ink 2  #596268
Ink 3  #879398
```

Recommended use:

- `ink` → primary answer / title / action
- `ink2` → supporting labels / secondary text
- `ink3` → metadata / tertiary context

Do not make important financial values too light.

---

# 7. Data & state colors

```text
Data primary  #73A4D7
Positive      #8FCDA4
Attention     #E1BE68
Alert         #E8A39A
Committed     #D8E0E4
Protect       #AFC0C7
Model         #EEF6F1
```

---

## 7.1. Canonical color semantics

### Interaction

Interaction uses **ink**.

Do not use green as an action color.

### Data

`data-primary` carries:

- charts,
- composition emphasis,
- progress data.

### Static financial metrics

A static metric should not wear action color.

### Incoming / outgoing money

Incoming and outgoing money do **not automatically receive green/red**.

Use `positive` or `alert` only when the consequence itself has positive/negative meaning.

This is important: amount direction and semantic state are not the same thing.

---

# 8. Spacing system

Canonical scale:

```text
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 48
```

### Named roles

The positions the design system makes a promise about are **classes, not
numbers** — the same reason type is `.t-*` and never `text-[16px]`. These are
the ones a reviewer cannot check by eye, and the ones that had drifted.

```text
.s-card         20 → 24 @sm     a card's inner padding
.s-page         16 → 28 @lg     the page edge
.s-card-gap     12              card → card
.s-section-gap  20              section → section
.s-head-body    28              a section header to its body
.s-split-gap    48 / 32         the two columns of a PanelSplit
.s-row          10 vertical     one row of a dense list
.s-tap          44 min          the tappable box
```

Everything else stays plain Tailwind, on the scale. A one-off `mt-4` between
two paragraphs is fine — it carries no rule anyone could get wrong.

### Touch targets

44px is a floor, not a range. A control may **look** smaller — a compact
toolbar button often should — but the box a finger has to hit may not be.
`.s-tap` keeps the painted size and grows the hit area around it, so a dense
row stays dense without any of it becoming hard to tap.

### Never

- A spacing step off the scale: `gap-14` (56), `py-10` (40), `mt-9` (36).
- An interactive control whose hit box is under 44px and has no `.s-tap`.

Both fail `npm run lint` via `web/scripts/check-design-scale.mjs`.

When data is sparse:

- narrow the composition,
- stack,
- leave whitespace.

Do not stretch content just to fill width.

---

# 9. Flat hierarchy rule

Hierarchy comes from:

- type scale,
- alignment,
- spacing,
- occasional divider.

It does **not** come from:

- nested rounded surfaces,
- stacked cards,
- borders around every group,
- strong shadows.

---

# 10. Panel

## 10.1. Panel

A Panel is a top-level card surface.

---

## 10.2. PanelHeader

Canonical contract:

```text
Title left
ONE metadata OR action right
No subtitle slot
```

Do not overload PanelHeader with:

- subtitle,
- multiple actions,
- secondary status,
- explanatory copy.

---

## 10.3. PanelSplit

Use for:

```text
answer | detail
```

Desktop:

- answer left,
- detail right.

Below large breakpoint:

- collapse vertically,
- answer first.

Only use the split when both sides carry meaningful weight.

---

# 11. SubSection

A SubSection is a **labelled group**, not a nested surface.

Pattern:

```text
Section
  label
  content
```

Do not use:

```text
Section
  tinted rounded box
    metric cards
```

---

# 12. MetricCell

Metrics inside a panel are inline.

Separate metrics with:

- spacing,
- divider,
- alignment.

Do not wrap each metric in a rounded box.

---

# 13. KPI Card

A KPI card represents:

> one metric answering a section-level question

Do not create a card per number simply to fill a grid.

A static KPI does not use the action color.

---

# 14. SummaryStrip / SummaryTile

SummaryStrip is a valid component.

Use on:

- detail pages,
- contexts where each tile is a real answer.

Do **not** assume SummaryStrip is banned across the app.

Specific Home rule:

- avoid atomizing Home into independent Total / Committed / Flexible tiles when the Flexible Money answer should be primary.

---

# 15. Buttons

Canonical button characteristics:

```text
Height: 44px
No shadow
```

Variants:

### Primary

```text
Ink background
White text
Pill radius
```

### Secondary / outline

Canonical v5 treatment is a **borderless sunk fill**.

```text
Wash background
Ink text
Control radius
```

Do not use a stroke as the main way to mark the control.

### Ghost

Text/icon treatment without surface.

### Destructive

Alert treatment.

---

# 16. Input / FormField

Canonical input:

```text
Height: 44px
Background: white
Border: 1px committed
Radius: 14px
```

Rest:

```text
border #D8E0E4
```

Focus:

```text
blue border
+ soft 3px blue ring
```

Disabled:

- muted fill,
- muted border.

No extra stacked global focus ring.

---

# 17. StatusChip

Canonical form:

```text
6px dot + text
```

Rules:

- never filled pill,
- never icon-only,
- status meaning must survive grayscale.

Examples:

```text
● đã đồng bộ
● hoàn thành
● cần xác nhận
● quá hạn
```

Dot carries tone.  
Word carries meaning.

---

# 18. Badge

Badge may use pill treatment because it is a compact label/status token.

Badge and StatusChip are not interchangeable.

---

# 19. Progress

Canonical progress is **fixed-pitch hairline ticks**, not a solid track pill.

Geometry:

```text
2px tick every 6px
```

Why:

- consistent density at every width,
- no stretching gap artifacts,
- track/fill remain in phase.

Default color:

```text
data-primary
```

Progress represents data, not an action.

---

# 20. Separator

Use the divider token:

```text
#EEF1F2
```

Separators are functional.

Do not use separators as default decoration between every content block.

---

# 21. Data rows

Canonical data row behavior:

- no card per row,
- no border per row,
- hover row may use wash,
- amount aligned right,
- tabular numerals.

---

# 22. Dense table

Dense Table is a first-class component.

Use when:

- there are 3+ rows,
- fields need comparison,
- multiple columns matter.

Canonical style:

- clear header,
- right-aligned numbers,
- no row rules,
- no second card wrapping the table if parent already provides the surface.

Do not interpret the product preference for timelines/lists as a ban on tables.

---

# 23. TotalRow

Use under tables/lists for summary.

Pattern:

- divider,
- weighted final row,
- inline summary.

Do not create a separate sunk block unless separation from a dense list genuinely requires it.

---

# 24. MoneyCompositionRing

Canonical component:

- conic ring,
- committed = neutral,
- flexible = data-primary,
- center percentage,
- compact legend grid.

Use ring rather than a horizontal strip when the main purpose is expressing a ratio.

Do not use action color.

---

# 25. Forecast chart

Canonical chart treatment:

- chart sits directly inside card,
- no chart-within-card-within-card,
- no border or rounded chart container,
- data series uses `data-primary`.

Canonical design system currently gives the derived low point `attention` treatment.

If product later chooses a neutral low point, document it as an explicit product override rather than silently changing the design-system rule.

---

# 26. Empty state

Empty state sits directly inside top-level card.

Use:

- Lucide icon,
- enough vertical space,
- clear action.

Avoid redundant explanatory copy.

The icon can communicate emptiness; text should communicate what the icon cannot:

- action,
- missing dependency,
- required input.

Never fake a financial zero when a value cannot be calculated.

Use:

```text
Chưa tính được
```

not:

```text
0
```

---

# 27. SourceFreshnessList

Canonical pattern:

```text
collapsed summary line
→ opens to detail
```

Summary can include:

- number of sources,
- oldest source age,
- thin freshness strip.

Do not create:

- separate warning card,
- confidence percentage,
- multiple freshness widgets for the same information.

---

# 28. Inherited components

The following components inherit the system tokens rather than receiving bespoke surfaces:

```text
Dialog
Sheet
ResponsiveDialog
ConfirmDialog
Popover
DropdownMenu
Command
Select
Checkbox
Switch
Slider
Calendar
DatePicker
MonthPicker
Textarea
Label
Skeleton
Sonner
Table
DataTable
QRCode
QRScanner
Motion
```

Dialog and Sheet are the main places where real elevation is allowed.

---

# Part II — Product / UI Review Principles

These principles are **app-level product decisions** derived from review sessions.

They guide composition and information architecture but do not replace the canonical component rules above.

---

# 29. Answer first, detail second

Every screen or major section should surface its main financial answer before detail.

Ask:

> What question is this screen answering?

Then design around that answer.

---

# 30. Data-first copy

Prefer:

```text
Tiền linh hoạt
48,2 tr
```

over explanatory sentences such as:

```text
Bạn có thể dùng ngay...
```

Use:

- label,
- value,
- concise metadata.

Avoid paragraphs that repeat what the interface already communicates.

---

# 31. Every important number needs meaning

A number should not stand alone if it is ambiguous.

Good:

```text
Tiền linh hoạt
48,2 tr
```

Weak:

```text
48,2 tr
```

---

# 32. Primary vs secondary metrics

Do not make several numbers visually equal when one is clearly the main answer.

Primary:

- larger,
- stronger hierarchy,
- first in reading order.

Secondary:

- smaller,
- supporting context.

---

# 33. Section titles must be meaningful

Avoid decorative or redundant headings.

A section title should describe the financial question/domain, not add atmosphere.

Prefer:

```text
Dòng tiền 30 ngày tới
```

over generic labels such as:

```text
Tổng hợp
Thông tin
Chi tiết
```

---

# 34. Avoid explanatory copy when metadata is enough

Prefer:

```text
12 giao dịch
5 nguồn
1 khoản đã biết
05/09 · sau tiền nhà
```

over:

```text
Dữ liệu được tổng hợp từ nhiều nguồn...
```

---

# 35. One visualization per question

Do not show:

- distribution chart,
- legend,
- source bars,
- percentage summary

if all repeat the same fact.

Use one visualization for one question, then use another component only if it adds a genuinely different dimension.

---

# 36. Timeline vs table

Product preference:

Use timeline when:

- sequence matters,
- date is primary,
- consequence after each event matters.

Use table when:

- comparison across columns matters,
- sorting/scanning structured rows matters,
- there are many comparable records.

This is a selection rule, not a universal preference against tables.

---

# 37. Progressive disclosure

Use disclosure when detail:

- is useful but secondary,
- may become long,
- should scale with data.

Examples:

- source freshness,
- ownership,
- account breakdown,
- advanced details.

Collapsed row should summarize:

```text
label · count · total
```

Expanded state contains the detail.

---

# 38. Ownership grouping

When showing who holds which assets:

Collapsed owner row:

```text
Quân
5 nguồn
36,6 tr
```

Expanded:

```text
Vietcombank
MB Bank
...
```

Do not duplicate source names in both summary and detail.

This pattern should scale from 1 to many sources.

---

# 39. Section density

Not every section needs a full-width row.

Two secondary sections can share a row when:

- priority is similar,
- content density is compatible,
- neither needs full width.

Mobile should still stack.

---

# 40. Navigation

For app-level navigation:

- use sidebar on desktop when multiple financial domains exist,
- icon + label,
- active state clearly visible,
- avoid icon-only primary navigation.

Mobile may use topbar/menu.

---

# 41. Responsive reading order

On mobile:

1. primary answer,
2. supporting metrics,
3. chart/list,
4. detail/disclosure,
5. secondary actions.

Do not simply shrink desktop.

---

# 42. Charts in prototypes

For HTML prototypes, Chart.js is acceptable when a real chart communicates the data better than handcrafted bars.

Prototype stack may use:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

This is a **prototype implementation choice**, not a canonical production component requirement.

---

# 43. Lucide icons

Use Lucide consistently.

Icons should:

- clarify meaning,
- support scanning,
- remain secondary to text/data,
- have accessible labels when standalone.

Do not add icons purely as decoration.

---

# 44. Product overrides

If a review intentionally changes a canonical rule, document it here.

Example format:

```text
Override:
Forecast low point is rendered neutral in overview contexts.

Canonical rule:
Forecast chart component uses attention color for the derived low point.

Reason:
The low point is informational unless it breaches a defined risk threshold.
```

This makes the distinction between:

- design-system baseline,
- product-context decision.

---

# Part III — Copy System

# 45. Tone

Oursight copy should be:

- short,
- factual,
- calm,
- concrete,
- non-promotional.

Avoid:

- marketing language,
- motivational filler,
- excessive reassurance,
- explanatory prose when a label is enough.

---

# 46. Financial vocabulary

Prefer plain financial language:

```text
Tiền vào
Tiền ra
Tiền linh hoạt
Đã có nhiệm vụ
Tổng thu
Tổng chi
Số dư
Nguồn tiền
Mục tiêu
```

Avoid jargon unless it is required by the domain.

---

# 47. Actions

Use direct verb labels:

```text
Thêm khoản
Cập nhật
Xác nhận
Xem
Chỉnh sửa
Xoá
Thử lại
```

Avoid vague action copy:

```text
Khám phá thêm
Bắt đầu ngay
Tiếp tục hành trình
```

---

# 48. State copy

State copy should say exactly what is true.

Good:

```text
Chưa tính được
Chưa có số dư đầu kỳ
1 nguồn cần xác nhận
```

Avoid vague statements:

```text
Có vấn đề với dữ liệu
Thông tin chưa đầy đủ
```

---

# Part IV — Accessibility & Behavior

# 49. Touch targets

Minimum:

```text
44px
```

---

# 50. Color accessibility

Color cannot be the only carrier of meaning.

Use:

- label,
- text,
- icon,
- state word.

---

# 51. Focus

Interactive controls require visible focus states.

Inputs follow the canonical blue border + soft ring.

Other controls should use a similarly clear but restrained treatment.

---

# 52. Empty / loading / error states

Every data-driven component should define relevant states:

- loading,
- empty,
- error,
- missing dependency,
- partial data.

Avoid fake values.

---

# Part V — Review Checklist

# 53. Screen-level checklist

- [ ] What is the main question of this screen?
- [ ] Is the primary answer visible quickly?
- [ ] Are unrelated financial domains being mixed?
- [ ] Is the section order aligned with user priority?
- [ ] Is the screen calm rather than widget-heavy?

---

# 54. Hierarchy checklist

- [ ] Does every important number have a clear label?
- [ ] Is one metric incorrectly competing with another?
- [ ] Is a key summary hidden in metadata/subtitle?
- [ ] Is copy compensating for weak hierarchy?
- [ ] Could spacing/type solve the problem without another surface?

---

# 55. Surface checklist

- [ ] Any nested rounded cards?
- [ ] Any unnecessary borders?
- [ ] Any in-page shadow that should be removed?
- [ ] Is wash being used as a content surface instead of a control surface?
- [ ] Is the correct radius token used?

---

# 56. Component checklist

- [ ] Does the component match an existing canonical pattern?
- [ ] Would Panel / PanelSplit / MetricCell solve this?
- [ ] Is SummaryStrip being used only where it is appropriate?
- [ ] Should this be a list, table, timeline, chart, or disclosure?
- [ ] Does the component scale when data volume grows?

---

# 57. Color checklist

- [ ] Is action still ink?
- [ ] Is data emphasis using data-primary?
- [ ] Are positive/alert colors tied to meaning rather than amount direction?
- [ ] Is neutral information accidentally treated as warning?
- [ ] Is text contrast strong enough?

---

# 58. Copy checklist

- [ ] Does the title already explain the section?
- [ ] Can a sentence be replaced by metadata?
- [ ] Is the copy factual and concise?
- [ ] Are action labels direct verbs?
- [ ] Are empty/error states specific?

---

# 59. Responsive checklist

- [ ] Is primary answer first on mobile?
- [ ] Do two-column sections stack logically?
- [ ] Are touch targets at least 44px?
- [ ] Does data remain readable without shrinking text excessively?
- [ ] Does disclosure replace overwhelming detail where appropriate?

---

# 60. Anti-patterns

Avoid:

- card wall,
- nested cards,
- KPI grid without hierarchy,
- shadow-heavy panels,
- border around every row,
- status shown only by color,
- filled status pill everywhere,
- progress for simple aggregate values,
- duplicate chart + legend + bars,
- paragraph copy explaining obvious UI,
- green action buttons,
- automatic green income / red expense styling without semantic reason,
- hiding key summaries in subtitle metadata,
- mobile layouts that are just scaled-down desktop.

---

# 61. North star

> **Oursight is a calm financial workspace built from clear answers, not a dashboard full of widgets.**

The system should make financial information:

- easier to understand,
- faster to scan,
- calmer to revisit,
- clearer to act on,
- consistent across the entire app.

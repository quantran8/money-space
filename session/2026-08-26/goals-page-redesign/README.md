# Goals page redesign + white form controls

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/goals-page-redesign/`
- **Status**: done

## What the task is

Two requests in one session:

1. "dropdown và input đổi hết background sang trắng" — every input and dropdown
   trigger moves off the `--wash` fill onto white.
2. Rebuild the web Goals page to a supplied HTML mockup: summary led by the
   monthly gap, and the goals table replaced by a grid of cards.

## Changes made

### White form controls

- `web/src/components/ui/select.tsx` — `SelectTrigger`: `bg-wash` → `bg-card` +
  `border-committed`, focus/invalid/disabled matched to `Input`.
- `web/src/components/ui/textarea.tsx` — same treatment.
- `web/src/components/ui/form-22.tsx` — `fieldShell`, `fieldShellSm`,
  `TextareaField`: `border-transparent bg-wash` → `border-committed bg-card`;
  `fieldControlReset` gained `focus-visible:shadow-none`.
- `web/src/components/ui/event-field.tsx` — the field block is white + hairline;
  `eventSelectTriggerClass` / `eventDateTriggerClass` gained `border-0`.
- `web/src/components/ui/date-picker.tsx`, `month-picker.tsx` — triggers were
  `Button variant="outline"` (= `bg-wash`); now explicitly white + border.
- `web/src/features/{debts,cashflow}/…/*-form-dialog.tsx` — local `controlClass`
  / textareas / `selectClass` follow the same rule.
- `web/src/features/forecast/…/range-picker.tsx`,
  `features/{assets,debts,goals}/…/*-list-section.tsx`,
  `features/events/…/events-timeline-card.tsx`,
  `features/household/…/household-overview-card.tsx` — search fields, filter
  selects and dropdown triggers.

Deliberately left on `--wash`: disabled fills, dropdown item hover bands, and
the segmented-control track — white there would erase a state signal.

### Goals page

- `web/src/features/goals/ui/components/goals-summary-strip.tsx` — rewritten.
  "Cần thêm để đúng hạn" leads at `t-figure`; three rows (label / figure / note)
  shared across columns with `grid-rows-subgrid`.
- `web/src/features/goals/ui/components/goals-list-section.tsx` — rewritten from
  a 4-column table + mobile list to one card grid
  (`auto-fit, minmax(min(100%,360px), 560px)`).
- `web/src/features/goals/ui/goals-page.tsx` — `.s-section-gap`, default button
  padding.
- `packages/core/src/i18n/resources.ts` — new keys (vi + en):
  `goals.demo.{progressTitle,monthlyShort,withDeadline,noDeadlineGoals}` and
  `goals.card.{target,ofTarget,noMonthly,noProjection}`.

## Key decisions

- **White + 1px `--committed` stroke, not a recessed fill.** On an already-white
  card a wash-filled control read as a second surface level. The stroke marks
  the field without spending a lightness step. `Input` already worked this way —
  the change made the rest of the kit match it rather than inventing anything.
- **`subgrid` for summary rows.** The mockups align label/figure/note rows with
  `self-end`, which breaks when the grid collapses to one column (labels stack
  together, then figures). Subgrid keeps the alignment and the stacking order.
- **The goals gap leads.** "Đã tích lũy" is a state; "cần thêm để đúng hạn" is
  what decides the month.
- **A missing fact is an icon, not an empty row.** "Dự kiến: —" spends a line
  saying nothing; the greyed 44px glyph carries the sentence in its label.
- **Priority flag only for `high` / `low`.** `medium` is the default and a flag
  on every card says nothing.
- **Dropped the separate "Tài sản góp vào" button** — the card and the menu both
  open the detail page where allocations live.

## Mobile app parity notes

- **Shared**: only the i18n keys. All component changes are web-only.
- Mobile has its own `goals-list-section.tsx` and `goals-summary-strip.tsx`; the
  card-grid layout and `subgrid` do **not** port (RN has no subgrid — use
  explicit rows or fixed-height blocks).
- The white-control rule is worth porting to mobile's form primitives for visual
  parity, but the class names are web Tailwind and have no RN equivalent.

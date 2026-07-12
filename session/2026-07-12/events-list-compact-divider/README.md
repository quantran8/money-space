# Events list — compact items with dividers

- **Date**: 2026-07-12
- **Session folder**: `session/2026-07-12/events-list-compact-divider/`
- **Status**: done

## What the task is

Change the events (financial records) timeline list from card-style items to
compact items separated by dividers, instead of each record being its own
rounded/shadowed card.

## Changes made

- `src/features/events/ui/components/record-card.tsx` — removed per-item card
  chrome (rounded-[28px] border, white bg, big shadow, padding). Item is now a
  plain row with vertical padding (`py-4 first:pt-0 last:pb-0 sm:py-5`).
  Title reduced `text-lg` → `text-base`, amount `text-2xl` → `text-xl` to fit
  the tighter row.
- `src/features/events/ui/components/events-timeline-card.tsx` — replaced the
  `space-y-3` stack of cards with a single container per group:
  `divide-y divide-border/70 rounded-card border border-border/70 bg-white
  shadow-soft` so items share one card surface separated by dividers.

## Key decisions

- Kept one bordered/shadowed container **per timeline group** (the group card),
  with rows divided inside it — matches the design system (`rounded-card`,
  `shadow-soft`) rather than removing all surface chrome.
- The `RecordCard` component name is unchanged (still exported/used the same
  way) even though it now renders a compact row, to keep the diff minimal.

## Mobile app parity notes

- Apply the same visual change on mobile: financial records list should be
  compact rows with dividers grouped under one surface per timeline group,
  not individual cards. Reduce title/amount sizes accordingly.

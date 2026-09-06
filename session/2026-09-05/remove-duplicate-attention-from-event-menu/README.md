# Remove "Nhân bản" / "Cần chú ý" from the money event row menu

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/remove-duplicate-attention-from-event-menu/`
- **Status**: done

## What the task is

Drop the "Nhân bản" and "Cần chú ý" entries from the `⋮` dropdown on a money
event row in the events list. The menu now offers only Sửa and Xoá.

**Web only.** Mobile still shows both actions and was deliberately left alone.

## Changes made

- `features/events/ui/components/record-card.tsx` — removed the two
  `DropdownMenuItem`s, and the now-unused `onDuplicateEvent` /
  `onToggleEventAttention` props.
- `features/events/ui/components/events-timeline-card.tsx` — removed the same
  two props from the type, the destructure, and the `recordProps` pass-through.
- `features/events/ui/events-page.tsx` — stopped pulling `duplicateEvent` /
  `toggleEventAttention` off `useEventsPage` and passing them down.

## Key decisions

- **`packages/core` was NOT touched.** `useEventsPage` still exports
  `toggleEventAttention` and `duplicateEvent` because **`mobile/app/events.tsx`
  still calls both**. Removing them from the shared hook would have broken the
  mobile build for a web-only copy change.
- **The i18n keys `events.redesign.actions.duplicate` / `.attention` were kept**
  for the same reason — `mobile/src/features/events/ui/event-record-row.tsx`
  still renders them. They are now web-dead but mobile-live.
- Prop removal was carried all the way up the web chain rather than left
  dangling, so nothing passes a handler no one reads.

## Mobile app parity notes

**Do NOT port this as-is unless the same product decision applies to mobile.**

This is a deliberate web/mobile divergence right now. If mobile should match:

1. Remove the two actions from `mobile/src/features/events/ui/event-record-row.tsx`.
2. Drop the props through `mobile/app/events.tsx`.
3. Only THEN are `toggleEventAttention` / `duplicateEvent` in
   `packages/core/src/features/events/hooks/use-events-page.ts` and the two
   i18n keys genuinely dead and safe to delete.

Until step 3, the core hook and the i18n strings must stay.

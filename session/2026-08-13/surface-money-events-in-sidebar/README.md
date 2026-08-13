# Surface money events in the sidebar

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/surface-money-events-in-sidebar/`
- **Status**: done

## What the task is

Make the existing money-event page clearly discoverable from the sidebar so users can navigate there and create a money event.

## Changes made

- `src/app/layout/app-shell.tsx` — changed the `/events` navigation icon from history to a money-event icon.
- `src/i18n/resources.ts` — renamed the navigation label from “Lịch sử cập nhật” to “Sự kiện tài chính” in Vietnamese and from “Update history” to “Money events” in English.

## Key decisions

- Reused the existing `/events` page and its “Tạo sự kiện” action instead of introducing a duplicate creation page or route.
- Changed only the navigation presentation; money-event behavior and domain rules remain unchanged.

## Mobile app parity notes

- Use the same clearer “Sự kiện tài chính” / “Money events” label and money-event icon wherever the mobile app exposes this secondary destination.

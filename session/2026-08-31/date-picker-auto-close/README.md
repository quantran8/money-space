# Date picker auto-closes on pick

- **Date**: 2026-08-31
- **Session folder**: `session/2026-08-31/date-picker-auto-close/`
- **Status**: done

## What the task is

After picking a date the picker stayed open, so the user had to dismiss it
themselves (click outside / press Escape on web, tap away on iOS). Picking a day
should close it.

## Changes made

- `web/src/components/ui/date-picker.tsx` — the Popover was uncontrolled, so
  nothing could close it programmatically. Added local `open` state wired to
  `open` / `onOpenChange`, and `onSelect` now calls `setOpen(false)` after
  `onChange`. Also rewrote the guard as an early `if (!date) return` so the
  close only fires on a real selection.
- `mobile/src/components/ui/date-field.tsx` — the same gap on iOS: the previous
  `onChange` only closed on Android (`Platform.OS !== 'ios'`) or on an explicit
  dismiss, leaving the iOS `inline` picker on screen after a pick. Now
  `setOpen(false)` runs unconditionally at the top of the handler, before the
  dismissed-check and the `onChange`.

## Key decisions

- Web `DatePicker` follows the pattern `MonthPicker` already uses — controlled
  Popover, `setOpen(false)` in the cell handler. `MonthPicker` was already
  correct and needed no change; the two components are now consistent.
- `modal` stays on the Popover. It is what keeps calendar clicks from reaching a
  parent Dialog's interact-outside handler, and controlling `open` does not
  replace it.
- Mobile closes unconditionally rather than per-platform: on Android the picker
  closes itself anyway, so a redundant `setOpen(false)` is harmless, and the
  one code path is easier to keep right than a platform branch.
- Order matters in both: `onChange` fires with the new value while the picker is
  closing; closing first and reading `date` after is safe because `date` is
  already captured in the handler arg.

## Mobile app parity notes

- Already done in this session — `mobile/src/components/ui/date-field.tsx` is
  updated alongside the web component, so there is nothing left to port.
- The two fixes are NOT the same mechanism and should not be diffed against each
  other: web is a Radix Popover with `open`/`onOpenChange`, mobile is the native
  `@react-native-community/datetimepicker` mounted conditionally. Only the
  behaviour ("a pick closes the picker") is shared.

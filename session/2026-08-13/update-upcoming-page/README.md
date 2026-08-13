# Update upcoming page

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/update-upcoming-page/`
- **Status**: done

## What the task is

Update the Upcoming page to match the supplied HTML reference while keeping the live forecast and cashflow-event behavior.

## Changes made

- `src/features/forecast/ui/upcoming-page.tsx` — rebuilt the page header and horizon selector, connected event owners to the timeline, and retained the existing create and what-if actions.
- `src/features/forecast/ui/components/summary-strip.tsx` — replaced the KPI card grid with one summary panel containing the three primary forecast metrics and date range.
- `src/features/forecast/ui/components/forecast-timeline.tsx` — replaced grouped cards with a compact cashflow table showing date, item, owner, signed amount, running balance, end balance, and existing row actions.
- `src/features/forecast/ui/components/assumptions-note.tsx` — restyled forecast assumptions as a quiet explanatory footer beneath the timeline.
- `src/features/whatif/ui/components/whatif-trigger.tsx` — added an optional calculator icon variant used by the Upcoming page reference design.
- `src/i18n/resources.ts` — added Vietnamese and English copy for the new summary, horizon control, timeline columns, owner fallback, and ending balance.

## Key decisions

- Preserved the backend forecast as the source of truth and never clamped negative balances.
- Rows excluded from forecast arithmetic remain visible but show no resulting balance, avoiding false precision.
- Preserved complete, edit, and delete actions even though the static reference did not demonstrate them.
- Limited the visible horizon control to 7, 30, and 60 days to match the supplied design; the underlying forecast model still supports 90 days.
- Kept the existing cashflow form behavior and its required/planned distinction because those values affect forecast semantics.

## Mobile app parity notes

- Port the three-metric summary, 7/30/60-day selector, compact cashflow rows, owner label, and explicit running balance.
- On narrow screens, use stacked rows rather than a horizontally scrolling desktop table.

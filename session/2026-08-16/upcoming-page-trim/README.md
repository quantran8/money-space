# Upcoming page trim — summary order, table total, assumptions, note label

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/upcoming-page-trim/`
- **Status**: done

## What the task is

Trim noise from the Upcoming (Sắp tới) screen, per user request:

1. Remove the total/summary row at the bottom of the cashflow table.
2. In the Tóm tắt panel, "Thấp nhất dự kiến" is the primary number — it moves to the far left, first.
3. Remove the "Cách tính con số này" assumptions list from the page.
4. Drop "Không bắt buộc" from the note field label.

## Changes made

- `src/features/forecast/ui/components/forecast-timeline.tsx` — removed the trailing
  `TotalRow` ("Cuối kỳ dự kiến còn lại") and the now-unused `endingProjectedBalance`
  prop, plus the `TotalRow` / `formatVndScale` imports.
- `src/features/forecast/ui/components/summary-strip.tsx` — reordered the three metrics
  to lowest → incoming → outgoing, and moved the divider/padding classes with them so
  the first cell has no left border.
- `src/features/forecast/ui/upcoming-page.tsx` — dropped `<AssumptionsNote />` and its
  import; stopped passing `endingProjectedBalance`.
- `src/i18n/resources.ts` — `upcoming.form.note`: `'Ghi chú · Không bắt buộc'` → `'Ghi chú'`
  (vi) and `'Note · Optional'` → `'Note'` (en).

## Key decisions

- `AssumptionsNote` itself is **kept** — What-if
  (`src/features/whatif/ui/components/whatif-result-blocks.tsx`) still renders it, and the
  `upcoming.assumptions.*` i18n keys stay because that component reads them. Only the
  Upcoming page stopped showing the block.
- `forecast.endingProjectedBalance` remains in the forecast types and is still used by the
  dashboard's Upcoming section — only the timeline stopped rendering it.
- Note label now reads just "Ghi chú"; optionality is conveyed by the placeholder, not the
  label.

## Mobile app parity notes

- Apply the same four changes to the mobile Upcoming screen: no table footer total,
  projected-low metric first in the summary, no assumptions list on the page, "Ghi chú"
  label without the optional suffix.
- The i18n change is shared copy — port `upcoming.form.note` in both locales.

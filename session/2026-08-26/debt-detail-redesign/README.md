# Debt detail page redesign

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/debt-detail-redesign/`
- **Status**: done

## What the task is

Rebuild the web debt detail page to a supplied HTML mockup: outstanding balance
paired with a tick progress bar, the instalment run split into settled vs
upcoming groups of cards, and a loan-terms panel with three figures over a flat
detail grid.

## Changes made

- `web/src/index.css` — new `--positive-tint` token (ledger + archive) and its
  `--color-positive-tint` mapping, so a settled instalment can carry a fill
  without an inline rgba.
- `packages/core/src/i18n/resources.ts` — new keys (vi + en):
  `debts.detail.overview.{balanceTitle,periodsDone}`,
  `debts.detail.loan.{termsTitle,detailsTitle,interestNote,methodFixed,methodReducing}`,
  `debts.detail.schedule.{upcoming,periodIndex}`.
- `web/src/features/debts/ui/debt-detail-page.tsx` — rewritten presentation.
  `Card` → `Panel`/`PanelHeader`, `buildCalendar` → `buildSchedule` (now assigns
  a 1-based index and a `paid | next | upcoming` state), new `PeriodGroup`,
  `Term` and `Detail` components; `MoneyValue` and `LoanInfo` removed.

## Key decisions

- **Panel order swapped**: balance → instalments → terms. The schedule is what a
  household opens this page to check; the terms explain the schedule and now sit
  under it.
- **The progress bar is the shared `Progress` primitive** (tick scale,
  `--committed` track, `--data-primary` fill) at `h-2`, replacing a hand-rolled
  solid `bg-action` bar. Same scale as Goals, so a share reads the same
  everywhere.
- **Progress sub-line counts INSTALMENTS, not money.** The percentage above
  already states the money; "2 / 5 kỳ" is the half a household counts. Falls
  back to the old "Đã trả {amount}" when there is no schedule at all.
- **The instalment strip became two labelled groups.** One 6-column strip of
  tiles made the reader find the paid/unpaid boundary themselves. Numbering runs
  ACROSS both groups — "kỳ 3" is the third payment of the loan, not the first
  upcoming one.
- **Paid tiles are `--positive-tint`, not solid `--action`.** The old design
  filled settled instalments with ink and put white text on them, which made the
  finished half the loudest thing on the page. Green-for-settled is the one
  meaning v5 §4 still allows green.
- **Uniform tile padding**, unlike the mockup. The mockup pads only the
  highlighted tiles, which steps their text 16px away from their unfilled
  neighbours' in the same grid row.
- **Terms row is payoff / interest / method.** "Đã thanh toán" and "Còn lại"
  moved out of it into the instalments panel's own summary, where they belong;
  interest and method moved up out of the detail grid, so §9's "one fact, one
  place" holds and the grid drops from 9 items to 7.
- **Status is a dot and a word**, not a filled chip — it is context for the
  title, and a pill gave it the weight of a control. Colour by status:
  active → data, paid_off → positive, overdue → alert, paused → attention.
- The detail block lost its `--wash` bed: it is the card's content, not a
  control sitting inside it.

## Mobile app parity notes

- **Shared**: only the i18n keys.
- `debts.detail.overview.title` and `debts.detail.loan.title` were left in place
  — web stopped using them, mobile may not have.
- **Web-only, do NOT port as-is**: `--positive-tint` is a CSS custom property in
  `web/src/index.css` (mobile has its own token source), and every grid/divider
  class.
- Worth porting for parity: the paid/upcoming split with cross-group numbering,
  instalment counts instead of money on the progress line, and moving interest +
  method out of the detail list into the terms row.

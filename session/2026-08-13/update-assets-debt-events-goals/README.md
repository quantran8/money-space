# Update assets, debt, money events, and goals pages

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/update-assets-debt-events-goals/`
- **Status**: done

## What the task is

Update the Assets, Debt, Money Events, and Goals pages to match the supplied ledger-style HTML demo while preserving the current data and mutation flows.

## Changes made

- Added a shared compact page header and an Assets/Debt segmented navigation that keeps the existing routes.
- Reworked Assets into one three-metric overview panel and a compact source table with holder, liquidity role, sharing, freshness, balance, and existing actions.
- Reworked Debt into one overview panel and a compact debt table with lender, outstanding amount, next payment, interest, owner, payoff date, and a link for missing schedules.
- Reworked Goals into one overview panel and compact progress rows with target dates, projections, required monthly pace, contribution controls, and existing actions.
- Reworked Money Events into a compact update-history ledger grouped by date, with source/upcoming/goal/debt filters and all existing event/payment actions.
- Added Vietnamese and English copy for every new label.
- Preserved classification fields when editing assets so the new holder/sharing columns remain accurate after a save.

## Key decisions

- Kept Assets and Debt as separate routes while presenting them as two tabs, avoiding router or API changes.
- Kept existing create/edit/delete, asset sale, contribution, mark-paid, and payment scheduling behavior even where the static demo only showed a simplified action.
- Kept upcoming payments in Money Events because that page is the combined household ledger, then exposed focused category filters from the demo.
- Removed secondary charts and insight cards from these list pages so the primary totals and records stay visually dominant.

## Verification

- `npm run build` — passed.
- `node scripts/check-copy.mjs` — passed.
- Scoped ESLint — new UI files pass; the existing `react-hooks/set-state-in-effect` findings remain in `use-events-page.ts`, along with the existing React Hook Form compiler warning in `use-assets-page.ts`.

## Mobile app parity notes

- Use the same three-metric summary pattern, compact stacked list rows, Assets/Debt segmented navigation, goal progress/projection treatment, and date-grouped event history.
- On narrow screens, stack row metadata while keeping the monetary value and primary action visible first.

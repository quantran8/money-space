# Remove wash-as-content-surface; icon empty states; canvas hover

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/wash-content-surface-cleanup/`
- **Status**: done

## What the task is

Three related requests:

1. Remove every place using wash (`bg-wash` / `<Sunk>`) as a **content** bed.
   Foundations §2.4 reserves wash for CONTROL surfaces; it is not a card level.
2. Use `#EDF3F8` (canvas) for hover instead of wash.
3. Empty states get an **icon** and short copy instead of a bare sentence (§26).

## Changes made

### New

- `web/src/components/ui/empty-state.tsx` — shared `EmptyState`: icon + one
  short line + optional action, no surface. Nine empty states had been repeating
  the identical `rounded-control bg-wash px-4 py-8 text-center …` string.

### Wash → nothing / divider (17 violations)

- `components/ui/source-freshness-list.tsx` — `<Sunk>` → divider. Also flipped
  the table row hover from `bg-card` to wash: the comment explaining the
  lighter band was only true while the table sat on wash.
- `features/dashboard/ui/components/upcoming-section.tsx` — `<Sunk>` notice → divider.
- `features/goals/ui/components/goal-road-section.tsx` — `<Sunk>` disclosure → divider.
- `features/cashflow/ui/components/goal-impact-notice.tsx` — both the one-line
  pending notice and the whole section → divider.
- `features/goals/ui/components/goal-allocations-field.tsx` — allocation list
  items → divider-separated. Wash had them one surface BELOW their `bg-card`
  sibling, and stacked a third surface for the icon tile.
- `features/goals/ui/components/goal-scheduled-outflows-section.tsx` — the
  "before" half unsurfaced; only the tinted "after" half remains, so the
  contrast carries the message instead of decorating a symmetry.
- `features/goals/ui/components/goal-form-dialog.tsx`,
  `features/debts/ui/components/debt-form-dialog.tsx` — review/preview summary
  blocks → divider. The goal one had a `bg-accent-soft` sibling directly below,
  so two tinted blocks were stacking.
- `features/goals/ui/components/goal-allocations-section.tsx`,
  `goal-monthly-progress-section.tsx` — prose notices unsurfaced.

### Empty states → `EmptyState` with an icon

`assets-list-section` (×2 — `SearchX` when filtered, `Wallet` when nothing
recorded), `asset-detail-page` (`Timeline`), `asset-goal-usage-section`
(`Target`), `debt-detail-page` (`CalendarClock`), `debts-list-section` (×2 —
`Landmark` / `SearchX`), `goal-monthly-progress-section` (×2 `CalendarClock`),
`goal-allocations-section` (`Wallet`, keeps its action button).

### Hover

All 32 `hover:bg-wash` → `hover:bg-canvas` (`#EDF3F8`).

### Enforcement

- `web/scripts/check-design-scale.mjs` — new rule: a static `bg-wash` carrying
  a text class on a non-interactive element fails the build. Verified it both
  catches a reintroduced violation and passes the legitimate control uses.

## Key decisions

- **Kept as VALID wash** (control surfaces per §2.4): chart beds
  (`goal-monthly-progress-section` bar bed, `goal-road-section` chart bed),
  the switch rows in `actual-record-form` and `debt-form-dialog`, the asset
  picker buttons, skeletons, avatar circles, badges, table headers, segmented
  controls, disabled input fills.
- **Icon choice names the missing thing**, not a generic slate — and the two
  absences get different icons where both are possible (`SearchX` for "the
  filter excluded it" vs `Wallet` for "nothing recorded"), since those mean
  opposite things to a household.
- **Copy was left as-is.** It is already short and factual per §48; the request
  for shorter text was satisfied by the icon taking over the "it is empty" job.
- **Lint rule is deliberately conservative** — single-line shape only, excludes
  anything interactive. It catches the pattern that produced all nine repeats;
  a multi-line className still needs review by eye.

## Mobile app parity notes

- The §2.4 rule and the empty-state pattern (icon + short line, no surface)
  should be ported. `EmptyState` itself is web JSX.
- `hover` has no equivalent on touch; the canvas-vs-wash change is web-only.
- No shared-core changes in this task, so nothing to rebuild for mobile.

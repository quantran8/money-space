# Goal priority icons: queen / star / none

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/goal-priority-icons/`
- **Status**: done

## What the task is

Change the goal priority mark: `high` → chess queen, `medium` (normal) → star,
`low` → no icon. Then apply the same mark to the dashboard's goal section.

Previously the goals list showed a `Flag` for `high` and `low`, and hid
`medium`. The new rule inverts which rank is the silent one.

## Changes made

- `web/src/features/goals/ui/components/goal-priority-mark.tsx` — **new**.
  Shared `GoalPriorityMark`, driven by a `PRIORITY_ICON` lookup. Takes a
  `size` prop: `default` keeps the 44px tap-target box, `compact` is the bare
  18px glyph for dense rows.
- `web/src/features/goals/ui/components/goals-list-section.tsx` — deleted the
  local `PriorityMark`, now uses the shared one. Dropped the `Flag` import.
- `web/src/features/dashboard/ui/components/goals-section.tsx` — renders
  `GoalPriorityMark` (compact) before the goal name in `GoalTrackRow`.
- `packages/core/src/features/dashboard/model/home-derivations.ts` — added
  `priority: GoalPriority` to `GoalTrack` and populated it in
  `buildGoalTracks`.

## Key decisions

- **Extracted to a shared component instead of duplicating.** Two surfaces now
  show the same concept; §2.10 wants one look, and a copy would drift the
  moment either changed.
- **`low` is the silent rank.** Only the two ranks that pull funding forward
  get a glyph, so scanning finds them first. An icon on every card would spend
  attention on the goals least needing it.
- **Colours unchanged**: `high` keeps `text-attention-ink`, `medium` `text-ink3`.
- **`size="compact"` on Home.** Those rows are denser than the list's cards and
  the mark is not interactive there, so it does not need a 44px target.
- **`goal-detail-page.tsx` left alone** — it shows priority as a text label, a
  different presentation, and the request was about icons.
- **`main-goal-section.tsx` left alone** — it is not mounted anywhere
  (superseded by the goal tracks list), so it was out of scope.

## Incidental

`GoalCard` had a pre-existing dead `isPrimary` prop: threaded from
`goals-page.tsx` through the type but never read. It began failing
`noUnusedLocals` once a stale incremental build was refreshed. Kept the prop in
the type (marked reserved, now optional) so the caller contract is unchanged,
and stopped destructuring it. No behaviour change.

## Mobile app parity notes

- `GoalTrack.priority` is in shared core, so the mobile app already has the
  field once it rebuilds.
- The icon rule (queen / star / none) and the "low is silent" reasoning should
  be ported. `GoalPriorityMark` itself is web JSX and must be reimplemented
  against the Expo icon set — lucide's `ChessQueen` may need a substitute there.

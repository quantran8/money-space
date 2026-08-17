# Goals list: clicking a row opens goal detail

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/goals-list-row-click-navigate/`
- **Status**: done

## What the task is

Clicking an item in the goals list did not navigate to the goal detail page. Only the goal
*name* text was a click target; the rest of the row/card (progress, plan, empty space) was inert.

## Changes made

- `src/features/goals/ui/components/goals-list-section.tsx`
  - Desktop table: `<tr>` now has `onClick={() => onOpen(goal.id)}` + `cursor-pointer`, so the
    whole row opens the detail page.
  - The actions `<td>` (contribute + `…` menu) stops propagation so those controls don't
    navigate.
  - Mobile card `<li>`: same `onClick` + `cursor-pointer`; the `GoalMenu` is wrapped in a
    `stopPropagation` div and the contribute `Button` stops propagation before calling
    `onContribute`.
  - `GoalName`'s button stops propagation so a click on the name doesn't fire `onOpen` twice.

No changes to routing or data — `/goals/:goalId` (`GoalDetailPage`) and the `onOpen` prop in
`goals-page.tsx` were already wired correctly.

## Key decisions

- Kept the goal-name `<button>` as the accessible/keyboard control instead of putting
  `tabIndex`/`role` on the `<tr>`; the row `onClick` is a mouse affordance layered on top, so
  screen-reader and keyboard semantics are unchanged.
- Row click = open detail (read), explicit buttons = mutate (contribute/edit/delete). Actions
  never inherit the row's navigation.

## Mobile app parity notes

- Mobile list rows should make the entire goal card tappable → goal detail, with the
  contribute button and the overflow menu consuming their own taps.

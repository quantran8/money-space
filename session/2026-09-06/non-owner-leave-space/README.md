# Non-owner sees "Rời không gian" instead of "Xoá không gian"

- **Date**: 2026-09-06
- **Session folder**: `session/2026-09-06/non-owner-leave-space/`
- **Status**: done

## What the task is

For someone who did not create the space, the settings page's danger card
("Xoá không gian") becomes a leave card ("Rời không gian"), and the three-dot
menu disappears from the members list entirely.

## Changes made

- `packages/core/src/i18n/resources.ts` — new `settings.data.leave`,
  `leaveMeta`, `leaveDescription`, `leaveAction` in `vi` and `en`.
- `web/src/features/settings/ui/components/data-card.tsx` — new
  `LeaveSpaceCard`, shaped like `SignOutCard` (plain panel, secondary button,
  `LogOut` icon), not like `DangerCard`.
- `web/src/features/settings/ui/settings-page.tsx` — renders `DangerCard` when
  `isViewerOwner`, otherwise `LeaveSpaceCard` wired to
  `setRemoveId(viewerMemberId)`. Nobody sees both. The existing remove/leave
  `ConfirmDialog` already branches on `isLeaving`, so leaving keeps its own
  wording and the navigate-to-`/onboarding` handoff unchanged.
- `web/src/features/members/ui/components/member-row.tsx` — the overflow menu
  now renders only when the viewer is the creator AND the row is someone else's
  (`canRemove`); the `exit` tri-state and the `LogOut` import are gone. A
  non-creator's rows carry no menu at all.

## Key decisions

- **Leaving is not destructive, so it does not get the bordered danger panel.**
  Nothing is deleted, the shared data survives, and the creator can invite the
  person back. Borrowing the one bordered card's weight would overstate it —
  same reasoning already written into `SignOutCard`.
- **The exit moved up a level, not away.** Leaving the space is a
  household-level decision; hiding it behind a three-dot menu on your own row
  put the only exit a non-creator has in the one place nobody looks.
- **Who may do what is unchanged** — it is still a backend fact (`createdBy`
  guards delete, invite and removing others). This only stops rendering actions
  that could have ended in a 403, and moves one that could not.

## Mobile app parity notes

- Mobile's `member-row.tsx` still uses the `exit` tri-state with an inline
  destructive `Button` (no popup menu exists there). To reach parity: drop the
  `'leave'` branch so the row only ever offers `remove`, and gate it on
  creator + not-self.
- Mobile's `household-data-section.tsx` is currently **not mounted anywhere**
  (dead code, as is web's `household-admin-disclosure.tsx`). When a mobile
  settings screen does mount it, it needs the same owner/non-owner split and can
  reuse the new `settings.data.leave*` keys — the copy is already in shared
  core i18n for both locales.

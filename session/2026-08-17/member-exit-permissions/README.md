# Member exit: owner removes, everyone else leaves

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/member-exit-permissions/`
- **Status**: done

## What the task is

Three asks against the household screen:

1. The members list must not offer "remove" on the household owner's row.
2. A member who is not the owner may only **leave** the household — not remove anyone.
3. Move the settings "Lưu thay đổi" button up level with the page title, and drop the
   "Mỗi nguồn tiền hiển thị rõ thành viên đang phụ trách." line.

## Changes made

### Who may remove whom

- `src/shared/hooks/use-active-household.ts` — `HouseholdSummary` now carries `createdBy`.
  The backend already returns it (`mapHousehold` fills it on every household response);
  the client type simply did not admit it existed.
- `src/features/members/hooks/use-members-page.ts` — derives `ownerMemberId` (the member
  whose `profileId` is the household's `createdBy`), `viewerMemberId` (via the existing
  `currentMemberId` helper and the auth store) and `isViewerOwner`. `removeMember` now
  knows whether the id being removed is the signed-in member, so it picks leave-toasts
  over remove-toasts, and on a successful leave it clears the stored household id and
  invalidates `queryKeys.households` before the page navigates.
- `src/features/members/ui/components/member-row.tsx` — one `exit` decision per row:
  `none` for the owner, `leave` (with a `LogOut` icon) on your own row, `remove` on other
  rows only when the viewer is the owner, `none` otherwise.
- `src/features/members/ui/components/members-list-section.tsx` — passes `ownerMemberId`,
  `viewerMemberId`, `isViewerOwner` through.
- `src/features/household/ui/household-page.tsx` — leaving and removing share the confirm
  dialog but not its words, and a successful leave navigates to `/onboarding`.
- `src/i18n/resources.ts` — new `members.list.leave`, `leaveConfirm.title/description`,
  `left`, `leaveFailed` in both locales.

### Settings save + copy

- `src/features/household/ui/components/household-overview-card.tsx` — the save button is
  gone from the bottom of the card; the component no longer takes `isSaving` / `onSave`.
- `src/features/household/ui/household-page.tsx` — the button moved into the
  `CompactPageHeader` actions slot, level with the "Cài đặt" title.
- `src/features/members/ui/components/members-list-section.tsx` + `resources.ts` — dropped
  `household.merged.membersHelp` ("Mỗi nguồn tiền hiển thị rõ thành viên đang phụ trách.")
  and its English twin. The footer strip below the list now renders only when there are
  pending invitations, which is the one thing it said that was information.

## Key decisions

- **The owner rule is the backend's, not a new client rule.** `MembersService.deleteMember`
  refuses any member whose `profileId` equals `households.created_by`, because the
  invite / remove / delete guard resolves against that live row — deleting it would lock
  the household permanently. The UI previously offered a button that could only produce an
  error toast; now it offers nothing, and transferring the role stays a separate flow
  (`POST /households/:id/transfer-steward`).
- **Leaving reuses `DELETE /members/:id`.** There is no separate leave endpoint and none is
  needed: a non-creator deleting their own row is exactly what leaving is. What the client
  adds is the cleanup — clearing `activeHouseholdId` and the households cache — without
  which `RequireHousehold` would read a stale list and send the user back into the
  household they just left.
- **Non-owners cannot remove the other person.** Taking a partner out of the shared picture
  is the creator's call; giving either partner that button over the other is exactly the
  dynamic the product's voice rules exist to avoid.
- **Inviting was left alone.** The backend puts no creator guard on invite creation, so
  hiding that button for non-owners would have removed something that actually works.
- Verified with `npm run build` and `npm run lint` (copy check passes, no touched file
  flagged). Not verified in a browser.

## Mobile app parity notes

- Port the whole exit model: owner row has no action, own row leaves, other rows are
  removable only by the creator. The mobile app reads the same `createdBy` field.
- Port the leave cleanup too — clearing the stored household id and refetching the
  household list is what keeps the post-leave navigation from bouncing.
- `household.merged.membersHelp` no longer exists in `resources.ts`; a mobile screen still
  reading it will render a raw key.

## Follow-up worth raising

`MembersService.deleteMember` checks *which member* is being removed but never *who is
asking*. The comment above it says the creator is the only member who can remove anyone,
and the client now behaves that way — but a direct API call from a non-creator would still
succeed against the other member's row. The guard belongs in the service, not only in the
UI.

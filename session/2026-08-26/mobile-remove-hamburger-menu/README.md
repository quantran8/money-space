# Mobile: remove hamburger menu (bottom tab bar is the nav)

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/mobile-remove-hamburger-menu/`
- **Status**: done

## What the task is

Mobile had two navigation affordances at once: the hamburger drawer in the
shell header, and the bottom tab bar. Remove the hamburger, since the tab bar
already covers navigation.

The drawer could not simply be deleted — it was the *only* mobile entry point
for three things. Those had to be rehoused first.

## Changes made

- `web/src/app/layout/app-shell.tsx` — removed the `Dialog.Root` drawer, its
  trigger button, and the `drawerOpen` state. The mobile header is now identity
  only (mark + wordmark). Deleted the drawer-only components `NavItemLink`,
  `NavGroups`, `SimulateButton`, `HouseholdFooter` and `SidebarFooter`, plus the
  imports that went dead with them (`Dialog`, `useState`, `useMembers`,
  `useActiveHousehold`, `cn`, and four icons). Desktop rail untouched. Updated
  three comments that still described the drawer.
- `web/src/app/layout/mobile-bottom-nav.tsx` — added the what-if FAB above the
  bar (`bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]`, `lg:hidden`). The
  five tabs are unchanged.
- `web/src/features/settings/ui/components/data-card.tsx` — new `SignOutCard`.
- `web/src/features/household/ui/household-page.tsx` — mounts `SignOutCard`
  between `DataCard` and `DangerCard`.
- `packages/core/src/i18n/resources.ts` — added `shell.logoutMeta` and
  `shell.logoutDescription` (vi + en).

## Key decisions

- **Sign-out moved to `/household`, not deleted.** `useLogout` was referenced
  nowhere outside the shell, so removing the drawer with no replacement would
  have left mobile users unable to sign out at all. `/household` is already a
  bottom tab and is where a household manages who they are.
- **`SignOutCard` is shaped like `DataCard`, deliberately not `DangerCard`.**
  Signing out is reversible and costs nothing, so it must not borrow the one
  bordered card's destructive weight. It sits *above* the danger card so the
  ordinary way to leave is reachable without scrolling past the irreversible
  one. Not confirmed, matching the previous drawer behaviour.
- **What-if became a FAB, not a sixth tab.** What-if is not a route (§2.9), so
  it cannot be a tab — it is an action. A sixth tab would also put six targets
  on a narrow bar, which the existing code comment already warns against.
- **`/events` got no new affordance.** It is the one drawer destination with no
  tab, but it is already linked from the dashboard spending section, the debts
  insights section, and the debt detail page. It did not justify a sixth tab.

## Mobile app parity notes

- The Expo app has its own navigator; the FAB positioning and `lg:hidden`
  breakpoint logic here are **web-specific and should not be ported literally**.
- **Do port**: sign-out belongs on the household screen, not in a nav drawer,
  and the two new i18n keys (`shell.logoutMeta`, `shell.logoutDescription`) are
  in shared core so mobile already has them.
- The what-if entry point on mobile should likewise be an action button rather
  than a tab.

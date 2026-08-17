# App shell: fixed sidebar, scrolling content, sign-out action

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/fixed-sidebar-and-logout/`
- **Status**: done

## What the task is

Two changes to the app shell: (1) the sidebar must stay put while only the content area
scrolls, and (2) the sidebar needs a sign-out action — the app had none anywhere.

## Changes made

- `src/app/layout/app-shell.tsx`
  - Root wrapper `flex min-h-screen` → `flex h-dvh overflow-hidden`. The shell now owns the
    viewport; `<main>` carries `overflow-y-auto` and is the only scroll container. `dvh` rather
    than `vh` so the mobile address bar can't push the fixed bottom nav out of reach.
  - The desktop sidebar's nav block is wrapped in `min-h-0 flex-1 overflow-y-auto`, so if the
    nav ever outgrows the viewport only the nav scrolls — logo, what-if CTA and footer stay
    fixed. Same wrapper in the mobile drawer.
  - `useEffect` on `location.pathname` calls `scrollRef.current?.scrollTo({ top: 0 })`.
    `<main>` is not remounted between routes (only the inner `motion.div` is, via its
    `key`), so without this, navigating from halfway down a long list lands on the next page
    already scrolled.
  - New `SidebarFooter` component wrapping `HouseholdFooter` + a `.nav-item`-styled sign-out
    button (`LogOut` icon). Used by both the desktop sidebar and the mobile drawer; the drawer
    variant closes itself first via `onNavigate`.
- `src/i18n/resources.ts` — `shell.logout` in `vi` ("Đăng xuất") and `en` ("Sign out").

## Key decisions

- **`useLogout` already existed and was wired to nothing.** It revokes the session on the
  backend (best-effort), clears the auth store, clears the TanStack Query cache and redirects
  to `/auth`. No new auth logic was written — the hook just finally has a caller.
- **Sign-out is not confirmed.** Nothing is lost by signing out and it is one login away from
  being undone; a `ConfirmDialog` there would be friction, not safety.
- **The sign-out row is a `<button>` carrying `.nav-item`**, not a `NavLink`. It matches the
  nav rows visually because it sits in the same rail, but it is an action, not a destination,
  so it must not be focusable/announced as a link.
- Sign-out is styled in the ordinary ink, not `text-alert`. Leaving the app is not a
  destructive act and colouring it as one would be alarming for no reason (design.md §5.2:
  colour marks what needs action).
- No page uses `position: sticky` outside the shell's own mobile header, so moving the scroll
  container has no other positioning consequences. The mobile header (`sticky top-0`) sits
  inside `<main>` and sticks to the new container correctly.

## Mobile app parity notes

- The navigation rail is fixed and the content region scrolls independently — do not port a
  layout where the whole screen scrolls as one.
- The sign-out action lives at the foot of the navigation drawer, next to the household
  cluster. Single tap, no confirmation.

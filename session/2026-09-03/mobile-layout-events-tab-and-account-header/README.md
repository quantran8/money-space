# Mobile layout: money-events tab + account header

- **Date**: 2026-09-03
- **Session folder**: `session/2026-09-03/mobile-layout-events-tab-and-account-header/`
- **Status**: done

## What the task is

Rework the mobile web layout:

1. The bottom bar's Settings tab becomes **Money events** (`/events`).
2. The mobile header replaces the app mark + wordmark with the **user's avatar +
   name**, and gains a **settings icon** on the right.
3. No account menu on mobile — **sign-out stays on the Settings page**, where it
   already lives.
4. The avatar needed a visible edge; on canvas it was effectively invisible.

## Changes made

- `web/src/app/layout/mobile-bottom-nav.tsx` — fifth tab swapped from
  `/household` (`Settings` icon) to `/events` (`Timeline` icon, `nav.events`).
  The bar stays at five.
- `web/src/app/layout/app-shell.tsx` — everything else. No new file: the
  account pieces are local to this shell.
  - The mobile `<header>` is now `avatar + name + settings link`. `AppLogo` and
    the wordmark are gone from it (both still used by the desktop sidebar head).
  - `useAccountIdentity()` (name / email / avatarUrl resolution) and
    `AccountAvatar` (the disc) are file-local helpers, used by BOTH the sidebar
    foot and the mobile header — one resolution of "who is signed in" for the
    two breakpoints, not two.
  - `initialsOf` and `SidebarAccount` keep their existing behaviour; the
    sidebar's dropdown body stays inline in `SidebarAccount`.
  - `AppShell` pulls `pathname` and `useAccountIdentity()` for the header.

An intermediate version of this task extracted the account pieces into a
separate `account-menu.tsx`. That was reverted at the user's request — the
helpers live in `app-shell.tsx` and there is no `AccountMenuContent`
abstraction; the sidebar renders its menu inline.

No route, API, i18n or core change: `/events`, `nav.events` and the Settings
page's `SignOutCard` all already existed.

## Key decisions

- **Money events over Settings in the bar.** Settings is a once-a-month errand
  that was holding one of five daily slots; the shared money-events record is
  opened daily and was the only destination reachable on desktop but not on
  mobile. Settings loses nothing — as a header icon it is still one tap from
  every screen.
- **No account menu on mobile.** The header shows identity only. Sign-out is
  destructive and already has a home (`SignOutCard` on `/household`); putting it
  in the chrome would be one mis-tap from ending the session. The dropdown stays
  a desktop-sidebar concern.
- **No shared account module.** The avatar and identity helpers stay local to
  `app-shell.tsx`. Both consumers live in that one file, so a separate module
  bought an import and an export boundary and nothing else.
- **Identity replaces the app mark in the header.** On a phone, mark + wordmark
  is a row spent telling the reader which app they just opened. "Whose account
  is this" is the question a shared household picture must never leave
  ambiguous, and it fits the same space.
- **Avatar edge: `--protect` ring + `--committed` fill.** The old disc had no
  ring and an `--accent-soft` fill (#eef1f2) that measures **1.01:1** against
  `--canvas` (#edf3f8) — the mobile header sits directly on canvas, so the disc
  dissolved and a photo bled into the background. `--divider` is no fix (also
  1.01:1 on canvas). `--protect` is the strongest neutral structural token
  (1.68:1 on canvas, 1.88:1 on card, 1.95:1 on Archive's ground); `--committed`
  gives the disc a body, with initials at 14.2:1 (Ledger) / 11.8:1 (Archive).
  No new hue was introduced — both tokens are per-theme, so the edge follows
  Archive's warm register.
- `ring-1` rather than `border`: it draws outside the box, so the disc keeps its
  size and the initials stay centred.
- The header settings link is a 44px target (§24), pulled flush with the page
  gutter (`-mr-3`) so the icon lines up with the content below it.

## Mobile app parity notes

The Expo app needs the same three moves — its tab bar
(`mobile/app/(tabs)/_layout.tsx`) is the deliberate mirror of the web's bottom
nav, and it currently still ends on `household` with a `Users` icon:

1. **Tab bar**: replace the `household` tab with an `events` screen
   (`nav.events`, `Timeline` from `lucide-react-native`). The events screen may
   not exist in the Expo app yet — check before wiring the tab. Keep five tabs.
2. **Header**: the mobile app runs `headerShown: false` and each screen draws
   its own head, so there is no single shell header to change. The avatar + name
   + settings-icon row has to be added wherever the app's per-screen head is
   defined, not in `_layout.tsx`.
3. **Settings reachability**: with `household` out of the bar, the RN app must
   route to it from that header icon, or Settings becomes unreachable there.
   Verify before shipping the tab swap.
4. **Avatar tones**: port the ring/fill fix into `mobile/theme/tokens.ts`
   equivalents — `protect` for the ring, `committed` for the fill. Do NOT reuse
   `accentSoft`; that is the value that was invisible on canvas.

Web-specific, do **not** port: the desktop sidebar's account dropdown, the
`ring-1 ring-protect` Tailwind classes as written (RN needs
`borderWidth`/`borderColor`), and the `-mr-3` gutter pull.

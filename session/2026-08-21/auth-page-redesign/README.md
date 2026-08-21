# Auth page redesign + split signup route

- **Date**: 2026-08-21
- **Session folder**: `session/2026-08-21/auth-page-redesign/`
- **Status**: done

## What the task is

Rebuild the auth screen to a supplied HTML mockup, and remove the "nhà mình"
copy from it.

The mockup's palette turned out to be the shipped token set already
(`#EEF1F3` = `--app`, `#0A6B47` = `--accent`, `#F5F7F8` = `--sunk`,
`#E5E9EC` = `--hair`), so nothing needed hardcoding — the mockup's literal hex
values were replaced with the tokens that already carry them.

## Changes made

- `src/features/auth/ui/auth-page.tsx` — now exports `AuthLayout`, the shell
  shared by both routes (brand panel + white card on `--app`). The old dark
  rounded card with border and shadow is gone.
- `src/features/auth/ui/login-page.tsx`, `signup-page.tsx` — new: one page per
  route.
- `src/app/router.tsx` — `/auth` → `LoginPage`, new `/auth/signup` →
  `SignupPage`.
- `src/features/auth/hooks/use-auth-page.ts` — `useAuthPage` split into
  `useLoginPage` / `useSignupPage` over a shared `useAuthShared` (next-path +
  Google hand-off), so neither route builds the other's form.
- `src/features/auth/ui/components/auth-logo.tsx` — new: the wallet wordmark,
  authored once and shared by the brand panel and the mobile header (the
  mockup repeats the same SVG in both).
- `auth-brand-panel.tsx` — light surface, two-line headline, inline stat row.
- `auth-mobile-header.tsx` — now just `AuthLogo` on the sunk surface.
- `auth-legal-note.tsx` — new: the terms/privacy footnote (login only; signup
  already has an explicit consent checkbox, so repeating it there would be
  redundant).
- `login-view.tsx` / `signup-view.tsx` — tab-switch callbacks replaced with
  `<Link>`s; type scale matched to the mockup.
- `auth-tabs.tsx` — deleted. `AuthTab` removed from `model/auth-form.ts`.
- `google-button.tsx` — divider fix, see below.
- `src/i18n/resources.ts` — auth block only, `vi` + `en`.

## Key decisions

- **Login and signup are separate routes, not tabs.** Per the mockup. The URL
  now says which of the two is showing, and signup is directly linkable.
- **`next` is threaded through both links by hand.** It is how an invite QR
  (`/join?household=…&token=…`) survives a detour through auth; dropping it
  loses the invitation. Verified in both directions.
- **Signup's "confirm your email" branch now navigates** to `/auth` (carrying
  `next`) instead of calling `setTab('login')`, which no longer exists. This is
  the one behavioural change in the refactor.
- **Divider bug fixed:** `AuthDivider` painted its rules with
  `bg-[hsl(var(--border))]`, but `--hair` is a raw hex (`#e5e9ec`), not an
  hsl triplet — so it resolved to `hsl(#e5e9ec)`, invalid, and the lines never
  rendered. Now `bg-hair`. Worth knowing generally: the `--app/--panel/--sunk/
  --ink*/--hair` family are raw hex and must NOT be wrapped in `hsl()`.
- **Copy scope was deliberately limited to the auth block.** "nhà mình" appears
  51 times across `resources.ts` (dashboard, goals, settings, household). The
  user chose auth-only, so the rest still says "nhà mình" — a follow-up if the
  wider voice change is wanted.

## Mobile app parity notes

- Port the route split (login and signup as separate screens) and the copy
  changes in the `auth` i18n block for both locales.
- The `hsl(var(--hair))` divider bug is worth checking for on mobile if that
  token family was ported the same way.
- Web-specific, do NOT port: the `next` query-param threading (mobile carries
  invite state differently), and the `lg:` brand panel — it is hidden on small
  screens anyway, so mobile only needs the card.

# Mobile auth parity: forgot/reset password, Google sign-in, field polish

- **Date**: 2026-09-11
- **Session folder**: `session/2026-09-11/mobile-auth-parity/`
- **Status**: done

## What the task is

"Đồng bộ tính năng trên auth của web" — mobile had login + signup only. Web
additionally had forgot-password, reset-password, Google OAuth, a password
show/hide toggle, the "ghi nhớ đăng nhập" checkbox, and the eyebrow/legal copy.
Asked which of those to close, the answer was all of them, Google included.

## Changes made

### Core — the browser hand-off became an adapter

- `shared/oauth.ts` — **new**. `buildRedirectUri` + `start`, same injection
  shape as `clipboard.ts` / `notify.ts`. The browser default is built in, so
  web needed no wiring at all.
- `features/auth/model/google-exchange.ts` — **new**. `readGoogleCallbackParams`
  and `exchangeGoogleCode`, extracted so the web's callback route and native's
  in-app return run the same exchange.
- `hooks/use-auth-page.ts` — `onGoogle` no longer touches `window`. It builds
  the redirect through the adapter, and handles a returned callback URL for
  platforms that catch one.
- `hooks/use-google-callback.ts` — refactored onto `exchangeGoogleCode`; it no
  longer talks to the repository or the store directly.

### Mobile

- `src/shared/native-oauth.ts` — **new**. `WebBrowser.openAuthSessionAsync`
  plus `Linking.createURL`. Added `expo-auth-session` + `expo-web-browser`.
- `src/shared/bootstrap.ts` — `configureOAuth(nativeOAuth)`.
- `app/auth/forgot-password.tsx`, `app/auth/reset-password.tsx` — **new**,
  paths mirroring web's.
- `app/auth.tsx` / `app/signup.tsx` — Google button + divider, eyebrow, legal
  note, revealable password fields, `next` carried across the login↔signup
  link. Login gained the forgot-password link and the `remember` checkbox,
  which the schema always had and the screen never rendered.
- `src/components/ui/field.tsx` — `revealable` (eye toggle) and `labelAction`
  (trailing slot on the label row).
- `src/features/auth/components/{google-button,auth-screen}.tsx` — **new**.

## Key decisions

- **The adapter returns a URL instead of routing.** Web leaves the page and
  comes back as a fresh load on `/auth/callback`; native never unmounts, so its
  callback arrives as a value. Making `start` resolve to `string | null` covers
  both, and null distinguishes a dismissed sheet from a failure — a cancel
  shows no error toast.
- **Web keeps its `/auth/callback` route; mobile has none.** A native route
  there would be dead code: `openAuthSessionAsync` intercepts the deep link
  before the router ever sees it.
- **The exchange moved to core rather than being reimplemented.** Two places
  now turn a code into a session, and they must not drift on which errors are
  fatal.
- **Mobile routes are `/auth/forgot-password`, not `/forgot-password`.**
  `resolveNextPath` treats any `/auth/*` as a loop to avoid, so a flatter path
  would have made a bounced reset link land back on itself.
- **The eye toggle went into `Field`, not into an auth-local input.** Web has a
  `PasswordInput` wrapper; the kit's rule here is one Field, so the capability
  is a prop.
- **Terms/privacy are still stripped to plain text** on the signup checkbox.
  There is still nowhere on the phone to link to; unchanged from before.

## Verification

Web `tsc` + lint + build clean. Mobile `tsc` clean except one **pre-existing**
error (`auto-price-row.tsx`, `setAutoPrice` — untouched by this work); `expo
lint` clean bar three pre-existing unused-import warnings; `expo export` for
iOS bundles, and both new routes appear in the output.

**Not verified at runtime.** Google sign-in needs `moneyspace://auth/callback`
registered as a redirect URI in Supabase and a dev build — it cannot work in
Expo Go, and no device run happened in this session. The reset-password deep
link is likewise unexercised.

## Mobile app parity notes

This session IS the mobile catch-up. Nothing outstanding for mobile; the one
thing owed to **web** is that it now depends on core's OAuth default rather
than on `window` inline — if a third host ever appears it must call
`configureOAuth`.

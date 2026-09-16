# Mobile auth screens — new v5 mock

- **Date**: 2026-09-14
- **Session folder**: `session/2026-09-14/mobile-auth-v5-mock/`
- **Status**: done

## What the task is

Update the mobile sign-in and sign-up screens to the two HTML mocks the user
supplied: gradient canvas, brand wordmark above a vertically centred card, the
email form first with Google under the divider, and a links-only footer.

## Changes made

- `mobile/src/features/auth/components/auth-screen.tsx` — `AuthScreenShell`
  now paints the gradient canvas, renders the brand wordmark, owns the card
  (screens pass content, not their own `bg-card` wrapper) and takes a `footer`
  slot. Added `AuthBrand` and `AuthLegalLinks`; removed `AuthLegalNote`, which
  lost its last consumer. `AuthHeading` drops to `t-metric` (28px, the mock's
  size) and takes an optional `description`.
- `mobile/app/auth.tsx` — email/password form above the divider, Google below,
  legal links in the footer slot. Eyebrow and remember-me kept.
- `mobile/app/signup.tsx` — same shell; no Google button or divider (the mock
  has neither), password length moved from placeholder to `hint`, footer is
  the "Đã có tài khoản?" hop.
- `mobile/app/auth/forgot-password.tsx`, `mobile/app/auth/reset-password.tsx` —
  dropped their inner `rounded-card bg-card` wrappers, now the shell's; the
  back-to-login link moved into the footer slot.
- `mobile/src/features/auth/components/google-button.tsx` — `wash` fill at
  control radius instead of a bordered pill, per the mock; divider gap 5→6.
- `packages/core/src/i18n/resources.ts` — added `auth.terms` / `auth.privacy`
  in both `vi` and `en`.

## Key decisions

- The footer legal links open external URLs via `Linking`. There are no such
  pages yet, so `LEGAL_URLS` in `auth-screen.tsx` holds placeholder
  `oursight.app` paths — **replace before release**.
- The mocks drop the eyebrow and the remember-me checkbox; the user asked to
  keep both, so the eyebrow stays on login and signup and remember-me stays.
- `LinearGradient` takes `style`, not `className`: NativeWind v4 only interops
  core RN components, so a `className` there is silently dropped.
- The mock's 16px button label was not adopted. `Button` is a kit primitive at
  `t-body-sm`; changing it would restyle every screen in the app.
- `useSignupPage().onGoogle` is now unused on mobile. Left in core — the web
  signup still renders a Google button.

## Mobile app parity notes

Mobile-only. The web auth pages keep their two-panel brand layout and were not
touched; do not port the gradient shell or the Google-below-divider order to
`web/src/features/auth/`. The two new i18n keys are shared and already present
for both locales.

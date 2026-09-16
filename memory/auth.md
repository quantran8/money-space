# Auth

Authentication & session gating. Supabase-backed. Related: [[households-and-onboarding]], [[members]].

## Overview

Email/password + Google OAuth, backed by Supabase. Session gating chains `RequireAuth` → `RequireHousehold` → `AppShell` (see [[households-and-onboarding]]).

## Rules / flow

- **Email/password** signup & login; **Google OAuth** (callback route consumes the OAuth code, then exchanges it).
- Emails are **normalized to lowercase**.
- On every signup / login / Google callback, the backend **upserts a `profiles` row** mirroring the auth user (`profile.id = auth uid`). `Profile` is the author (`created_by` / `updated_by`) on virtually every entity.
- Refresh + logout supported; logout revokes refresh tokens via the admin client when available.
- Token validation prefers **local JWKS verification** (no network) via `TokenVerifierService`, falling back to Supabase `getUser`.

## Guards / middleware (backend)

- `AuthMiddleware` — **non-blocking**: populates `req.user` if a valid bearer token exists.
- `SupabaseAuthGuard` — enforces auth on protected routes.
- `@CurrentUser()` decorator injects the user.

## Where it lives in code

- **core**: `features/auth/{api,hooks,model}`, `shared/stores/auth-store.ts`, `shared/oauth.ts`.
- **frontend-web**: `src/features/auth/ui/*` — login, signup, forgot/reset password, `/auth/callback`, `require-auth.tsx`.
- **backend**: `src/modules/auth/` (`auth.service.ts`, `token-verifier.service.ts`, `guards/supabase-auth.guard.ts`, `middleware/auth.middleware.ts`, `repositories/prisma-auth.repository.ts`).
- **mobile-app**: `app/auth.tsx`, `app/signup.tsx`, `app/auth/{forgot,reset}-password.tsx`, `src/features/auth/`, `src/shared/native-oauth.ts`. At parity with web since 2026-09-11.

## The OAuth round trip differs by platform

`shared/oauth.ts` is injected, because the two hand-offs have nothing in common:

- **Web** leaves the page (`window.location.assign`) and returns as a *fresh
  load* on `/auth/callback`, which reads `?code` off its own URL.
- **Native** never unmounts. `WebBrowser.openAuthSessionAsync` opens an in-app
  tab and hands the callback URL *back as a value*, so there is no native
  `/auth/callback` route — the deep link is intercepted before the router sees
  it. Adding one would be dead code.

Hence `start` resolving to `string | null`: web never resolves (the page is
gone), native resolves with the URL, and **null means the user dismissed the
sheet** — a cancel, so no error toast.

Mobile Google sign-in requires `moneyspace://auth/callback` registered as a
Supabase redirect URI and a **dev build**; it cannot work in Expo Go.

Mobile's reset-password screens live at `/auth/forgot-password` and
`/auth/reset-password`, not at flatter paths: `resolveNextPath` treats any
`/auth/*` as a loop to avoid, so a bounced reset link must not land on itself.
Supabase returns the recovery token in the URL **fragment**, which
`useLocalSearchParams` never sees — native reads it off the launch URL.

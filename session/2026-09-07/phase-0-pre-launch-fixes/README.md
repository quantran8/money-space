# Phase 0 — pre-launch data and operations fixes

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/phase-0-pre-launch-fixes/`
- **Status**: done

## What the task is

Groundwork before the freemium/subscription work (plan: `~/.claude/plans/l-n-k-ho-ch-cho-rosy-kay.md`).
An audit found two frozen-date bugs corrupting real data and five gaps that make
the app unsafe to charge money for. None of this is billing code — it is what
has to be true before anyone pays.

## Changes made

### Frozen dates writing wrong data

- `packages/core/src/features/debts/hooks/use-debts-page.ts` — a new debt's
  `status` was decided by comparing its due date against the literal
  `'2026-07-08'`. Past that date every debt was written as `active`, however far
  overdue. Now compared against today.
- `packages/core/src/features/debts/model/debts-form.ts` — `defaultValues` was a
  const with `borrowedAt: '2026-07-08'`. Replaced with
  `defaultDebtFormValues()`, mirroring `defaultCashflowFormValues`, so the
  default is today. All four call sites updated.
- `backend/src/modules/market-data/market-data.service.ts` — `listMarketPrices`
  and `listFxRates` stamped live provider data with `MARKET_DATA_AS_OF`
  (`'2026-07-06T10:00:00.000Z'`), imported from the **seed** file. Now derived
  from the newest `priceTime` / `asOf` on the rows themselves.
- `backend/src/common/seed/money-space.seed.ts` — deleted. Nothing imported it
  after the change.

### Blank screens

- `web/src/app/route-error-boundary.tsx` (new) + `web/src/app/router.tsx` —
  there was no error boundary anywhere on web; a render error blanked the
  document. Wired as `errorElement` on the layout route, plus two `*` routes for
  404s.
- `mobile/src/components/route-error-boundary.tsx` (new), exported as
  `ErrorBoundary` from `app/_layout.tsx` and `app/(tabs)/_layout.tsx`.

### Forgot password

Was a `<button>` with no handler on the sign-in screen and no endpoint behind it.

- `backend/src/modules/auth/` — `dto/reset-password.dto.ts` (new),
  `requestPasswordReset` + `updatePassword` on the service,
  `POST /auth/password/reset` and `POST /auth/password/update` on the
  controller, both `@Public()`.
- `packages/core/src/features/auth/` — two repository functions, schemas and
  defaults in `model/auth-form.ts`, `hooks/use-password-reset.ts` (new).
- `web/src/features/auth/ui/forgot-password-page.tsx`,
  `reset-password-page.tsx` (both new), routed at `/auth/forgot-password` and
  `/auth/reset-password`; the dead button in `login-view.tsx` is now a `Link`.

### Other

- `backend/src/main.ts` — `app.enableCors()` took no arguments, allowing every
  origin. Now an allowlist from `CORS_ORIGINS`, falling back to open when unset.
- `web/src/features/events/ui/components/quick-action-picker.tsx` — the
  `assetsDebts` group and `upcoming` were commented out as "temporarily hidden",
  so web had lost Buy asset / Sell asset / Borrow money. Mobile shows all seven.
  Restored; every handler already existed.
- `packages/core/src/i18n/resources.ts` — added `common.errorBoundary.*`,
  `auth.forgotPassword.*`, `auth.resetPassword.*`, and the missing
  `whatif.actions.cancel` in `en` (it was in use on web and rendering raw).
- `mobile/app/debts/[debtId].tsx` — dropped a `repaymentEstimate` prop
  `DebtFormSheet` never declared. Unrelated to this task, but it was failing
  `tsc` on main and blocking the typecheck gate.

## Key decisions

- **`asOf` reports the newest row, not `Date.now()`.** Claiming the clock would
  say the data is fresher than it is, and the freshness layer reads this figure
  to decide whether a number can be trusted.
- **Error boundaries are per-segment, not one at the root.** On web the
  `errorElement` sits on the layout route, so a page that throws is replaced
  inside the shell and the nav out of it survives. A root boundary would take
  the whole app down with one page. Same reasoning for the tabs layout on mobile.
- **The recovery token is read from the URL fragment by the host, not core.**
  Supabase returns it as `#access_token=…`; core must never touch `window`, and
  a fragment is not a query param the navigation adapter can see. The web page
  reads it once at mount and passes it into the hook.
- **The reset flow signs the user in on success** rather than bouncing them to
  the login form to retype the password they just chose.
- **Forgot-password never reveals whether an address has an account** — the
  backend always reports success and the confirmation copy is worded the same
  either way. Only a 429 surfaces, because silence there looks like a sent mail.
- **CORS falls back to open when `CORS_ORIGINS` is unset.** Dev and CI need no
  config, and the mobile app sends no `Origin` at all, so it is unaffected either
  way. Production sets the list.
- **`defaultValues` became a function.** A const holding "today" is frozen at
  module load; `defaultCashflowFormValues` already established the shape.

## Mobile app parity notes

Most of this is already shared or done:

- The two frozen dates, the auth repository/hook/schemas and every i18n key are
  in `packages/core` — mobile picks them up with no work.
- The mobile error boundary is **done** in this session (`app/_layout.tsx` and
  `app/(tabs)/_layout.tsx`).
- **Still to port**: the forgot-password and reset-password screens. The hooks
  (`useForgotPasswordPage`, `useResetPasswordPage`) are in core and ready; mobile
  needs the two screens and a link from `app/auth.tsx`.
  - `useResetPasswordPage(accessToken)` takes the token as an argument. On
    mobile it arrives via deep link, so read it from the route params rather
    than a URL fragment.
  - `useForgotPasswordPage(redirectTo)` needs an absolute URL. Web passes its
    own origin; mobile should pass the web app's reset URL — a Supabase recovery
    link cannot open a native screen directly.
- **Do NOT port**: the web `RouteErrorBoundary` (react-router `errorElement` has
  no equivalent), the quick-action picker restoration (mobile already shows all
  seven), and the CORS change (server-side).

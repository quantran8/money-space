# Web navigation adapter (debt detail was unreachable)

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/web-navigation-adapter/`
- **Status**: done

## What the task is

Bug report: clicking a debt row on `/networth` did not open the debt detail
page.

## Changes made

- `web/src/shared/web-navigation.ts` — **new**. react-router-dom behind core's
  `NavigationAdapter` (`useNavigate` / `useLocation` / `useSearchParam`).
- `web/src/main.tsx` — calls `configureNavigation(webNavigation)` next to
  `configureStorage(webStorage)`.

No component or route changed — the click path was already correct.

## Key decisions

- **The root cause was a missing platform injection, not the debts UI.**
  `packages/core/src/shared/navigation.ts` falls back to `NOT_CONFIGURED`, whose
  `useNavigate` returns `() => {}`. `mobile/src/shared/bootstrap.ts` installs an
  adapter; **web never did**. So every `navigate()` inside a core hook returned
  silently. `DebtListItem` → `onViewDetail` → `useDebtsPage.openDetail` →
  `navigate('/debts/:id')` → nothing.
- **Why it went unnoticed**: `RequireAuth` and `RequireHousehold` redirect
  DECLARATIVELY with `<Navigate>`, so login, signup and onboarding still moved
  between screens. Only the flows where an imperative `navigate()` is the
  mechanism stayed put, and those are all reached from inside a page.
- **Everything else it also fixes** (same one-line install, no extra work):
  - `use-logout` → `/auth` after signing out
  - `use-auth-page` → the post-login / post-signup redirect and its handoff state
  - `use-google-callback` → leaving `/auth/callback`
  - `use-onboarding-page` → `/` after creating a household
  - `use-events-page` → "Vay tiền" / "Mua tài sản" / "Sắp tới" quick actions,
    including the `state: { openCreate | buyAsset }` handoff into `/networth`
  - `use-join-invite` → the invite flow
  - `use-debts-page`'s `location.state.openCreate` (it read the no-op location,
    so the state handoff never arrived either)
- **`useCallback` on the returned navigate**: core is free to put it in a
  dependency array, and react-router's own `navigate` is already stable — the
  wrapper only preserves that rather than minting a new identity per render.
- Verified no collision from the newly-live state handoff: the networth page's
  own effect keys on `buyAsset` while `useDebtsPage` keys on `openCreate`.

## Mobile app parity notes

- **Nothing to port.** Mobile already installs `nativeNavigation` in
  `mobile/src/shared/bootstrap.ts`; this closes the gap on web only.
- Worth knowing for future core work: a new `configure*` injection added to core
  must be installed in BOTH `web/src/main.tsx` and `mobile/src/shared/bootstrap.ts`,
  and core's no-op fallbacks fail silently rather than throwing.

# Dashboard load performance

- **Date**: 2026-08-15
- **Session folder**: `session/2026-08-15/dashboard-load-performance/`
- **Status**: done

## What the task is

Home took ~6.2s to finish loading (DevTools network panel: 15 requests, several
individual endpoints at 1.8–2.8s, and a 401 → refresh → retry cascade in front
of everything). Find the cause and fix it. Backend changes live in the sibling
`money-space-backend` repo; this file records the whole picture because the two
halves only make sense together.

## What was actually wrong

Measured, not guessed:

1. **Every DB query cost ~270ms.** `DATABASE_URL` pointed at Supabase's
   transaction-mode pooler (`:6543`, `?pgbouncer=true`). The same query on the
   session-mode endpoint (`:5432`) took ~53ms, and raw TCP RTT to the region is
   57ms — so ~215ms per query was pgbouncer overhead, not network. Every
   endpoint issues several queries, so this multiplied into everything else.
2. **`HouseholdAccessGuard` ran two queries in sequence** on every
   household-scoped request — ~540ms in front of every handler — and services
   then called `assertHousehold`, a third lookup of the same row.
3. **`forecast`, `flexible-money` and `financial-state` were three requests**
   that each re-loaded the same 5-query bundle and re-ran the same engine.
   `flexibleMoney` and `financialState` are pure functions of `forecast`.
4. **The first request of every aged-out session was a guaranteed 401.** The
   auth store restored the persisted token without checking `session.expiresAt`
   (a field it already had), so page load spent 401 + refresh + retry — ~2s —
   before the real requests started.

## Changes made

### Frontend (this repo)

- `src/features/forecast/api/forecast.repository.ts` — added `getForecastBundle`
  + the `ForecastBundle` type, hitting the new `GET /forecast-bundle`. The three
  single-value functions stay for callers that need only one.
- `src/features/forecast/hooks/use-forecast.ts` — `useForecast`,
  `useFlexibleMoney` and `useFinancialState` now share one query (one key, one
  request) and narrow it with `select`. Their return shapes are unchanged, so no
  call site needed touching.
- `src/shared/api/query-keys.ts` — replaced `forecast` / `flexibleMoney` /
  `financialState` with `forecastBundle(householdId, horizonDays)` and the
  prefix key `forecastBundleAll(householdId)`.
- `src/features/{assets,debts,events,cashflow,freshness,reserves}/hooks/*` —
  each hand-listed `['households', id, 'forecast']` / `'flexible-money'` /
  `'financial-state'` invalidation array collapsed to
  `queryKeys.forecastBundleAll(id)`.
- `src/shared/stores/auth-store.ts` — added `isAccessTokenExpiring()`
  (60s skew).
- `src/features/auth/api/auth-bridge.ts` — added `ensureFreshToken()`, which
  refreshes before returning the token when it has aged out. Concurrent callers
  share `silentRefresh`'s in-flight promise, so a page firing a dozen requests
  refreshes once.
- `src/shared/api/http.ts` — `apiRequest` awaits `ensureFreshToken()` instead of
  reading `getToken()`. The 401 retry stays as the fallback.

### Backend (`money-space-backend`)

- `.env` — `DATABASE_URL` moved to `:5432` with `connection_limit=8`.
- `src/database/prisma/prisma.service.ts` — the `DIRECT_URL` transaction client
  is now compared by host + database instead of raw string, so it isn't opened
  when both URLs already address the same session-mode endpoint.
- `src/modules/auth/guards/household-access.guard.ts` — the household and
  membership lookups run in `Promise.all`.
- Dropped the redundant `assertHousehold` from `forecast`, `goals`, `snapshots`,
  `assets` (summary only) and `debts` list paths; `attention` moved its (real,
  `updateFrequency`-carrying) household read into its existing `Promise.all`.
- `forecast.service.ts` / `forecast.controller.ts` — new
  `GET /api/households/:householdId/forecast-bundle`.

## Key decisions

- **The three forecast endpoints were kept.** Only the client changed. Removing
  them would break the mobile app before it is ported.
- **`select` over three separate queries.** Sharing one cache entry and slicing
  it per hook meant every existing `useForecast()` / `useFlexibleMoney()` /
  `useFinancialState()` call site kept working untouched.
- **Invalidation moved to one prefix key.** This also fixed a latent bug: the
  asset, debt and event write paths invalidated `forecast` and `flexible-money`
  but *not* `financial-state`, so that panel could show a stale reading after a
  write.
- **Proactive refresh, 401 retry retained.** Expiry checking handles the
  predictable case; the retry still covers a token the server rejects for any
  other reason.
- **`assertHousehold` removal is safe** because `HouseholdAccessGuard` is an
  `APP_GUARD` and every one of these routes is `/api/households/:householdId/*`,
  so the household (404) and membership (403) are already settled before the
  handler runs. It stays where the household row is real response data
  (`listAssets`, `listMembers`, dashboard, attention).

## Verification

- Backend `npm run build` clean; `npm test` 248/248 pass (one spec updated:
  `forecast.service.spec.ts` no longer expects `assertHousehold`).
- Frontend `npm run build` clean. `npm run lint` reports only pre-existing
  problems, none in the touched files.
- Replaying one page load's query mix at the DB layer, old vs new shape:
  **~1753ms → ~744ms median** server-side. That excludes the ~2s 401/refresh
  cascade and the two fewer HTTP requests, which land on top.

## Mobile app parity notes

- Port the `forecast-bundle` fetch + shared-cache-with-`select` pattern; the
  mobile app currently mirrors the three-endpoint shape.
- Port the proactive-refresh change (check `expiresAt` before sending, refresh
  once, keep the 401 retry).
- The invalidation-key collapse is React-Query-specific in mechanism but the
  bug it fixes is not: whatever the mobile cache does, an asset/debt/event write
  must also drop `financialState`.
- The `.env` and guard changes are backend-only — nothing to port.

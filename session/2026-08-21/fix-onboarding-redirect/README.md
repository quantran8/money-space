# Fix: onboarding does not redirect to dashboard after creating a household

- **Date**: 2026-08-21
- **Session folder**: `session/2026-08-21/fix-onboarding-redirect/`
- **Status**: done

## What the task is

On production (`/onboarding`), creating a household showed the success toast but
left the user on the onboarding screen instead of landing them on the dashboard.

## Root cause

`RequireHousehold` is the **only** consumer of the `['households']` query, and it
is not mounted while the user is on `/onboarding` — that route sits outside the
gate. So during the create mutation the query has **no active observer**.

`queryClient.invalidateQueries()` defaults to `refetchType: 'active'`
(verified in `@tanstack/query-core` 5.101.2 → `invalidateQueries` delegates to
`refetchQueries({ type: filters?.refetchType ?? filters?.type ?? 'active' })`).
With nothing observing the key, it marked the entry stale and **resolved without
fetching** — so the `await` that was deliberately placed there to prevent a
bounce guaranteed nothing.

`navigate('/')` then mounted `RequireHousehold`, which read the still-cached
`total: 0` synchronously and redirected straight back to `/onboarding`. The
navigation *did* happen; it was immediately undone, so it looked like no redirect.

Both the create and the join path used `replace: true`, so no history entry was
left behind to hint at the round trip.

## Changes made

- `src/features/onboarding/hooks/use-onboarding-page.ts` — `invalidateQueries` →
  `refetchQueries` for `queryKeys.households`, with a comment explaining why
  invalidation is not enough here.
- `src/features/invites/hooks/use-join-invite.ts` — same fix. `/join` is also
  deliberately outside `RequireHousehold` (someone accepting an invite has no
  household yet), so it had the identical latent bug on the accept path.

## Verification

- `npm run build` (tsc -b + vite build) passes.
- Runtime repro against the installed `@tanstack/query-core`, simulating an
  observer-less cache holding `total: 0`:
  - `invalidateQueries` → cache stays `total=0` → bounced back to `/onboarding`
  - `refetchQueries`   → cache becomes `total=1` → lands on the dashboard

## Key decisions

- Fixed at the **cache-write** site rather than by mounting `useMyHouseholds` on
  the onboarding page, or by seeding the cache with `setQueryData` from the POST
  response. Refetching keeps the gate reading one authoritative server shape;
  hand-building the list response would duplicate that shape in two places.
- Left `RequireHousehold` untouched — its logic is correct given a correct cache.

## Mobile app parity notes

- The same defect applies to any client that gates on a "do I have a household"
  query which is not mounted on the onboarding/join screen. Port the rule:
  **after creating or joining a household, force a refetch, not an
  invalidation, before navigating into the gated area.**
- The `refetchType: 'active'` default is TanStack-Query-specific. On a different
  data layer the equivalent trap is any "mark stale" API that is lazy for
  unobserved keys.

# After leaving a space with no household left → onboarding, and stay there

- **Date**: 2026-09-06
- **Session folder**: `session/2026-09-06/leave-space-onboarding-flow/`
- **Status**: done

## What the task is

Once a user leaves their only space they must land on create-or-join, and stay
there until they actually create or join one.

Follows on from `session/2026-09-06/non-owner-leave-space/`, which put the
leave action on the settings page for non-owners.

## Changes made

- `packages/core/src/features/members/hooks/use-members-page.ts` — the leave
  branch no longer touches the households query. It clears
  `activeHouseholdId` only, and exposes a new `clearHouseholdsCache()` for the
  caller to run *after* navigating.
- `web/src/features/settings/ui/settings-page.tsx` — leave now does
  `navigate('/onboarding', { replace: true })` then `clearHouseholdsCache()`,
  in that order.
- `web/src/features/onboarding/ui/require-no-household.tsx` — **new**.
  The mirror of `RequireHousehold`: someone who already has a household and
  reaches `/onboarding` is sent to `/`.
- `web/src/app/router.tsx` — `/onboarding` wrapped in `RequireNoHousehold`.
- `web/src/features/onboarding/ui/components/onboarding-header.tsx` — the
  avatar became a dropdown holding sign-out (reuses `shell.accountMenu` and
  `shell.logout`; no new copy).

## Key decisions

- **`removeQueries` after navigating, not `invalidateQueries` before it.**
  This is the inverse of the 2026-08-21 onboarding-redirect bug and it fails
  the opposite way. The settings page sits *inside* `RequireHousehold`, so the
  households query DOES have an active observer there — `invalidateQueries`
  refetches for real, resolves `total: 0` while the settings page is still
  mounted, and the gate redirects out from under the caller mid-`await`. The
  user still reached `/onboarding`, but via a race between the gate and the
  page's own `navigate`. Navigating first and *removing* the entry second (not
  refetching it) means no observer ever sees `total: 0`, and the next reader
  fetches fresh.
- **`replace: true`.** Back must not return to the settings page of a space
  the user no longer belongs to.
- **Onboarding is a dead end on purpose; the gate gives it a *second* exit,
  not a back door.** `RequireNoHousehold` only redirects people who DO have a
  household (stale tab, bookmark, back button after joining). Someone with
  none stays put — that is the requested behaviour.
- **Sign-out had to be added.** With no sidebar, no tab bar and no household,
  onboarding had zero ways off it other than answering the question. That is a
  trap rather than a dead end, so the account menu carries sign-out.

## Mobile app parity notes

- Core's `use-members-page.ts` is shared, so mobile already gets the cache-order
  fix — but **only if its leave flow calls `clearHouseholdsCache()` after
  navigating**. The hook no longer refreshes the list on its own; a mobile
  caller that just calls `removeMember` will leave a stale list in cache.
- `RequireNoHousehold` is web routing (react-router). Mobile needs the same
  rule expressed in its own navigator: no household → onboarding, has one →
  out of onboarding.
- Mobile's onboarding screen needs the same check for a sign-out affordance;
  if it has no household switcher or drawer there, it has the same trap.

---

## Follow-up: leaving needed its own endpoint (403)

Leaving 403'd in practice:

```
DELETE /api/v1/households/:id/members/:memberId
403 "Only the member who created this household can do that"
```

`DELETE /members/:memberId` carries `@RequireHouseholdCreator()` because
*removing someone* is one of the three lifecycle operations. The guard is
all-or-nothing on the route, so it also blocked a non-creator removing their
**own** row — leaving has never actually worked on the backend, and the
frontend has been offering it against an endpoint that always refused.

### Changes (backend)

- `src/modules/members/members.controller.ts` — new `DELETE /members/me`,
  ungated beyond membership, declared **before** `@Delete(':memberId')` (Nest
  matches in declaration order; the other way round `me` arrives as a member id
  and 404s). Takes no id — the row comes from `@CurrentMembership()`.
- `src/modules/members/members.service.ts` — `leaveHousehold(householdId,
  membership)`. Refuses the creator (`BadRequestException`, same structural
  reason as `deleteMember`) and refuses an absent membership
  (`ForbiddenException`).
- `src/modules/members/members.service.spec.ts` — 4 tests: ordinary member
  leaves, creator refused, no-membership refused, row not in household 404s.

### Changes (frontend)

- `packages/core/.../members.repository.ts` — new `leaveHousehold(householdId)`.
- `packages/core/.../use-members.ts` — new `leaveHousehold` mutation, with **no**
  `onSuccess: invalidate` (after leaving there is no members list to refresh and
  asking for one would 403).
- `packages/core/.../use-members-page.ts` — `removeMember` now branches: leaving
  calls `leaveHousehold`, removing calls `deleteMember`. `isRemoving` covers both.

### Key decision

**A separate route, not a self-exemption in the guard.** The first attempt added
an `@AllowSelf()` marker that let the creator gate pass when `:memberId` matched
the caller's own resolved row. It worked, but it made one URL mean two things —
"delete this member" was sometimes a lifecycle operation and sometimes leaving,
distinguishable only by comparing the id to your own token. `DELETE /members/me`
carries no id at all, so there is nothing in the request that could name someone
else, and the permission difference is visible in the route rather than buried in
a guard branch. That approach was reverted; the guard is untouched.

### Mobile parity

- Mobile must call the new `leaveHousehold` mutation for a member leaving. Using
  `deleteMember` with your own id still 403s — that is correct behaviour now, not
  a bug to work around.

---

## Follow-up 2: still landed on the dashboard after leaving (the real bug)

Leaving succeeded, but `/` still rendered. Two causes, one of them mine.

### Cause A (backend, the actual one)

`getHouseholdsForUser` matched membership without checking that the membership
was live:

```ts
householdMembers: { some: { userId } }          // before
householdMembers: { some: { userId, deletedAt: null } }   // after
```

`deleteMember` **soft-deletes** the member row (FKs from audit rows and owned
assets point at it). The household row itself is untouched — correctly, the
other member still lives there — so `some: { userId }` kept matching forever.
`GET /households` is what gates the entire app client-side, so the user was
handed back the dashboard of a space they had left; every request inside it
then 403'd via `HouseholdAccessGuard`, which *does* check `deletedAt` on
membership. That mismatch between the guard and the list query is the bug.

- `src/modules/households/repositories/prisma-households.repository.ts` — fixed.
- It is the only `householdMembers: { some: ... }` in the codebase; nothing else
  had the same hole.

**Verified against the live DB**, not just by reading: for the real
soft-deleted membership from this session, the old `where` returned the left
household and the new one returns `[]`.

### Cause B (frontend, mine from follow-up 1)

`clearHouseholdsCache()` used `removeQueries` *after* navigating, on the theory
that nothing observes the query by then. Wrong: `RequireHousehold` sits **above**
the settings page and stays mounted, so it is an active observer — `removeQueries`
drops the entry and that live observer immediately refetches it. The cache is
never actually empty, and the refetch was uncontrolled.

Replaced with an awaited `refetchQueries` **inside** `removeMember`, before the
caller navigates. With Cause A fixed that fetch returns an empty list, so the
gate agrees with the navigation instead of racing it. `clearHouseholdsCache` is
gone from the hook and from the settings page.

### Correction to follow-up 1's stated reasoning

Follow-up 1 claimed refetching before navigating was unsafe because the gate
would "redirect out from under the caller mid-await". Redirecting is the correct
outcome here — the user has no household — and `navigate(..., { replace: true })`
after it is harmless. The genuine constraint is only that the fetch must be
awaited so the destination is deterministic.

### Mobile parity

- The backend fix is shared, so mobile gets it for free.
- Core's `removeMember` now refetches on its own again; a mobile caller only
  needs to `navigate` after it. There is no `clearHouseholdsCache` to call.

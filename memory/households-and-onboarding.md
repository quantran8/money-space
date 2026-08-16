# Households & onboarding

Creating the shared finance space and getting both partners in. Related: [[members]], [[auth]], [[settings-and-sharing]].

## Overview

A `Household` is the aggregate root (see [[domain-overview]]). Onboarding creates one and optionally invites a partner. Gating: `RequireAuth` → `RequireHousehold` → `AppShell`. A user with no household is forced to `/onboarding`.

## Create-household flow (transactional)

1. Upsert the owner's profile.
2. Create the household.
3. Create the creator as a member with role `owner` + permission `admin` (see [[members]]).
4. Optionally create a pending `HouseholdInvite` (7-day TTL, random token; defaults partner / view_detail).
5. Write an `household.created` audit log with `{ invitedPartner }` metadata.

## Validation

- `name` required (frontend ≤ 40 chars; settings allows ≤ 60).
- `currency` is an ISO-4217 3-letter code validated against the **`currencies`
  reference table** (seeded VND, USD, EUR, THB, JPY, GBP, AUD, SGD, CNY, KRW; DB
  FK to `currencies(code)`), default VND. This replaced the old per-feature
  hardcoded enum sets — the onboarding `VND | USD | THB` vs settings `VND | USD | EUR`
  inconsistency is gone. See [[settings-and-sharing]].
- Optional partner-invite email validated **only when non-empty** (regex).
- `updateFrequency` must be weekly / monthly / manual (backend falls back to `manual`).

## Active household

The active household id is kept in a zustand `household-store`; `use-my-households` lists memberships; `use-active-household` resolves the current one.

## Invite state machine

`HouseholdInvite`: pending → accepted / expired / cancelled. Unique token, expiry, default role/permission for the invitee. (Accept flow not yet exposed via a controller — only creation on household-create.)

## Where it lives in code

- **frontend-web**: `src/features/onboarding/{model/onboarding-form.ts, hooks/use-my-households.ts, hooks/use-onboarding-page.ts, api/onboarding.repository.ts, ui/require-household.tsx}`, `src/shared/stores/household-store.ts`, `src/shared/hooks/use-active-household.ts`.
- **backend**: `src/modules/households/` (`households.service.ts`, `repositories/prisma-households.repository.ts`).
- **mobile-app**: to be ported.

## Enums

`currency` = ISO-4217 code (FK to `currencies`), `InviteStatus = pending | accepted | expired | cancelled`, `updateFrequency = weekly | monthly | manual`.


## v3.1 onboarding wizard (Phase 11)

The spec's steps folded into **9 screens**, resumable via `{onboardingStep,
householdId}` persisted in `shared/stores/household-store.ts`.

Order: household → financial mode → invite → money sources → recurring income →
obligations → main goal → **first financial picture (Clarity Moment)** →
**first what-if (Consequence Moment)**.

The persisted store is **versioned** (`version: 1`) because the list changed: a
household left mid-setup on the retired `reserve` step would otherwise rehydrate
onto a step that no longer exists — `indexOf === -1`, an empty wizard body, a
dead Back button, and `RequireHousehold` refusing to let them out of onboarding.
`migrate` moves them to the step that followed it. Any future change to
`ONBOARDING_STEPS` must bump the version the same way.

Rules that matter:

- **Steps write immediately, not batched at the end.** A user who abandons
  halfway keeps what they entered.
- **Every step writes through the normal slice hooks.** Onboarding is a
  different sequence over existing features, never a second implementation of
  them.
- **Only step 1 is mandatory.** Everything after the household is skippable — a
  user who wants to look around first must not be trapped in setup.
- **`RequireHousehold` gates on the step, not just household count.** After step
  1 the user has a household, so a count-only check would wave a half-finished
  wizard through into the app.
- The wizard ends on the two moments deliberately: the setup earns its length by
  paying off in clarity and consequence rather than dumping the user on an empty
  Home.

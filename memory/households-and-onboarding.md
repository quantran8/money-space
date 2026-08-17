# Households & onboarding

Creating the shared finance space and getting both partners in. Related: [[members]], [[auth]], [[settings-and-sharing]].

## Overview

A `Household` is the aggregate root (see [[domain-overview]]). Gating:
`RequireAuth` → `RequireHousehold` → `AppShell`. A user with no household is sent
to `/onboarding`, which asks **one question with two answers**: create a
household, or join one.

## Create-household flow (transactional)

1. Upsert the owner's profile.
2. Create the household.
3. Create the creator as a member. No role and no permission — those enums are
   gone; `households.created_by` is the only distinction (see [[members]]).
4. Optionally create a pending `HouseholdInvite` when `inviteEmail` is supplied.
   **The web client no longer sends it** — inviting is a QR code shown from
   `/household` after the fact — but the backend path remains for other clients.
5. Write a `household.created` audit log with `{ invitedPartner }` metadata.

## Validation

- `name` required (frontend ≤ 40 chars; settings allows ≤ 60).
- `currency` is an ISO-4217 3-letter code validated against the **`currencies`
  reference table** (seeded VND, USD, EUR, THB, JPY, GBP, AUD, SGD, CNY, KRW; DB
  FK to `currencies(code)`), default VND. This replaced the old per-feature
  hardcoded enum sets — the onboarding `VND | USD | THB` vs settings `VND | USD | EUR`
  inconsistency is gone. See [[settings-and-sharing]].
- Optional partner-invite email (backend only now) validated **only when
  non-empty** (regex).
- `updateFrequency` must be weekly / monthly / manual (backend falls back to `manual`).

## Active household

The active household id is kept in a zustand `household-store`; `use-my-households` lists memberships; `use-active-household` resolves the current one.

## Invite state machine

`HouseholdInvite`: pending → accepted / expired / cancelled. Unique token, expiry.
No default role or permission — those columns were dropped. The full invite and
accept flow is documented in [[members]] (client) and the backend's
`memory/invites.md`.

## Where it lives in code

- **frontend-web**: `src/features/onboarding/{model/onboarding-form.ts, hooks/use-my-households.ts, hooks/use-onboarding-page.ts, api/onboarding.repository.ts, ui/onboarding-page.tsx, ui/require-household.tsx}`, the join branch in `src/features/invites/ui/components/join-by-code-panel.tsx`, `src/shared/stores/household-store.ts`, `src/shared/hooks/use-active-household.ts`.
- **backend**: `src/modules/households/` (`households.service.ts`, `repositories/prisma-households.repository.ts`).
- **mobile-app**: to be ported.

## Enums

`currency` = ISO-4217 code (FK to `currencies`), `InviteStatus = pending | accepted | expired | cancelled`, `updateFrequency = weekly | monthly | manual`.


## Onboarding is create-or-join, and nothing else

Two branches on one screen, equally weighted:

- **Create** — name + currency, then straight into the app.
- **Join** — paste the invite link (or just the token), or scan the QR with the
  camera. Both routes hand off to `/join`, so the preview and the accept have
  exactly one implementation. See [[members]].

Joining is **not** secondary to creating: the second person in a couple is always
a joiner, so half of everyone who sees this screen is there for that branch.

### The nine-screen wizard is gone

It ran household → financial mode → invite → money sources → recurring income →
obligations → main goal → first financial picture → first what-if, resumable via
`onboardingStep` in `shared/stores/household-store.ts`.

Why it was removed: every screen after the first set up a feature that already
owns its own entry point inside the app, so the wizard asked for the household's
entire financial position before showing anything. And because the step was
persisted, closing the tab pinned the user back into setup — `RequireHousehold`
gated on the step, not just on household count, so a half-finished wizard could
not be escaped by navigating away.

What survives is the only genuine precondition: **the user needs a household to
write against.** `RequireHousehold` now gates on household count alone.

The store is at `version: 2`, whose `migrate` **deletes** `onboardingStep`. It has
to be actively dropped rather than ignored: anyone mid-wizard when this shipped
would otherwise carry a stored step forever, with nothing left that reads it and
nothing left to clear it.

The two beats the wizard ended on — the Clarity Moment and the Consequence Moment
— are still the product's thesis; they are just no longer staged by a setup
sequence. Home and `/whatif` are where they land now.

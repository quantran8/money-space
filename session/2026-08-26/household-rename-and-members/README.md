# Household rename + members section to demo

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/household-rename-and-members/`
- **Status**: done

## What the task is

Two follow-ups to the settings redesign:

1. The members section did not match the mockup.
2. Allow renaming the workspace — which the previous task had left read-only
   because the backend had no endpoint for it.

## Changes made

### Rename (backend + core + UI)

- `backend/src/modules/households/repositories/households.repository.interface.ts`
  — new `setName(householdId, name)`.
- `backend/src/modules/households/repositories/prisma-households.repository.ts`
  — implements it as a plain column `updateMany` scoped to `deletedAt: null`.
- `backend/src/modules/households/households.service.ts` — `updateConfig` now
  takes `{ currency?, name? }` and validates **each field only when present**;
  new `HOUSEHOLD_NAME_MAX = 60`.
- `backend/src/modules/households/households.controller.ts` — body type widened.
- `backend/memory/households-and-onboarding.md` — documents the endpoint.
- `packages/core/.../settings.repository.ts` — `updateHouseholdConfig` takes a
  payload instead of a bare currency.
- `packages/core/.../use-settings-page.ts` — sends the trimmed name, and rolls
  it back with currency/language when the request fails.
- `web/.../household-overview-card.tsx` — the panel gained a `PanelHeader`
  ("Không gian gia đình"); the household name IS the field now — one `t-title`
  input, no separate display heading, no labelled name row. The eyebrow, the
  `spaceNote` sentence and the `VND · VI` summary were all removed.

### Members section

- `web/.../member-row.tsx` — `-mx-3 px-3` so rows sit flush with the panel's
  content edge and the hover band bleeds 12px past it; `min-h-[72px]`, `py-1`.
- `web/.../members-list-section.tsx` — the solo-household prompt block is gone,
  the invite button is always in the header, and the pending-invite count is a
  plain caption instead of a wash strip.

## Key decisions

- **`updateConfig` validates per field, not per request.** It used to throw
  unless a valid currency was present, which is why a rename could not be
  expressed at all. Now absent means "not changing"; present means "must be
  valid". Strictly more permissive — every existing caller sends currency.
- **Rename is NOT creator-guarded.** Delete and transfer-steward are, because
  they end or move the space. What it is called is a shared fact either partner
  may correct.
- **`setName` is a column update, not a jsonb merge** like `setDisplayCurrency`
  — `households.name` has its own column. Scoped to `deletedAt: null` so a
  stray id cannot touch a soft-deleted row.
- **The name is the field, not a heading above one.** Showing it twice made the
  panel restate one fact in two places and needed a label to tell them apart.
  The `VND · VI` summary went for the same reason — it repeated the two selects
  directly beneath it — and `spaceNote` explained what the controls already say.
- **Written as a plain `<input>`, not the `Input` primitive.** `Input`
  hard-codes `t-body-sm`, and `cn` is twMerge, which does not know the custom
  `t-*` classes — both steps would reach the DOM and CSS source order would
  silently pick the size. That is the exact bug `button.tsx` documents.
- `settings.household.spaceEyebrow` renamed to `spaceTitle`: it is a panel title
  now, and a key called "eyebrow" used as one is drift waiting to mislead.
  `spaceNote` deleted (vi + en).
- **The solo prompt had it backwards**: it replaced the header invite button
  with a block below the list, so the one household that most needs to invite
  someone was the only one without the action in the header.
- `members.list.soloPrompt` was **kept** in i18n — mobile's
  `members-section.tsx` still uses it in two places.

## Mobile app parity notes

- **Core is shared and already ported**: `updateHouseholdConfig` now takes a
  payload — any mobile caller passing a bare currency string must be updated.
  (Checked: mobile has no direct caller; it goes through `useSettingsPage`.)
- **Backend is shared** — mobile gets the rename endpoint for free.
- Mobile's settings screen still shows the household name read-only; it can now
  become a field, using the same `Settings.householdName` form value.
- Mobile's `members-section.tsx` still renders the solo prompt. If porting the
  web behaviour, move the invite action into the section header first —
  otherwise a solo household loses the action entirely.

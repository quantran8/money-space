# Báo lỗi / Góp ý (feedback)

- **Date**: 2026-09-11
- **Session folder**: `session/2026-09-11/feedback-bug-report/`
- **Status**: done

## What the task is

The app had no channel of any kind for a user to report a bug or send an idea —
no route, no module, no i18n namespace, not even a `mailto:`. Before launch that
is a real gap: when a user hits one of the known rough edges there is no way for
them to tell us.

Ship a report form on **both** web and mobile, storing to Postgres and nothing
else. No email, no webhook, no new dependency — submissions are read in the
Supabase dashboard.

## Changes made

**backend** (separate repo, same change set)

- `prisma/schema.prisma` — `Feedback` model + `FeedbackType` enum, appended after `AuditLog`
- `prisma/migrations/20260911090000_feedback/migration.sql` — table, enum, two indexes, a CHECK constraint
- `src/modules/feedback/` — controller, service, dto, entity, repository interface + Prisma impl
- `src/modules/money-space.module.ts` — registered `FeedbackModule` in both arrays
- `memory/feedback.md` — new domain doc; indexed in `memory/README.md`

**packages/core**

- `shared/api/env.ts` — `EnvConfig` gains `platform` and `appVersion`; both optional in `configureEnv`, so every existing call site is unaffected
- `features/feedback/api/feedback.repository.ts` — `submitFeedback`, types
- `features/feedback/model/feedback-form.ts` — `FEEDBACK_MESSAGE_MAX`, defaults, `buildFeedbackSchema(t)`
- `features/feedback/hooks/use-feedback.ts` — form + mutation + context gathering, shared by both clients
- `i18n/resources.ts` — new `feedback` namespace, vi and en

**web**

- `src/features/settings/ui/components/feedback-card.tsx`, `feedback-dialog.tsx`
- `src/features/settings/ui/settings-page.tsx` — `<FeedbackCard />` between `<DataCard />` and `<SignOutCard />`
- `vite.config.ts` — first `define` block, stamping `__APP_VERSION__` from package.json
- `src/globals.d.ts` — new file, declares `__APP_VERSION__`
- `src/main.tsx` — `configureEnv` now passes `platform: 'web'` and `appVersion`

**mobile**

- `src/features/settings/ui/feedback-section.tsx`, `feedback-sheet.tsx`
- `app/(tabs)/household.tsx` — `<FeedbackSection />` immediately above `<SignOutSection />`
- `src/shared/bootstrap.ts` — `configureEnv` now passes `platform` from `Platform.OS` and `appVersion` from `expo-constants` (already a dependency; nothing installed)

## Key decisions

- **The endpoint is user-scoped `POST /feedback`, not `households/:id/feedback`.**
  A report is one person's message, not household property — and the report worth
  the most comes from someone stuck in onboarding or a redirect loop, where
  `activeHouseholdId` is `null` and a household-scoped path offers no URL at all.
  `householdId` rides along as an unverified context hint with no FK.
  Consequence: `HouseholdAccessGuard` passes through (it returns `true` when the
  route has no `:householdId`), so the service takes the actor from the bearer
  token and trusts nothing in the body. Also means `CacheInvalidationInterceptor`
  never fires, so `@NoCacheInvalidation()` is deliberately absent.
- **POST only, no GET.** A list endpoint would need an authorization rule this
  codebase does not have (no admin role, and `backend/CLAUDE.md` forbids
  reintroducing one), so it could only mean "your own reports" — which nobody
  wants. The dashboard is the read path.
- **Not in the activity journal.** `AuditService.record` needs a non-null
  `householdId`, and more importantly the journal exists to make changes to the
  *shared money picture* accountable to a partner. A bug report moves no figure.
- **`context` is one jsonb column, not discrete columns.** Nothing queries inside
  it, and the vocabulary belongs to the clients — a column per field would mean a
  backend migration every time a client learns to report one more thing.
- **Append-only** (no `deletedAt`, no `updatedAt`), the same exception
  `audit_logs` takes.
- **The message is never logged** — the service logs only type and length.
- Full reasoning lives in `backend/memory/feedback.md`, not in code comments.

## Mobile app parity notes

Both platforms shipped together in this change set, so there is **nothing left to
port**. Worth knowing for future work on this feature:

- All the logic is in `packages/core/features/feedback/` and is genuinely shared —
  the form object, the mutation, and the context gathering all live in
  `use-feedback.ts`. Only two files per platform are UI.
- The one platform difference is `userAgent`: web reads `navigator.userAgent` in
  `feedback-card.tsx` and passes it into the hook, because core cannot touch DOM
  (it runs on Hermes). Mobile passes nothing and the field is simply absent.
- `env.platform` / `env.appVersion` are filled by each host's own bootstrap —
  `main.tsx` on web (via a Vite `define`), `bootstrap.ts` on mobile (via
  `expo-constants`). A new host app must set both or reports arrive as
  `unknown` / `0.0.0`.
- Mobile's `Field` is a fixed 46pt box and the kit has no `TextareaField`, so the
  message input overrides height inline. If that proves fragile, the right fix is
  a `multiline` branch in `src/components/ui/field.tsx` — not a hand-rolled
  `TextInput` in the feature.
- Known gap on both platforms: the entry point sits behind `RequireHousehold`, so
  a user with no household cannot reach the form yet even though the endpoint
  accepts them. Closing it is a text link on onboarding; the hook already handles
  `activeHouseholdId === null`.

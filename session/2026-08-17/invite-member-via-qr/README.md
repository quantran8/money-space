# Invite a member via QR code

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/invite-member-via-qr/`
- **Status**: done

## What the task is

"Phần thêm thành viên: update thành khi bấm thì show QR của household và user
khác quét QR để join."

Follow-ups, in the order they arrived:

1. "quét QR thì cần redirect tới side với query param là household id để join."
2. "luôn hiện kèm invite link kèm copy icon, để cho case k quét đc QR."
3. "flow lên apply cho user được invite trên frontend: Invite link → Sign up →
   account created → hệ thống tự accept invite → join household."
4. "onboarding screen: giữ mỗi flow tạo household hoặc join household với link
   hoặc quét qr còn lại bỏ hết."

So: tapping **Mời thành viên** shows a QR code instead of an email form; scanning
lands on the app with the household id in the query string; the link is always on
screen next to the code; signing up through an invite link joins with no confirm
tap; and onboarding is cut down to create-or-join.

## Changes made

### New slice — `src/features/invites/`

- `model/invites.types.ts` — invite entity/preview/accept types mirroring the
  backend, `buildJoinUrl(householdId, token)`, `isShareable`.
- `api/invites.repository.ts` — the five endpoints. Note the deliberate split:
  create/list/revoke are household-scoped, preview/accept are **not**.
- `hooks/use-household-invite.ts` — inviter side. Reuses the existing pending
  invite, auto-creates one when there is none, copy-link, renew (revoke+create).
- `hooks/use-join-invite.ts` — invitee side. Preview, accept (automatically when
  the user arrived straight from signing in), then activate the household and
  invalidate the households list.
- `ui/components/invite-qr-dialog.tsx` — the QR, the always-visible copyable
  link, the expiry.
- `ui/components/join-by-code-panel.tsx` — onboarding's join branch: paste a link
  or scan with the camera.
- `ui/join-page.tsx` — `/join`, the scan destination.

### New shared primitives

- `src/components/ui/qr-code.tsx` — renders a QR via the `qrcode` package to a
  data URL. Always dark-on-white in both themes.
- `src/components/ui/qr-scanner.tsx` — live camera scanner, `jsQR` over
  `getUserMedia`.

### Modified

- `src/app/router.tsx` — added `/join`, behind `RequireAuth` but **outside**
  `RequireHousehold`.
- `src/features/auth/model/next-path.ts` (new) + `require-auth.tsx`,
  `use-auth-page.ts`, `use-google-callback.ts` — a sanitized `?next=` so signing
  in returns to the scanned invite instead of the dashboard, plus the `fromAuth`
  router state that drives auto-accept.
- `src/features/household/ui/household-page.tsx` — mounts `InviteQrDialog`
  instead of `InviteFormDialog`.
- `src/features/members/hooks/use-members-page.ts` — the invite form state is
  gone; the hook is list + remove only. Toasts now go through i18n (they were
  hardcoded unaccented Vietnamese).
- `src/shared/api/query-keys.ts` — `invites`, `invitePreview`.
- `src/features/onboarding/ui/onboarding-page.tsx` — **rewritten** as a two-card
  choice (create / join) plus the two branch panels.
- `src/features/onboarding/hooks/use-onboarding-page.ts` — creating navigates
  straight to `/` instead of handing off to the wizard.
- `src/features/onboarding/model/onboarding-form.ts` +
  `ui/components/onboarding-form.tsx` — name and currency only; the optional
  `inviteEmail` field is gone.
- `src/features/onboarding/ui/require-household.tsx` — gates on household count
  alone; the `onboardingStep` diversion is gone.
- `src/shared/stores/household-store.ts` — reduced to `activeHouseholdId`;
  `version: 2` migrate deletes `onboardingStep`.
- `memory/households-and-onboarding.md` — documents create-or-join and why the
  wizard went.
- `src/i18n/resources.ts` — new `invites.*` block (vi + en), `common.done`,
  `members.list.removed/removeFailed`; the dead email-form copy under
  `members.invite` removed.
- `memory/members.md` — documents the QR flow.
- `package.json` — `qrcode` + `@types/qrcode` (dev), `jsqr`.

### Deleted

- `src/features/members/ui/components/invite-form-dialog.tsx`
- `src/features/members/model/members-form.ts`
- `src/features/onboarding/hooks/use-onboarding-wizard.ts`
- `src/features/onboarding/ui/components/{wizard-shell,wizard-steps,invite-section,onboarding-sidebar}.tsx`

### Backend (`money-space-backend`) — bug fix found while testing

`POST /api/households/:id/invites` returned a 500:
`column "default_role" of relation "household_invites" does not exist`.

- `src/modules/invites/repositories/prisma-invites.repository.ts` — the raw
  `INSERT … SELECT` still named `default_role` and `default_permission_level` in
  its column list (and was already 11 columns against 9 values). Both columns
  were dropped by the role/permission migrations. Removed them, and documented
  why the statement is raw and what going raw costs.
- `prisma/schema.prisma` — removed the orphaned `permissionLevel` comment left
  dangling above `expiresAt`.

Then a second 500, `23514`: `household_invites_contact_present` required
`invitee_email` or `invitee_phone`, which a QR invite has neither of.

- `prisma/migrations/20260817180000_invite_contact_optional/migration.sql` (new) —
  drops the constraint. **Applied to the live database** (non-destructive
  `DROP CONSTRAINT IF EXISTS`; reversible by re-adding it).
- `memory/invites.md` — records that an invite needs no contact details, that the
  create gate is `@RequireHouseholdCreator()` on create only (the table said
  "admin"), and a warning about the raw INSERT's invisible column list.

## Key decisions

- **The QR URL carries the household id *and* the token.** The request was for
  the household id as a query param; the token had to come along because there
  is no join-by-household-id on the server. `POST /api/invites/:token/accept` is
  the only join path, and that is right: a household id appears in every request
  path a member makes, so it is not a secret — anything scannable by id alone
  would be an open door. `household` names the destination, `token` authorizes.
  Where they disagree the server's answer wins.
- **Opening the dialog reuses the existing invite.** Minting a token per open
  would leave a household holding a pile of live secrets. Replacing one is the
  explicit "Tạo mã mới" action (revoke, then create).
- **`/join` sits outside `RequireHousehold`.** Whoever scans usually has no
  household, and that gate would send them to `/onboarding` — the opposite of
  joining one. This mirrors why the server's accept route has no `:householdId`.
- **`?next=` was necessary, not incidental.** Someone scanning on a phone is
  rarely signed in on it, and the old `RequireAuth` dropped the URL. Sanitized
  against open redirect (single-slash in-app paths only) and against an
  `/auth → /auth` loop.
- **The email invite is fully gone, not kept alongside.** It created a
  placeholder member row from an address the inviter typed; accept creates the
  row with the joiner's own identity. Keeping both would mean two kinds of
  member row for the same event.
- **The QR is dark-on-white in both themes** — a dark-mode inversion of a QR is
  the most common reason a code will not scan.
- **The invite link is permanent, not a fallback that appears on failure.** What
  goes wrong is unobservable from the component: a camera that will not focus, a
  scanner app that strips query params, the two people being on a phone call, or
  the inviter running on localhost (where the QR's origin resolves only on their
  own machine). None of that reaches the dialog, so the escape hatch cannot be
  conditional on detecting it. Shown in full rather than truncated, and
  selectable, so it can be read aloud when even copy is unavailable.
- **Auto-accept keys off router state, not a query param.** Only our own auth
  completion can set `fromAuth`, so a forwarded or bookmarked link can never
  auto-join anyone, and a reload degrades to the confirm screen. Someone already
  signed in who opens a `/join` link still gets the confirm — they did not
  necessarily choose to open it.
- **The camera scanner uses jsQR, not `BarcodeDetector`.** That API does not exist
  in Safari or Firefox, and Safari on iOS is the single most likely place someone
  scans an invite. A ~30KB decoder that behaves the same everywhere beats a native
  path plus a fallback path, only one of which would ever get tested. It still
  needs a secure context, so paste stays available.
- **`parseInviteInput` is deliberately permissive** — full URL, foreign-origin
  URL, `/join/<token>` path, or a bare token. What lands in a clipboard depends on
  how the link travelled; refusing a recognizable token over formatting is the
  most irritating way to fail.
- **The nine-screen wizard was removed, not trimmed.** Every screen after the
  first set up a feature that already owns its entry point in the app, so the
  wizard demanded the household's whole financial position before showing
  anything — and the persisted step meant closing the tab pinned the user back
  into setup, since `RequireHousehold` gated on the step rather than on household
  count. What remains is the only real precondition: a household to write
  against.
- **Joining is weighted equally with creating on the onboarding screen.** The
  second person in a couple is always a joiner, so half of everyone who sees that
  screen is there for that branch.

## Verification

- `npm run build` (tsc + vite) clean; `npm run lint` introduces no new findings
  (the 5 pre-existing errors are untouched).
- Browser smoke test (Playwright, throwaway): the `QrCode` component renders a
  scannable PNG encoding
  `http://localhost:4331/join?household=hh_2f8c1a&token=inv_tok_…`.
- Browser smoke test: `/join?household=…&token=…` unauthenticated redirects to
  `/auth?next=%2Fjoin%3Fhousehold%3D…%26token%3D…`, with the query string intact.
- Browser end-to-end (Playwright, backend stubbed at the network layer, nothing
  written to the database): invite link while signed out → `/auth?next=…` →
  sign-up form → **lands on `/` with no further clicks**, and the call order is
  `POST /api/auth/signup`, `GET /api/invites/:token`,
  `POST /api/invites/:token/accept`, `GET /api/households`.
- Browser end-to-end for onboarding: a signed-in user with no household lands on
  `/onboarding`; both cards render; the create branch has only the name input (no
  invite-email field); the join branch offers Scan QR code; a pasted full link and
  a pasted bare token both route to `/join`; garbage input stays put and shows the
  error. A seeded `version: 1` store with `onboardingStep: 'money_sources'`
  migrated to `{"activeHouseholdId":null}` at `version: 2`.
- Backend: `npx jest src/modules/invites` — 17 passed. The fixed `INSERT` was
  validated against the live database with `PREPARE`/`DEALLOCATE` (parses and
  plans, writes nothing), then run for real with null email **and** null phone
  inside a rolled-back transaction — accepted, nothing persisted.

Not verified by hand: the full inviter→scan→join loop against the live backend on
two devices, and the camera scanner on a physical phone (it needs HTTPS or
localhost, and a real camera).

## Mobile app parity notes

- Port the whole `features/invites` slice. The repository, the types and both
  hooks are transferable as-is.
- **The QR component is web-specific.** On mobile use a native QR view, and a
  native camera scanner in place of `QrScanner` — `jsQR` over `getUserMedia` is a
  browser workaround, not a design choice worth porting.
- `parseInviteInput` / `joinPathFor` port as-is and should back the same
  paste-or-scan panel on mobile onboarding.
- **Onboarding must be cut down there too**: create-or-join only, no wizard, and
  no persisted step.
- `buildJoinUrl` uses `window.location.origin`. Mobile needs a configured web
  origin (plus a deep link / universal link for `/join`) instead.
- Deep-link handling must reproduce the two route-tree facts: `/join` requires
  auth but must **not** require a household, and the post-login return must
  preserve the invite URL (the `?next=` equivalent).
- The three post-accept steps (activate household, clear onboarding step,
  refetch households) are domain, not web plumbing — port them exactly.

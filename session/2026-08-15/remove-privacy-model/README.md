# Remove the privacy model

- **Date**: 2026-08-15
- **Session folder**: `session/2026-08-15/remove-privacy-model/`
- **Status**: done (one follow-up named below)

## What the task is

Oursight is a shared source of truth for two people. The disclosure model
contradicted that: either partner could hide records from the shared picture, so
the "shared" numbers were wrong for both. The owner settled a new mental model:

> Two partners are **equal in operational rights**. Each chooses the **level of
> detail** of what they contribute. Important changes are transparent through
> **history and consequence**, not permission grants or approval.

Visibility by data → yes. Permission hierarchy → no. Administrative safeguard
for lifecycle → yes, hidden from core UX.

## Why this was mostly deletion

Investigation before any code:

- **Zero production usage.** Every row across assets, cashflow events, money
  events and snapshot lines was `detail`/`household`; `privacy_owner_member_id`
  was NULL everywhere; both members were owner/admin.
- **Only 2 of 9 enum values did anything**, and both only excluded records from
  the forecast. `summary_only` and `grouped` were never implemented.
  `financial_nature` could not be set through the API at all. `canViewVisibility`
  — the one function comparing record visibility to reader permission — had
  exactly one caller: its own spec.
- **The spec never justified `private`.** No JTBD, persona or user story. The
  nearest scenario argues for `summary_only`. And it was asymmetric by
  construction: admins could read every private record, and the household owner
  defaults to admin.
- **It was actively causing a bug.** Exclusion ran in the forecast but not in
  dashboard net worth, the asset summary or snapshot totals — two figures on one
  screen disagreed about how much money the household had.

## Changes made

Fourteen commits across both repos; the frontend ones in order:

- `chore:` removed the unreachable settings page and five dead components
  (`/settings` has redirected to `/household` since Phase 10).
- `feat(sharing):` collapsed disclosure to `detail | summary_only`.
  `normalizeVisibility` is the single read boundary, which is what let the
  client ship before the backend migration. Asset form drops `financialNature`
  and `privacyOwnerMemberId`; folded rows render as contribution lines; the
  detail page gets a notice panel; SharingCard deleted.
- `refactor(forecast):` dropped `excludedPrivateRecordCount` and the
  `private_records_excluded` assumption.
- `feat(members):` responsibility replaces permission; `HouseholdAdminDisclosure`
  collects the three lifecycle operations.
- `feat(activity):` new `features/activity` slice; Home's journal section is
  real; `/activity` page added.
- `docs(memory):` `sharing-levels.md` and `members.md` written;
  `asset-classification.md` and `members-and-permissions.md` deleted.

Backend: lifecycle safeguard on `households.created_by`, capability machinery
and exclusion rule deleted, four migrations (VisibilityLevel 4→2; drop
FinancialNature + privacy_owner; drop PermissionLevel; drop HouseholdRole),
`AuditService` + `GET /activity`.

## Key decisions

- **`summary_only` is presentation, not access.** Both partners can flip any
  record to `detail` in one edit, so server redaction would be theatre. It folds
  for _everyone including its owner_ — that symmetry is what makes it
  trustworthy without a permission system. Copy is written to survive this:
  never "người kia không thấy".
- **Liquidity stays visible on folded rows.** §2.15 requires every calculated
  number to be explainable; a contribution with no bucket would make the "Dùng
  ngay" total stop adding up. It reveals a category, not a source.
- **Retired values fold to `summary_only`, not `detail`.** A record the
  household chose not to itemize must not start showing its name because the app
  was redeployed.
- **Invite is not fully hidden.** Burying it makes a one-person household a dead
  end at the moment forming the couple is the point.
- **SharingCard deleted rather than fixed.** It never persisted, and a
  household-scoped default is the same asymmetry the model removes.
- **The journal withholds a folded record's name and amount.** It is the one
  place both partners are sure to look.
- **A visibility change shows no amount and leads with "Vẫn tính vào tổng."**
  The honest answer is that the picture did not move; saying so IS the
  reassurance.

## Verification

`npm run build` clean throughout; `npm run lint` reports only the 14
pre-existing problems, none in touched files; `check-copy` passes; vi and en
carry identical activity action keys. Backend: 254/254 tests, zero schema drift,
app boots on the migrated schema.

**Not verified in a browser.** There is no test runner here and `tsc` cannot
catch a broken i18n key or a wrong grid column count. Needs a manual pass: the
three `AssetFormDialog` mount points, a `summary_only` asset in the list and via
deep link, the admin disclosure's three operations, and the journal on Home.

## Mobile app parity notes

- Port the whole model: two visibility values, no roles, no permission levels,
  nothing excluded from shared figures.
- Port `normalizeVisibility` first — it is what makes the rest orderable.
- Port the folded-row treatment including the liquidity exception.
- The journal is not optional there either: without it, removing permissions
  leaves nothing carrying accountability.
- Web-specific, do NOT port: the settings-page deletion (routing artifact) and
  the `HouseholdAdminDisclosure` layout (mobile needs its own placement, but the
  rule — the three operations, creator-only, out of the everyday view — holds).

## Follow-up

`asset.value_updated`, the cashflow and reserve actions, and
`record.visibility_changed` have their action codes and impact shapes defined but
their write sites are not yet threaded — each needs the request actor pushed
through its service. Until then the journal shows lifecycle events and asset
deletions only.

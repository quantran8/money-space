# Asset classification & sharing

Whose money a record is, and how much of it others see (spec §11, §30).
Related: [[assets]], [[settings-and-sharing]], [[members-and-permissions]].

## Two independent axes

These are easy to conflate and must not be:

| axis | question | values |
|---|---|---|
| `financialNature` | whose money this fundamentally **IS** | `household`, `personal_included`, `managed_for_household`, `personal_private` |
| `visibilityLevel` | how much others **SEE** | `summary_only`, `grouped`, `detail`, `private` |

A `personal_included` asset counts toward household totals but is still
someone's own money. A `summary_only` asset is everyone's money shown without
detail. Neither implies the other.

`holderMemberId` is a third, separate thing: **who holds it**, distinct from who
entered it (`created_by`) and from whose privacy it is
(`privacyOwnerMemberId`).

## Rules

- **A `private` record must name its `privacyOwnerMemberId`** (§30).
  `created_by` is not a valid substitute for a new record.
- **`personal_private` is excluded from shared calculations** — the forecast
  reports how many records it excluded (`excludedPrivateRecordCount`) without
  revealing what they are.
- **The MVP picker exposes THREE of the four visibility levels**: `detail`
  ("Hiện chi tiết"), `summary_only` ("Chỉ tính vào tổng"), `private`
  ("Riêng tư"). `grouped` is a valid stored state but too subtle to explain in
  a form. A record already stored as `grouped` must render its label
  **read-only** rather than showing an empty Select —
  `isSelectableVisibility()` is the check.

## v3.1 rename

The pre-v3.1 web client used `'overview' | 'grouped' | 'detailed'` for sharing.
That union matched nothing on the backend: `detailed` was never a valid value
and `private` could not be expressed at all. It is now the canonical
`VisibilityLevel`.

Safe to rename outright in the web client because those settings fields were
**never persisted** — the settings save path sends only `currency`. **Other
repos must check the same before assuming.**

## Where it lives in code

**frontend-web**:
- `src/features/assets/model/asset-classification.ts` — the unions, the MVP
  subset, `isSelectableVisibility`, `requiresPrivacyOwner`.
- `src/features/assets/ui/components/asset-classification-fields.tsx` — one
  field group shared by the asset dialog and the onboarding step.
- `src/features/settings/model/settings-form.ts` — re-exports the canonical
  union as `SharingLevel`.

**backend**: `src/common/utils/shared-calculation.ts` (`FinancialNature`),
`src/common/utils/money-space.utils.ts` (`VisibilityLevel`).

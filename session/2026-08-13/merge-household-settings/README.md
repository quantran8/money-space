# Merge Household and Settings pages

- **Date**: 2026-08-13
- **Session folder**: session/2026-08-13/merge-household-settings/
- **Status**: done

## What the task is

Merge the Household and Settings destinations into one /household page following the supplied ledger-style HTML reference.

## Changes made

- Removed Settings from the sidebar and redirected the legacy /settings route to /household.
- Extended the compact page header with an optional description for the Household introduction.
- Added a household overview panel combining household identity, source freshness, quick freshness confirmation, currency, language, and settings save.
- Restyled the member list into compact role, permission, and status rows while preserving invite, role update, permission update, and remove flows.
- Combined protected reserves, update cadence, and reminder controls in one panel while preserving multiple named reserves.
- Restyled default sharing controls to match the compact two-column rows in the demo.
- Restyled event categories into a full-width two-column panel while preserving add, rename, default, and delete actions.
- Restyled data/privacy/danger-zone controls into the final combined panel.
- Added Vietnamese and English copy for all new labels.
- Rehydrated the settings form when the active household finishes loading so the merged screen does not retain empty pre-request defaults.

## Key decisions

- /settings remains as a redirect so saved bookmarks do not break.
- Existing data hooks and mutations remain the source of truth; the merge is a composition and presentation change.
- Existing advanced reminder and category management actions remain available even where the static demo only shows the simpler default state.
- Asset freshness is shown inside the household overview instead of as a separate card.

## Verification

- npm run build — passed.
- Scoped ESLint for all files changed by this task — passed.
- node scripts/check-copy.mjs — passed.
- git diff --check — passed.

## Mobile app parity notes

- Use Household as the single destination for household identity and settings.
- Keep the overview, members, safety fund/cadence, sharing, categories, and data sections in the same order.
- Stack member and settings rows on narrow screens while keeping status and primary actions visible.

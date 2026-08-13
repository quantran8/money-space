# `/upcoming` — create/edit cashflow items

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/upcoming-create-action/`
- **Status**: done

## What the task is

Follow-up to Phase 6. `/upcoming` rendered the forecast but had **no way to add
an upcoming item** — the screen was read-only. Cashflow events are the sole
input to the forecast (§18), so a household could look at an empty timeline with
no route to filling it.

The repository and mutations already existed from Phase 5; `features/cashflow/`
simply had no `ui/` directory. This adds it.

## Changes made

- `src/features/cashflow/model/cashflow-form.ts` — form shape, defaults, zod
  schema, VND parse/format helpers.
- `src/features/cashflow/hooks/use-cashflow-form.ts` — create/edit state and
  submit, on the `use-goals-page` pattern.
- `src/features/cashflow/ui/components/cashflow-event-form-dialog.tsx` — the
  dialog, reusing `EventField` / `EventMoneyInput` / `DatePicker` /
  `ResponsiveDialog`.
- `src/features/forecast/ui/upcoming-page.tsx` — "Thêm khoản" in the header,
  dialog mounted, row-action handlers wired.
- `src/features/forecast/ui/components/forecast-timeline.tsx` — a CTA in the
  empty state and a per-row actions menu (done / edit / remove).
- `upcoming.form.*` and `upcoming.rowActions.*` in both `vi` and `en`.

## Key decisions

- **Direction is a segmented control, not a dropdown.** Money in and money out
  are the two different things this form makes, and the choice changes what the
  other fields mean — burying it in a Select would hide the most consequential
  decision on the form.
- **`requirement` is hidden, not disabled, for incoming.** The backend forces it
  to `null` because nothing obliges money to arrive; the payload omits the field
  entirely rather than sending a value that would be discarded.
- **Defaults are the conservative ones**: `required` and `confirmed`. Assuming
  an obligation is optional would understate what the household must cover.
- **Choosing `estimated` on an incoming item explains itself inline** — it is
  displayed on the timeline but never banked, and that is surprising enough to
  say before the choice is made rather than after.
- **Row actions key off `sourceEventId`, not `occurrenceKey`.** Occurrences are
  virtual and are not rows (§18) — PATCHing one would 404.
- **`complete` passes `occurrenceDate`.** It is the idempotency key: without it
  a double-tap advances a recurring series twice and silently drops a month from
  the forecast.

## Gate

- `npm run build` — clean.
- `node scripts/check-copy.mjs` — passes.
- `npx eslint .` — 6 errors / 8 warnings, unchanged from the pre-existing
  baseline.
- All 23 new i18n keys verified to resolve in both `vi` and `en` by runtime
  lookup.
- New modules transform 200 under Vite.

**Not proven:** live behaviour. The v3.1 migrations remain unapplied, so the
create → forecast-updates round trip has not been exercised against real data.

## Mobile app parity notes

- Port the whole `features/cashflow/ui/` group — mobile has the same gap if it
  mirrors Phase 6.
- The four rules above (hidden requirement for incoming, conservative defaults,
  `sourceEventId` for actions, `occurrenceDate` on complete) are **domain
  rules**, not styling, and must be ported as such.
- `postpone` and `cancel` exist in the repository but are not yet surfaced in
  the UI on either platform — see [[cashflow-events]].

# Mobile ↔ v5 styleguide parity

- **Date**: 2026-09-11
- **Session folder**: `session/2026-09-11/mobile-v5-styleguide-parity/`
- **Status**: done

## What the task is

Mobile's styles and components had drifted from `design-v5-styleguide/Components.dc.html`
and `Foundations.dc.html`. Audit both truth pages against `mobile/` and close the gaps.

## Changes made

### Foundations — spacing roles and elevation

- `mobile/tailwind.config.js` — added a second plugin defining the eight named
  spacing roles (`.s-card` `.s-page` `.s-card-gap` `.s-section-gap`
  `.s-head-body` `.s-split-gap` `.s-row` `.s-tap`), mirroring
  `web/src/index.css`. The web's responsive steps collapse to their phone value.
- `mobile/src/theme/tokens.ts` — `spacing` realigned to the named roles:
  `section` 16→20, `header` 24→28, added `page: 16` and `cardGap: 12`, dropped
  the invented `block` / `summary` keys. Added `overlayShadow`.
- `mobile/src/components/ui/screen.tsx` — `Sections` now uses `.s-section-gap`
  (was `gap-4`); page edge uses `spacing.page`; removed an untokened `+ 4`.

### Components — the v4 sunk boxes v5 deletes by name

The spec's `src` lines name these files in the past tense ("*was* a rounded-sunk
box nested inside a panel"). Mobile still shipped the box.

- `metric-cell.tsx` — box removed; label → value → hint at gap 2, hint to `t-caption`.
- `sub-section.tsx` — tint block removed; label to `t-caption med` / `ink3`.
- `states.tsx` — `EmptyState` is now a centred lucide glyph (28, stroke 1.75)
  plus the action, with the message as the icon's a11y label; `ErrorState`
  unboxed; `CaveatNote` loses the `attention-soft` tint for an inline icon.
- `summary-strip.tsx` — tile is a white card at radius 22 / padding 20, value
  `t-metric` (was wash, radius 14, padding 14, `t-subtitle`).

### Components — field and button recipes

- `field.tsx` / `select.tsx` — rest state is now white + 1px `committed` (was
  `bg-wash` + `border-divider`, the exact thing v5 rejects); focus is
  `data-primary` blue, not ink; `field-disabled` implemented for the first time;
  label to `t-caption med`; fixed `h-[46px]` → `py-3`.
- `button.tsx` — primary and destructive are pills, secondary keeps radius 14;
  destructive is a filled `alert` with ink text (was transparent + `alert-ink`);
  label `t-body-sm` (was `t-body`).
- `status-chip.tsx` — `interactive` tone renamed `positive` and mapped to the
  green fill; attention/alert text to ink at 500; dot gap 6→8.

### Literals

- `category-icon.tsx` — `#64748b` (Tailwind slate, off-palette) → `colors.ink3`.
- `bottom-sheet.tsx` — `text-[19px]`/`text-[14px]` → real steps; scrim literal →
  `colors.scrim`; `bg-hair` (v4 alias) → `bg-divider`; `overlayShadow` applied.
- `checkbox.tsx` — `"#FFFFFF"` → `colors.actionInverse`.
- asset sheets — `rounded-2xl` → `rounded-control` (3 sites).

## Key decisions

- **The spacing scale was deliberately NOT locked down.** Replacing Tailwind's
  default scale would break 170 call sites across 56 files (mostly `1.5`/`0.5`
  sub-4px nudges). The web doesn't restrict its scale either — Foundations
  mandates the named *roles*, not a locked scale: "a plain `mt-4` between two
  paragraphs is fine: it carries no rule anyone could get wrong."

- **`.s-head-body` = 28, not 24.** Foundations contradicts itself: the named
  role says 28, its own Rhythm table says 20–24. `web/src/index.css` resolves it
  at 28 with the reasoning recorded (the header is a heading plus a metadata
  line, so the gap is measured from a two-line block). Mobile follows the web.
  **The Rhythm table in Foundations.dc.html is stale and should be corrected.**

- **`CaveatNote` kept its one-sentence contract.** The spec's full dependency
  notice (real answer `Chưa tính được` + which input is missing) is a
  composition, not a primitive — all ~15 call sites pass a bare sentence.

- **`rounded-[6px]` on the checkbox was left alone.** At a 20pt box the control
  radius (14) is nearly circular; the spec doesn't dimension checkboxes.

## Verification

`tsc --noEmit` clean except a pre-existing `auto-price-row.tsx` error
(`setAutoPrice`, unrelated to styling). `expo lint` 0 errors, 3 pre-existing
warnings. iOS bundle exports. All eight `.s-*` roles compiled through Tailwind
and verified to emit the exact spec values.

## Mobile app parity notes

This IS the mobile repo. Nothing to port outward, but note for the web:

- Foundations' Rhythm table ("Header → body 20–24") contradicts the named role
  `.s-head-body: 28`. The styleguide should be fixed at source.
- `field.tsx` had an in-flight password-visibility change by someone else
  (unused `Eye`/`EyeOff`/`useTranslation` imports) left untouched.

# Onboarding screen redesign

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/onboarding-screen-redesign/`
- **Status**: done

## What the task is

The user supplied an HTML mockup of the onboarding screen (choose → create → join) and
asked to update the UI to match it. The flow itself was already correct — one question,
two answers — so this is a visual and copy pass, not a behaviour change.

## Changes made

- `src/features/onboarding/ui/components/onboarding-header.tsx` — the header moved out of
  the card and onto the app surface: logo tile + wordmark on the left, avatar on the
  right, `max-w-[960px]`. The signed-in name and "Đã đăng nhập" line are gone; the avatar
  carries the full name as its `title`.
- `src/features/onboarding/ui/onboarding-page.tsx` — new shell (app surface → one
  `panel` at `max-w-[960px]`, padding `p-5 sm:p-8 lg:p-10`). The back link and the branch
  it returns from are now one `BackTo` column shared by both create and join. The choose
  screen is a heading plus two `min-h-[176px]` sunk cards: icon top-left, title and
  chevron pinned to the bottom, hover lifts the card, fills it with `accent-soft`, inverts
  the icon tile and slides the chevron.
- `src/features/onboarding/ui/components/onboarding-form.tsx` — heading, one labelled
  field, a "Tuỳ chọn" disclosure holding the currency select, and a right-aligned submit.
  The eyebrow, description, field hints, footer note and the owner card are gone.
- `src/features/onboarding/ui/components/owner-note.tsx` — **deleted** along with its
  `onboarding.ownerNote.*` copy.
- `src/features/invites/ui/components/join-by-code-panel.tsx` — same treatment: heading,
  labelled mono field, error, then scan and submit side by side. The QR scanner block is
  unchanged.
- `src/i18n/resources.ts` — new `onboarding.form.options`; `onboarding.choose.title`
  became "Bạn muốn bắt đầu theo cách nào?" / "How would you like to start?" and
  `invites.joinByCode.title` became "Nhập mã mời" / "Enter your invite". Removed the keys
  whose UI is gone: `signedIn`, the `choose` / `form` / `joinByCode` eyebrows,
  descriptions, per-card descriptions and actions, `nameHint`, `currencyHint`,
  `footerNote`, `inputHint`, `ownerNote.*`.

## Key decisions

- **Tokens, not the mockup's hex codes.** The mockup's palette (`#EEF1F3`, `#F5F7F8`,
  `#E3EFEA`, 14px/10px radii) is exactly what `index.css` already defines, so the markup
  uses `bg-app` / `bg-sunk` / `bg-accent-soft` / `rounded-panel` / `rounded-sunk`.
  Hardcoding the hexes would have broken the second theme, which swaps every one of them.
- **`.page-title`, not the mockup's `-0.025em` tracking.** design.md §10.3 bans tight
  tracking on Vietnamese text because it crushes the diacritics; the mockup's sizes and
  leading are kept, the tracking comes from the system's `.page-title`.
- **Existing primitives.** `Input` is already h-44 / sunk / accent focus ring and `Button`
  is already `rounded-control`, so the mockup's `.field` and `.btn` needed no new markup —
  only size overrides (`h-11 px-[18px] text-[14px]`).
- **The submit button stays enabled** with the name empty (design.md §22.10): clicking is
  how the user learns what is missing. It was `disabled={!isValid}` before.
- **The invite field keeps its real semantics.** The mockup shows a 6-character code box,
  but invites are a URL or token (`parseInviteInput`), so the field kept its paste-or-
  token behaviour and only took on the mono styling.
- Verified with `npm run build` and `npm run lint` (copy check passes, no touched file
  flagged). Not verified visually in a browser.

## Mobile app parity notes

- The flow is unchanged, so the port is presentational: header above the card, one heading
  per screen, two equally weighted choice cards, currency behind a disclosure.
- Port the copy deletions too — the removed keys no longer exist in `resources.ts`, so a
  mobile screen still reading `onboarding.choose.description` will render a raw key.
- Hover states (card lift, icon inversion, chevron slide) are pointer-only; on mobile the
  press state should carry that weight instead.

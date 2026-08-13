# Keep What-if only in the sidebar

- **Date**: 2026-08-13
- **Session folder**: session/2026-08-13/sidebar-only-what-if/
- **Status**: done

## What the task is

Remove every page-level “Try a purchase” button and keep the sidebar as the single entry point.

## Changes made

- Removed the What-if CTA from the Home financial picture.
- Removed the What-if CTA from Upcoming.
- Removed the goal-prefilled What-if CTA from goal details.
- Replaced the onboarding What-if button with a short pointer to the sidebar.
- Removed the now-unused shared trigger and mobile FAB component.
- Kept the global What-if sheet mounted in the app shell and kept the sidebar CTA connected to it.
- Added the same sidebar CTA to the mobile navigation drawer so the tool remains reachable on small screens without adding a page-level or floating button.
- Updated comments to document the single-entry-point rule.

## Verification

- npm run build — passed.
- Scoped ESLint — passed.
- node scripts/check-copy.mjs — passed.
- git diff --check — passed.

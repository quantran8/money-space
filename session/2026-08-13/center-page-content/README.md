# Center page content

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/center-page-content/`
- **Status**: done

## What the task is

Center every authenticated page in the space remaining beside the sidebar and keep the page content at a consistent fixed maximum width instead of stretching across the full screen.

## Changes made

- `src/app/layout/app-shell.tsx` — constrained the shared routed-content wrapper to `1220px`, made it full-width below that limit, and centered it horizontally.
- `src/features/dashboard/ui/dashboard-page.tsx` — removed the page-local maximum width now owned by the shared app shell.
- `src/features/dashboard/ui/components/dashboard-skeleton.tsx` — removed the duplicate maximum width so the loading state follows the same shared layout.

## Key decisions

- Applied the width constraint at the authenticated shell boundary so list, detail, loading, and error states all receive the same layout without page-level duplication.
- Kept `1220px` as the content maximum because it is the width specified by the current v3.1 design system.
- Preserved existing responsive horizontal padding inside the constrained content area.

## Mobile app parity notes

- No mobile-app change is required. This is a web desktop shell behavior for centering content beside a persistent sidebar.

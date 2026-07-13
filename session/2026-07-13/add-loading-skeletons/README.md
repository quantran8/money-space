# Add loading skeletons to all API-loading pages

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/add-loading-skeletons/`
- **Status**: done

## What the task is

User request: mọi page cần load API phải luôn show skeleton khi đang chờ API response, cho mọi component cần data từ API. Previously, list sections rendered `{!isLoading && items.map(...)}` — showing a **blank gap** while loading — and the dashboard/settings pages showed plain "Loading..." text or a form pre-filled with empty defaults. Replace all of these with proper loading skeletons that approximate the real layout.

## Changes made

### Shared primitive
- `src/components/ui/skeleton.tsx` — **new** `Skeleton` component (shadcn-style pulsing muted block, `animate-pulse rounded-[12px] bg-muted`, sized via `className`). Single source for all skeleton placeholders; replaces the ad-hoc `animate-pulse` divs that the asset/debt detail pages had inlined.

### List pages (blank gap → skeleton rows while `isLoading`)
- `src/features/debts/ui/components/debts-list-section.tsx` — `DebtListItemSkeleton` (3 rows) when loading. Page already passed `isLoading`.
- `src/features/members/ui/components/members-list-section.tsx` — `MemberRowSkeleton` (3 rows). Page already passed `isLoading`.
- `src/features/assets/ui/components/assets-list-section.tsx` — added `isLoading?` prop, 4 skeleton rows. Threaded `isLoading` through `use-assets-page.ts` → `assets-page.tsx`.
- `src/features/goals/ui/components/goals-list-section.tsx` — added `isLoading?` prop, 3 skeleton goal rows. `goals-page.tsx` now passes the existing `isLoading` in.
- `src/features/events/ui/components/events-timeline-card.tsx` — added `isLoading?` prop, 4 skeleton timeline rows. Derived combined `isLoading` (events list query OR summary query) in `use-events-page.ts`; `events-page.tsx` passes it in.
- `src/features/payments/ui/components/payments-list-section.tsx` — added `isLoading?` prop, 4 skeleton payment rows. Exposed `isLoading` from `use-payments-page.ts`; `payments-page.tsx` passes it in.

### Full-page skeletons (replace text/empty-default loading state)
- `src/features/dashboard/ui/components/dashboard-skeleton.tsx` — **new** `DashboardSkeleton` (title bar + tall hero + two grids mirroring the real layout). `dashboard-page.tsx`'s `!snapshot` branch now returns it instead of "Loading dashboard...".
- `src/features/settings/ui/components/settings-skeleton.tsx` — **new** `SettingsSkeleton` (summary-strip tiles + two-column card grid). `use-settings-page.ts` now exposes `isLoading` (from `useMembers()`); `settings-page.tsx` renders the skeleton in the body while loading, keeping the static `PageHeader` visible.

### Not changed (already had skeletons)
- `asset-detail-page.tsx`, `debt-detail-page.tsx` — already render an inline `animate-pulse` skeleton on `isLoading && !data`. Left as-is (could later be refactored to use the new `Skeleton` primitive, but not required).

## Key decisions

- **One shared `Skeleton` primitive**, not per-feature copies — consistent pulse/tokens, matches design.md.
- **Skeleton count = 3–4 rows** per list (enough to fill the fold without implying an exact item count).
- **Empty states preserved**: skeletons show only while loading; existing "no items" empty states still render when not loading and the list is genuinely empty.
- **`isLoading` sourced from react-query** (`useQuery().isLoading` from the underlying data hooks); page hooks that didn't previously expose it now do.
- Events summary strip left as-is — it renders zeros gracefully while the summary query loads; skeletoning it was not worth the churn.

## Mobile app parity notes

- Mobile should mirror the same behavior: every screen that loads from the API shows a skeleton (not a blank list or a spinner-only state) while the query is pending, for every data-driven component.
- Port equivalents: a shared `Skeleton` component + per-list skeleton rows (debts, members, assets, goals, events timeline, payments) and full-screen skeletons for dashboard and settings.
- Wiring pattern to replicate: derive `isLoading` from the data-fetching hook, thread it through the screen to the list/section component, render N skeleton rows when true, otherwise render real items (empty state only when not loading).
- Web-specific detail that need not port literally: exact Tailwind classes / `rounded-[28px]` radii — use the mobile design system's equivalents, but keep row dimensions roughly matching the real rows.

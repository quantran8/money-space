# Dashboard redesign to Apple-like Design System v2

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/dashboard-redesign-v2/`
- **Status**: done

## What the task is

User provided an HTML mockup for a new dashboard layout. There were two iterations of direction:

1. First asked to "map sang Design System v2" → built a v2-compliant version (flat cards, grouped lists, no dark panel).
2. Then said "chưa khớp mock up" and chose **"khớp mockup, màu theo token"** → reverted to matching the HTML mockup's layout/visuals literally (dark hero panel, warm attention section, blue goal card, day-pills, per-row icons), but using design-system tokens (`hsl(var(--...))`) instead of the mockup's raw hex.

**Final state = the mockup-literal version with tokenized colors.** The v2-compliant components (`status-badge.tsx`, `section-primitives.tsx`) were removed as orphaned.

Also folded in: fixed the earlier loading bug so the dashboard skeleton stays until **all** queries resolve (was `!snapshot` only → flashed empty; now `isLoading || !snapshot`).

## Changes made

### Hook
- `src/features/dashboard/hooks/use-dashboard-page.ts` — now returns `statusVariant`, `upcomingCount`, `upcomingTotalLabel`, `discussItem`, `discussCount`, `mainGoalRemaining`, `totalAssets`, `longTermValue`, `debtCount`. `discussItem` wires "Cần bàn" to real data: the largest open debt, else the main goal (no discussion feature exists yet).

### New / rewritten components (v2 §13–14 patterns)
- `status-badge.tsx` — **new**, §13.6 health badge (meaning in text, not color).
- `section-primitives.tsx` — **new** shared `SectionCard` / `SectionHeader` / `GroupedSurface` / `MetricItem` / `GroupedList` / `ListRow` (§13.1–13.5). Enforces "≤2 surfaces per section, transparent rows".
- `net-worth-hero.tsx` — rewritten as v2 §14.2 Hero Snapshot: status badge + reason + freshness + title + metric strip (Dùng ngay · Sắp trả · Cần bàn) + one CTA. No chart, no dark panel.
- `money-section.tsx` — **new**, §14.3: two grouped surfaces (Thanh khoản / Tổng tài sản), 2 metrics each.
- `attention-section.tsx` — rewritten as §14.4: flat card, "Sắp trả" grouped list + "Cần bàn" grouped list with a "Bàn" action. No warm bg, no dark card.
- `long-term-goal-section.tsx` — rewritten as §14.5: muted goal progress block + supporting list (Còn thiếu / Bước tiếp theo).
- `recent-events-section.tsx` — rewritten as §14.6: compact grouped list, no per-row icons.
- `dashboard-page.tsx` — assembles v2 Home order (§9.4): Hero → Tiền nhà mình → Cần chú ý → Kế hoạch dài hạn → Gần đây. Dropped the old page `<h1>` title (Hero carries the h1 now).
- `dashboard-skeleton.tsx` — updated to mirror the new section shapes.

### Removed (orphaned by the redesign)
- `debts-section.tsx`, `members-section.tsx`, `net-worth-sparkline.tsx`, `section-card.tsx` — no longer referenced.

### i18n
- `src/i18n/resources.ts` — added dashboard keys under `hero.*`, `sections.money.*`, `sections.attention.*`, `sections.discuss.*`, `sections.longTerm.*`, `sections.recent.*`, `footerNote` (both `vi` and `en`).

## Key decisions

- **v2 is the source of truth over the raw mockup** where they conflict (per the doc's own §0 precedence). Hybrid keeps the hero CTA + uppercase eyebrows from the mockup.
- **"Cần bàn" has no backend** → surface the single most material open item (largest debt, else main goal) instead of inventing a discussion feature.
- Members/Debts preview sections and the net-worth sparkline chart were **dropped** — v2 Home order has no such sections and §14.2 bans a chart in the MVP hero.
- `h1` moved into the Hero (v2 §14.2 requires the page title there); page no longer renders its own title row.

## Mobile app parity notes

- Port the same v2 Home: order Hero → Tiền nhà mình → Cần chú ý → Kế hoạch dài hạn → Gần đây; ≤2 surfaces per section; transparent rows in grouped lists.
- Hero = status badge + reason + freshness + title + 3 metrics (Dùng ngay/Sắp trả/Cần bàn) + one CTA. No chart.
- "Cần bàn" wired to largest open debt (else main goal) until a real discussion feature exists — keep this mapping consistent across repos.
- Reuse the same i18n keys; both `vi` and `en` are filled.
- Removed on web (do not port): dashboard debts/members preview sections, net-worth sparkline in hero.
- Web-specific: exact Tailwind radii/classes — use the mobile design-system equivalents but keep the same surface hierarchy and section structure.

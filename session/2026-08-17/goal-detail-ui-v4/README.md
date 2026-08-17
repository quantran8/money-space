# Goal detail page — rebuilt on the v4.0 design system

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/goal-detail-ui-v4/`
- **Status**: done

## What the task is

The user supplied an HTML mockup of the goal detail screen and asked to update the page to
match it. The old page was still on v3.x primitives (dark hero panel, `Card`, an inline
contribution form, a plan-vs-actual line chart).

## Changes made

- `src/features/goals/ui/goal-detail-page.tsx` — rewritten to the mockup:
  - **Header**: accent back link → `/goals`, large goal title, `Chỉnh sửa` (secondary) +
    `Ghi nhận tích lũy` (primary). Mirrors `asset-detail-page.tsx`'s header. The priority badge
    and the deadline subtitle are gone — priority now lives in the Plan section.
  - **Picture panel** (`Panel` + `PanelSplit`): `ĐÃ DÀNH` label, the saved figure at 44/54px via
    `splitVndScale`, `/ <target>`, a 6px `bg-committed` → `bg-accent` progress bar; right column
    is a `<dl>` of Ngày mong muốn / Theo tốc độ hiện tại / Để đúng hẹn cần, all read off
    `goal.projection`.
  - **Kế hoạch panel**: three sunk tiles (Mỗi tháng hiện tại / Còn thiếu / Mức ưu tiên) plus a
    `Xem cách tính` toggle that opens a sunk block with the projection reason and its inputs.
  - **Lịch sử tích lũy panel**: `.table-dense` table — Ngày / Nguồn / Ghi chú / Số tiền — with a
    `{{count}} lần` meta in the header.
  - The dark hero, the `Card`-based info list, the recharts progress chart (`buildChartData`,
    `GoalProgressChart`) and the inline contribution form were removed. The page now reuses
    `GoalContributionDialog` — the same dialog the goals list uses, which also carries the
    balance check and the impact preview the inline form lacked.
- `src/i18n/resources.ts` — `goals.detail` restructured in both `vi` and `en`:
  added `picture.*`, `plan.*`, `history.count`, `history.columns.*`; removed the now-unused
  `eyebrow`, `deadline`, `progress.*`, `chart.*`, `info.*`, `history.eyebrow/description`.
  `addContribution` is now "Ghi nhận tích lũy" to match the mockup.

## Follow-up in the same session: the "Người ghi" column (backend + frontend)

The first pass shipped the table without the mockup's **Người ghi** column, because no creator
reached the client. The user asked for the column and authorised an API change, so:

- **`money-space-backend`**
  - `money-event.entity.ts` — `MoneyEvent.createdById?: string`.
  - `prisma-money-events.repository.ts` — `insertMoneyEvent` now writes
    `COALESCE(<actor>, h.created_by)` instead of always `h.created_by`. **This was a real bug**:
    every event was attributed to the household's creator no matter who recorded it, which is
    the "never substitute a plausible person" rule in `memory/activity-log.md` — the same
    mistake the debts repository was corrected for.
  - `money-events.service.ts` — `createMoneyEvent(householdId, payload, actorId?)`;
    `money-events.controller.ts` — passes `@CurrentUser()`. Internal callers (saving-interest
    accrual, debt flows) pass no actor and keep the fallback.
  - `money-space.mapper.ts` / `money-space.utils.ts` — `createdById` is mapped from the row and
    returned by `toMoneyEventCard` (so the dashboard's recent-events cards carry it too).
  - `memory/money-events.md` — new "Who recorded it" section.
- **`money-space` (web)**
  - `events.types.ts` — `MoneyEventItem.createdById`.
  - `goal-detail-page.tsx` — `useMembers()`, a `profileId → name` map, and the **Người ghi**
    column between Nguồn and Ghi chú; unresolved ids render `Không rõ`.
  - `memory/money-events.md` — matching section.

**The API returns an id, not a name.** The client resolves it against the household's members,
so someone who has left the household goes unnamed rather than being reported under a stale
name.

**Known gap, deliberately left:** `money_events.created_by` is NOT NULL, so a *system* write
(saving-interest accrual) still falls back to the household creator and will render that
person's name. Goal contributions always come from an authenticated POST, so the column is
honest on this screen. Attributing system writes to nobody needs a migration making the column
nullable — not done here.

## Key decisions
- **The plan-vs-actual chart was dropped**, per the mockup. It was drawing a synthetic linear
  plan line from a locally-invented baseline rather than from `projection`, so nothing
  server-computed was lost — but it is a visible feature removal, not a refactor.
- **`Xem cách tính` replaces `GoalProjectionPanel`** on this page. The panel duplicated the
  progress bar the hero already shows; the toggle keeps §16 explainability (reason sentence +
  the three inputs) without a second progress readout. `GoalProjectionPanel` is untouched and
  still used elsewhere.
- The mockup's raw hex tokens map 1:1 onto the shipped `--ledger` palette, so everything uses
  the existing `Panel` / `Sunk` / `.label` / `.num` / `.table-dense` primitives — no new colors,
  no hand-rolled markup.

## Mobile app parity notes

- Port the same three-section IA: picture (saved figure + bar + three projection metrics) →
  plan (three tiles + explain toggle) → contribution history.
- Contribution entry is a **dialog** with a source picker, balance validation and an impact
  preview — not an inline row.
- The history table has four columns: Ngày / Nguồn / Người ghi / Ghi chú / Số tiền. "Người ghi"
  comes from `createdById` resolved against the members list — the API never sends a name.

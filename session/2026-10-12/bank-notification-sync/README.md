# Bank notification sync (iOS Shortcuts → inbox → money event)

- **Date**: 2026-10-12
- **Session folder**: `session/2026-10-12/bank-notification-sync/`
- **Status**: done (web); mobile not ported

## What the task is

Implement spec "Đồng bộ giao dịch từ notification ngân hàng": an iOS Shortcut
posts Techcombank / VCB balance-change notifications to the backend, which
parses them, matches the household's linked bank account to a wallet, and
records a money event exactly once — or parks it in an inbox for the household
to confirm. Business rules: `memory/bank-sync.md` (here and in backend).

## Changes made

**Core** (`packages/core`)

- `features/bank-sync/` (new) — types, zod schemas, repository, hooks
  `useBankDevices`, `useBankSources`, `useBankInbox`, `useBankInboxCounts`,
  helpers `bankIngestUrl`, `signedEventAmount`, `eventTime`, `reasonText`.
- `shared/api/query-keys.ts` — `bankSync*` keys under one household prefix.
- `features/billing/api/billing.repository.ts` — `PlanLimits.bankSync`.
- `shared/stores/paywall-store.ts`, `shared/analytics/event-catalog.ts` —
  reason `bank_sync`; analytics bans `account` / `payload` property names.
- `features/events/*` — `origin` carried to `FinancialRecordItem.fromBank`.
- `i18n/resources.ts` — `bankSync.*`, `nav.bankInbox`, paywall copy (vi + en).

**Web**

- `features/bank-sync/ui/bank-sync-page.tsx` — `/settings/bank-sync`:
  devices (one-time token dialog + Shortcuts steps), linked accounts
  (wallet, auto-record toggle with confirm, pause, unlink), limitations.
- `features/bank-sync/ui/bank-inbox-page.tsx` + `event-detail-dialog.tsx` —
  `/bank-inbox` with three tabs; record / dismiss / read again.
- `features/bank-sync/ui/components/bank-sync-card.tsx` — Settings entry.
- `app/router.tsx`, `app/layout/app-shell.tsx` (inbox nav item only while
  something waits), `features/settings/ui/settings-page.tsx`,
  `features/events/ui/components/record-card.tsx` ("Từ ngân hàng" badge).

## Key decisions

- Linking always starts in REVIEW; AUTO is a separate confirmed toggle.
- The inbox never infers success from the Shortcut's 202; it reads status.
- No permanent nav item for an optional Premium feature.

## Mobile app parity notes

- Port the Settings section + a pushed `bank-inbox` screen; all logic is
  already in core. Mobile bottom tabs are capped — use the Gia đình tab.
- The token copy uses `shared/clipboard`, already wired on mobile.

# Tạo không gian (workspace) từ trong app

- **Date**: 2026-10-13
- **Session folder**: `session/2026-10-13/create-space/`
- **Status**: done

## What the task is

Cho user đã có không gian tạo thêm không gian mới mà không phải qua onboarding.

## Changes made

- `packages/core/src/features/settings/hooks/use-create-space.ts` — form + mutation tạo household, chuyển sang không gian mới.
- `web/src/features/settings/ui/components/create-space-dialog.tsx` — dialog tên + tiền tệ.
- `web/src/features/settings/ui/components/space-switcher-card.tsx` — luôn hiện; nút "Tạo không gian mới"; bộ chọn chỉ khi ≥ 2 không gian.
- `web/src/app/layout/app-shell.tsx` — mục "Tạo không gian mới" trong menu tài khoản.
- `packages/core/src/i18n/resources.ts` — `settings.spaces.single`, `settings.spaces.create.*` (vi + en).
- `memory/households-and-onboarding.md` — mục "Tạo thêm không gian từ trong app".

## Key decisions

- Không đổi backend; dùng `POST /households` và schema onboarding.
- Refetch danh sách households (`exact`) trước khi đổi active id.

## Mobile app parity notes

- Port lối vào ở màn Cài đặt; logic ở core (`useCreateSpace`). Menu sidebar là chi tiết web.

## Follow-up: giới hạn 2 không gian Free mỗi tài khoản

- Backend: `FREE_OWNED_SPACE_LIMIT` (plan-limits), `households/domain/space-quota.ts` (+spec), chặn 402 `space_quota` trong `createHousehold`, `GET /households` trả `spaceQuota`; `HouseholdsModule` import `BillingModule`; paywall reason `space_quota` (+ catalog sync).
- Core: `spaceQuota` trong `useActiveHousehold`; `useCreateSpace.openDialog` kiểm tra trước → paywall hoặc toast; 402 khi submit đóng dialog.
- i18n: `paywall.title/subtitle.space_quota`, `settings.spaces.create.limitOtherSpaces`.
- Mobile: paywall reason mới cần copy/benefit nếu sheet mobile map theo reason.

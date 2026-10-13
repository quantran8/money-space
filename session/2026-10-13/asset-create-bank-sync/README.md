# Gắn tài khoản ngân hàng thật ngay khi tạo asset

- **Date**: 2026-10-13
- **Session folder**: `session/2026-10-13/asset-create-bank-sync/`
- **Status**: done

## What the task is

Khi tạo asset loại `bank_account`, cho phép cấu hình kết nối với tài khoản ngân hàng thật và bật đồng bộ ngay trong form.

## Changes made

- `packages/core/src/features/assets/model/assets-form.ts` — thêm `bankSyncEnabled`, `bankProviderCode`, `bankAccountNumber`; validate trong `superRefine`; `wantsBankSync`.
- `packages/core/src/features/assets/api/assets.repository.ts` — `createAsset` trả `AssetRecord` (cần `id`).
- `packages/core/src/features/bank-sync/api/bank-sync.repository.ts` — `connectBankAccount` (tạo source + link REVIEW); `useBankSources.add` dùng lại.
- `packages/core/src/features/assets/hooks/use-assets-page.ts` — sau khi tạo asset, gắn tài khoản; lỗi gắn không làm hỏng việc tạo.
- `packages/core/src/i18n/resources.ts` — `assets.form.bankSync.*`, `assets.toast.createdWithBankSync|bankSyncFailed` (vi + en).
- `web/src/features/assets/ui/components/bank-sync-fields.tsx` — công tắc + ngân hàng + số TK + dòng nhắc thiết bị.
- `web/src/features/assets/ui/components/asset-form-dialog.tsx` — hiện `BankSyncFields` khi tạo `bank_account`.
- `memory/bank-sync.md` — ghi quy tắc mới.

## Key decisions

- Không đổi backend: dùng API source/link sẵn có, hai request sau khi tạo asset (không atomic; asset giữ lại nếu gắn lỗi).
- Có công tắc Tự ghi trong form (mặc định tắt, bật phải qua ConfirmDialog) → `postingMode` AUTO/REVIEW; field `bankAutoPost`.
- Premium check khi bật công tắc (`usePremiumAction.check`).

## Mobile app parity notes

- Port `BankSyncFields` vào form tạo asset của mobile; logic submit đã nằm ở core (`useAssetsPage`).
- Link "Thiết lập iPhone" mở tab mới là chi tiết web; mobile điều hướng thường.

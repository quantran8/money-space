# Analytics & error monitoring

- **Date**: 2026-09-11
- **Session folder**: `session/2026-09-11/analytics/`
- **Status**: done

## What the task is

Dựng tầng đo lường: catalog sự kiện có kiểu dùng chung backend/web/mobile,
`AnalyticsService` fail-open, PostHog trên cả ba nơi, script SQL
`pnpm metrics:weekly`, và error tracking 5xx.

Spec nguồn (`11-analytics-spec.md`) **không có trong repo** — nó được đưa vào
như tài liệu đính kèm, và viết từ tài liệu chứ không từ code. Sáu giả định của
nó sai; phần "Key decisions" ghi rõ từng cái.

## Changes made

**Core (dùng chung web + mobile)**

- `packages/core/src/shared/analytics.ts` — adapter inject, theo đúng khuôn
  `store-purchases.ts`. Mặc định no-op.
- `packages/core/src/shared/analytics-session.ts` — `app_opened` + luật 30 phút,
  đọc/ghi qua `storage` đã inject (không `localStorage`).
- `packages/core/src/shared/analytics-identity.ts` — identify/group theo
  subscribe, không gọi lúc đăng nhập.
- `packages/core/src/shared/analytics/event-catalog.ts` — **bản sinh tự động**
  từ backend, đừng sửa tay.
- `packages/core/src/shared/stores/paywall-store.ts` — tách
  `SERVER_PAYWALL_REASONS` (8) khỏi `CLIENT_ONLY_PAYWALL_REASONS` (2); bắn
  `paywall_shown` ngay trong `openPaywall`.
- `packages/core/src/shared/api/query-client.ts` — xoá mảng `PAYWALL_REASONS`
  chép tay (đã sai cả hai chiều), narrow theo hằng của store.
- `packages/core/src/features/whatif/model/whatif-source.ts` — `sourceForPathname()`.
- `packages/core/src/features/whatif/hooks/use-whatif.ts` — gắn `source` một chỗ.
- `packages/core/src/features/auth/hooks/use-logout.ts` — `signed_out` rồi
  `reset()` sau khi clear cache.

**Web**

- `web/src/shared/web-analytics.ts` — posthog-js, autocapture/replay tắt, cắt
  query + hash khỏi mọi URL property.
- `web/src/main.tsx` — wiring + hai listener `error`/`unhandledrejection`.
- `web/src/app/layout/{app-shell,mobile-bottom-nav}.tsx` — FAB truyền `source`
  suy từ route thay vì `'other'` cứng.

**Mobile**

- `mobile/src/shared/native-analytics.ts` — posthog-react-native.
- `mobile/src/shared/bootstrap.ts`, `mobile/app/_layout.tsx` — wiring +
  `app_opened` khi quay lại foreground.
- `mobile/src/features/whatif/ui/whatif-sheet.tsx` — **sửa bug quota** (xem dưới).

**Backend**

- `src/common/analytics/` — catalog, `paywall-reason.ts`, service, 2 spec,
  fixture.
- `src/config/analytics.config.ts` — getter, không phải field.
- `src/common/common.module.ts`, `src/app.module.ts` — đăng ký; `AppModule` giờ
  import `CommonModule` vì filter cần DI.
- `src/main.ts` — `app.enableShutdownHooks()`.
- Sự kiện gắn ở: `assertQuota`, `EntitlementGuard`, `forecast.service.ts`,
  `assets.service.ts`, `households.service.ts`, `invites.service.ts`,
  `subscription.service.ts`, `payments.service.ts`, `revenuecat.service.ts`,
  `redeem.service.ts`, `billing-expiry.cron.ts`, `export.controller.ts`.
- `prisma/migrations/20260911100000_payment_order_from_reason/`.
- `scripts/metrics-weekly.ts`, `scripts/sync-analytics-catalog.ts`.

**CI / tự động hoá** (thêm sau khi review lại bản đầu)

- `.github/workflows/ci.yml` — **workflow này trước đó không tồn tại**. Repo chỉ
  có `deploy.yml` (build + rollout), nên không gì chặn một PR làm hỏng cả nghìn
  test đang xanh. Chạy trên PR: backend typecheck + test + `analytics:sync
  --check`; frontend build + lint + mobile typecheck + mobile lint. Hai job vì
  hai workspace ghim hai bản pnpm khác nhau.
- `.github/workflows/metrics-weekly.yml` — 08:00 thứ Hai giờ VN, đẩy số liệu lên
  PostHog. Chạy trên runner chứ không trong container: image production cài
  `--prod` nên không có `ts-node`.
- `analytics.service.ts` — thêm `captureSystem()` và `flush()`.

## Key decisions

**Sáu chỗ spec sai so với code** (đã đối chiếu từng cái):

1. **Trial không được cấp lúc tạo hộ.** `households.service.ts` có comment nói
   rõ. Nên bỏ `trial_granted` (luôn `false`) và thêm `trial_started` ở
   `startTrial` — đó mới là thứ khiến trial → trả tiền đo được. `09 §3` cũng
   sai, đã sửa.
2. **`PaywallReason` có ba bản khác nhau** (server 8, client 10, spec 9). Tách
   tên: `PaywallReason` (những gì 402 mang được) ⊂ `PaywallEntry`.
3. **Catalog là bài toán hai chỗ, không phải ba** — `packages/core` đã được cả
   web build lẫn mobile typecheck biên dịch. Một file viết tay (backend) + một
   bản sinh, `--check` in ra diff.
4. **`WhatIfSource` không phải "truyền sai"** mà là **không tới được**: 4/6 giá
   trị không có call site nào.
5. **`payment_orders.created_by` đã có sẵn**, chỉ `from_reason` là cột mới.
6. **Tên bảng trong SQL của spec đều sai** — `audit_logs` chứ không phải
   `activity_logs`, `created_by` chứ không phải `owner_user_id`.

**`capture()` trả `void`, không phải `Promise`.** Khiến "quên await" không thể
xảy ra, giữ `assertQuota` đồng bộ, và PostHog chết không bao giờ biến 402 thành
500.

**Không bắn paywall từ exception filter.** Filter không có `householdId`, và
paywall đáng quan tâm nhất — trần tự động cập nhật giá — **không phải một
exception**: nó trả 201 và lặng lẽ tắt automation.

**Thà `null` còn hơn bịa.** `price_vnd` = `null` trên đường RevenueCat (store
tính bằng tiền của store, gọi là `_vnd` là dán nhãn sai); `from_reason` = `null`
ở đó luôn; `member_index` = `null` vì đường accept không nạp danh sách.

**Ban tên property là lỗi compile.** `SafeProps` xoá key khớp danh sách cấm.
Trong lúc build nó bắt hai false positive thật: `has_invite_email` (đổi thành
`partner_invited`) và `auto_price` — cái sau khiến `price` bị gỡ khỏi danh sách
cấm vì nó chỉ báo động giả, còn tiền thật đã được `vnd`/`amount`/`value` phủ.

## Mobile app parity notes

- **Bug quota đã sửa, cần chú ý khi port:** `runWith` của mobile thiếu tham số
  `rerun` mà web có. Hộ Free thêm rồi bỏ bước bán tài sản tiêu 3 lượt thay vì 1.
  Sửa **trước** khi bật analytics, nếu không tuần dữ liệu đầu vô dụng.
- **Mobile không có preset 90 ngày và không có gate** ở `range-picker` ⇒
  `forecast_horizon` không bao giờ bắn. Khoảng trống sản phẩm, không phải lỗi
  tracking — đừng đọc số 0 thành phép đo.
- **Mobile không dẫn ra ngoài để mua** (App Store cấm) ⇒ `paywall_action` không
  có `go_to_web`.
- `EXPO_PUBLIC_POSTHOG_KEY` bỏ trống là trạng thái được hỗ trợ, giống key
  RevenueCat.

# Gộp route /assets và /debts thành một route duy nhất

- **Date**: 2026-08-14
- **Session folder**: `session/2026-08-14/merge-assets-debts-route/`
- **Status**: done

Tiếp nối `session/2026-08-14/merge-assets-debts-nav/` (gộp item sidebar). Task
này gộp luôn ở tầng route.

## What the task is

Bỏ hẳn hai route `/assets` và `/debts`, gộp thành **một route duy nhất**
`/networth` ("Tài sản & Nợ"). Tab Tài sản / Nợ trở thành state trong page,
không còn là URL riêng.

## Changes made

### Feature mới `networth`

- `src/features/networth/ui/networth-page.tsx` — **mới**. Page gộp, mount cả
  `useAssetsPage()` lẫn `useDebtsPage()`, render một `AssetsSummaryStrip` chung
  (luôn hiển thị cho cả hai tab) rồi đổi list section theo tab. Toàn bộ dialog
  của cả hai phía (asset form, asset sale, xoá tài sản, debt form, debt update
  mode, xoá nợ) đều mount ở đây.
- `src/features/networth/ui/components/networth-tabs.tsx` — **mới**. Thay
  `AssetsDebtTabs`: giờ là `role="tablist"` + `<button role="tab">` thật với
  `aria-selected`, không còn là `NavLink` điều hướng.

### Xoá

- `src/features/assets/ui/assets-page.tsx` — **xoá**
- `src/features/debts/ui/debts-page.tsx` — **xoá**
- `src/features/assets/ui/components/assets-debt-tabs.tsx` — **xoá**

Hai hook `use-assets-page.ts` và `use-debts-page.ts` **giữ nguyên không sửa** —
chúng còn được dùng bởi `asset-detail-page.tsx`, `debt-detail-page.tsx` và
`onboarding-page.tsx`.

### Router

- `src/app/router.tsx` — thêm route `networth`. Hai route cũ `assets` và `debts`
  giờ trỏ tới component `RedirectToNetWorth` (redirect kèm state, xem Key
  decisions). Hai route detail `assets/:assetId` và `debts/:debtId` **giữ nguyên**.

### Điều hướng — đổi hết sang `/networth`

- `src/app/layout/app-shell.tsx`, `src/app/layout/mobile-bottom-nav.tsx` —
  item "Tài sản & Nợ" trỏ `/networth`, `alsoActiveOn: ['/assets', '/debts']`
  (giờ để phủ hai route **detail**, không phải route list).
- `src/features/dashboard/ui/components/{assets-section,debts-section,money-sources-section}.tsx`
- `src/features/household/ui/components/household-assets-card.tsx`
- `src/features/settings/ui/components/data-card.tsx`
- `src/features/assets/ui/asset-detail-page.tsx`, `src/features/debts/ui/debt-detail-page.tsx`
  — nút Back giờ về `/networth`.
- `src/features/events/hooks/use-events-page.ts` — `navigate('/networth', { state: { openCreate: true } })`.

### i18n

- `networth.header.{eyebrow,title}` — header của page gộp (vi + en).
- `debts.remove.{title,body,confirm,removing}` — **mới**. `debts-page.tsx` cũ
  hardcode tiếng Việt trong ConfirmDialog ("Xóa khoản nợ?", "Xóa", "Hủy"),
  vi phạm rule i18n bắt buộc; khi port sang page mới đã chuyển thành key.
  Copy cũng đổi "Xóa" → "Gỡ" cho khớp §22.11 và `assets.form.removeTitle`.
- Giữ `nav.assets` / `nav.debts` — `NetWorthTabs` vẫn dùng làm label tab.

## Key decisions

- **Tab là state, không nằm trong URL.** Người dùng chọn phương án này. Hệ quả:
  không deep-link được thẳng vào tab Nợ, và nút Back không đi ngược giữa hai tab.
  Đổi lại chuyển tab không tốn navigation và summary strip không nhấp nháy.
- **`AssetsSummaryStrip` hiển thị ở cả hai tab.** Strip này vốn đã gồm cả
  Tổng tài sản / Tổng nợ / Giá trị ròng — nó chính là lý do gộp hai nửa vào một
  route, nên không ẩn đi khi sang tab Nợ. `DebtsSummaryStrip` (chi tiết riêng
  của nợ) chỉ hiện ở tab Nợ.
- **Redirect phải mang theo `location.state`.** `<Navigate>` thường **làm mất**
  state. Events page dùng `state: { openCreate: true }` để mở sẵn form thêm nợ,
  nên `/assets` và `/debts` redirect qua component `RedirectToNetWorth` truyền
  `state={location.state}` sang.
- **Tab khởi tạo đọc `location.state` bằng lazy `useState`, không dùng effect.**
  `useDebtsPage` có sẵn effect tự mở dialog rồi gọi `window.history.replaceState`
  xoá state ngay sau đó; một effect đọc lại state sẽ đá nhau với cleanup đó.
  Đọc một lần lúc mount cũng tránh luôn lỗi lint `react-hooks/set-state-in-effect`.
- **Hai route detail giữ nguyên.** Người dùng chọn phương án này: mở một tài sản
  và mở một khoản nợ là hai thực thể khác hẳn nhau, gộp prefix không thêm giá trị
  mà phải sửa nhiều chỗ hơn.

## Verification

- `npm run build` (tsc -b + vite build) — pass.
- `npx eslint` trên các file đã đổi — 0 error (còn 1 warning `react-refresh`
  trên `router.tsx` do file vừa export `router` vừa export component; chỉ ảnh
  hưởng HMR).
- `node scripts/check-copy.mjs` — pass.
- Dev server: `/networth` trả 200, cả hai module mới transform sạch.
- Lint toàn repo vẫn còn 6 error có sẵn từ trước ở `use-goals-page.ts`,
  `use-assets-page.ts`, `use-events-page.ts`, `data-table.tsx`, `motion.tsx`,
  `assets.repository.ts` — không liên quan task này.

## Mobile app parity notes

- Mobile repo cần gộp tương tự: một màn hình "Tài sản & Nợ" với tab nội bộ,
  bỏ hai màn hình list riêng, giữ hai màn hình detail.
- Copy key `networth.header.*` và `debts.remove.*` sang i18n mobile (vi + en).
- Deep link "thêm khoản nợ" từ màn hình sự kiện phải mở màn gộp ở **tab Nợ**.
- `RedirectToNetWorth` là web-specific (bookmark/URL cũ). Mobile không cần.

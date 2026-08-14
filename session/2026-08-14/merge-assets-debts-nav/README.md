# Merge assets & debts into one sidebar item

- **Date**: 2026-08-14
- **Session folder**: `session/2026-08-14/merge-assets-debts-nav/`
- **Status**: done

## What the task is

Gộp "Tài sản" và "Nợ" trong sidebar thành một item duy nhất: **"Tài sản & Nợ"**.

## Changes made

- `src/app/layout/app-shell.tsx` — nhóm `nav.group.picture` giờ chỉ còn 3 item; hai
  entry `/assets` + `/debts` gộp thành một entry trỏ tới `/assets` với label
  `nav.assetsDebts`. Thêm field `alsoActiveOn?: string[]` vào `NavItem` và cho
  `NavItemLink` set `aria-current="page"` khi pathname khớp một prefix trong đó,
  để item vẫn sáng khi đang ở `/debts` hoặc `/debts/:id`. Bỏ icon `Landmark`
  (không còn dùng).
- `src/app/layout/mobile-bottom-nav.tsx` — cùng xử lý: tab `/assets` đổi sang label
  `nav.assetsDebts` và thêm `alsoActiveOn: ['/debts']`, dùng `useLocation()` để
  tính active state ngoài `isActive` của NavLink.
- `src/i18n/resources.ts` — thêm key `nav.assetsDebts` (vi: "Tài sản & Nợ",
  en: "Assets & debts"). Giữ nguyên `nav.assets` / `nav.debts` vì tab switcher
  `AssetsDebtTabs` vẫn dùng chúng.

## Key decisions

- **Không gộp route.** `/assets` và `/debts` vẫn là hai route riêng với hai page
  riêng. Chỉ điều hướng cấp sidebar bị gộp — `AssetsDebtTabs`
  (`src/features/assets/ui/components/assets-debt-tabs.tsx`) đã có sẵn trên cả hai
  page và tiếp tục là cách chuyển qua lại. Gộp thành một page duy nhất sẽ là một
  refactor lớn hơn nhiều và không cần cho yêu cầu này.
- **`/assets` là đích mặc định** của item gộp: tài sản là phần lớn hơn của bức
  tranh, và trang assets đã hiển thị cả tổng nợ trong `AssetsSummaryStrip`.
- **Active state qua `alsoActiveOn`** thay vì hardcode: `.nav-item[aria-current]`
  trong `src/index.css` đã style sẵn theo `aria-current`, nên chỉ cần set attribute
  đó là đủ cho cả style lẫn screen reader.

## Mobile app parity notes

- Sidebar/drawer và bottom nav ở mobile repo cần gộp tương tự: một destination
  "Tài sản & Nợ" trỏ tới màn hình assets, giữ tab switcher giữa assets và debts.
- Cần copy key `nav.assetsDebts` sang i18n của mobile repo (cả vi và en).
- Logic `alsoActiveOn` là web-specific (dựa trên NavLink của react-router);
  mobile chỉ cần đảm bảo tab được highlight khi đang ở màn hình debts.

# Dashboard: sắp xếp / thêm-ẩn / đổi cỡ section

**Task:** cho phép kéo-thả, thêm/ẩn và đổi cỡ (nửa hàng / cả hàng) các section trên Home.

## Changed
- `packages/core/.../dashboard/model/dashboard-layout.ts` — widget ids, default layout, `sanitizeDashboardLayout`.
- `packages/core/.../dashboard/hooks/use-dashboard-layout.ts` — đọc `household.config.dashboardLayout`, ghi qua `PATCH /households/:id/config` (optimistic).
- Backend: `HouseholdConfig.dashboardLayout`, `normalizeDashboardLayout`, `setDashboardLayout` (jsonb merge; `null` xoá key).
- `web/.../dashboard/ui/components/dashboard-widget-grid.tsx` — dnd-kit sortable grid (2 cột từ `xl`), toolbar grip / resize / ẩn.
- `web/.../dashboard/ui/dashboard-page.tsx` — nút "Sắp xếp", menu "Thêm mục", "Về mặc định", `renderWidget`.
- i18n `home.layout.*` (vi + en). Dep mới: `@dnd-kit/core|sortable|utilities`.

## Mobile parity
- Store + model dùng lại được nguyên trạng từ core; mobile cần UI sắp xếp riêng (gợi ý: nút lên/xuống, vì chỉ 1 cột nên không có resize).
- Layout lưu ở server nên mọi thành viên cùng space thấy chung một bố cục.

## Phạm vi áp dụng
- Chỉnh sửa nằm trong bản nháp; bấm **Xong** chọn "Chỉ mình tôi" (localStorage, `money-space-dashboard-layout`) hoặc "Cả nhà" (`households.config.dashboardLayout`, xoá bản local).
- Thứ tự ưu tiên: local → shared → mặc định. Nút "Dùng bố cục chung" xoá bản local.

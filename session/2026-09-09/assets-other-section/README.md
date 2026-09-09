# Section riêng cho asset type `other`

- **Date**: 2026-09-09
- **Session folder**: `session/2026-09-09/assets-other-section/`
- **Status**: done

## What the task is

Danh sách nguồn tiền nhóm theo bucket thanh khoản, nên tài sản type `other`
(derive `not_immediately_usable`) bị xếp chung card "Tiết kiệm". Yêu cầu: tách
`other` ra một section riêng thay vì nhét vào tiết kiệm. Card "Khác" đặt cùng
hàng với "Dài hạn" trên web.

## Changes made

- `packages/core/src/features/assets/model/assets.ts` — thêm khái niệm *section*
  cho danh sách, độc lập với liquidity: `AssetSection`, `sectionForAsset`,
  `sectionOrder` (`usable_now` → `not_immediately_usable` → `other` →
  `long_term`) và `sectionMatchesLiquidity`. Không sửa `liquidityByType`,
  `liquidityOrder` hay bất cứ thứ gì backend/DB nhìn thấy.
- `packages/core/src/i18n/resources.ts` — thêm block `options.assetSection`
  (vi + en) cho 4 heading. `options.liquidity` giữ nguyên vì filter và donut
  vẫn hỏi câu hỏi 3 bucket.
- `web/src/features/assets/ui/components/assets-list-section.tsx` — group theo
  `sectionForAsset` thay vì `asset.liquidity`; heading đọc
  `options.assetSection.*`; filter dùng `sectionMatchesLiquidity`. Layout thành
  grid 2×2: bỏ `lg:col-span-2` của `long_term`, bỏ luôn phần chia hai cột bên
  trong nó và helper `splitInHalf` (giờ không còn ai dùng).
- `mobile/src/features/assets/components/assets-list-section.tsx` — cùng thay
  đổi group/heading/filter. Layout không đổi (vẫn stack một cột).

## Key decisions

- **"Khác" là heading, không phải bucket thanh khoản thứ tư.** Thêm giá trị
  enum mới sẽ kéo theo Prisma enum, backend totals, donut, net-worth breakdown.
  `other` vẫn nằm trong `not_immediately_usable` ở mọi con số — chỉ danh sách
  nguồn tiền tách card ra.
- **Filter "Tiết kiệm" giữ cả hai card.** `sectionMatchesLiquidity` cho card
  `other` đi qua khi filter là `not_immediately_usable`: filter chọn theo
  liquidity, ẩn card `other` sẽ làm mất dòng mà filter đã chọn.
- **Chỉ `type === 'other'` bị tách, và chỉ khi liquidity là
  `not_immediately_usable`.** Nếu hộ gia đình bật `countsAsFlexible` cho một
  tài sản `other` thì nó là tiền dùng ngay — quyết định của họ thắng, dòng đó
  ở lại card "Dùng ngay".
- Legacy type `insurance` / `investment` fold về `other` trong form nhưng bản
  ghi cũ giữ type gốc, nên chúng **không** vào card "Khác" — `insurance` và
  `investment` derive `long_term`.

## Mobile app parity notes

- Đã làm luôn trong repo này (`mobile/`), không còn gì phải port: dùng chung
  `sectionForAsset` / `sectionOrder` / `sectionMatchesLiquidity` và cùng key
  i18n `options.assetSection.*`.
- **Không** port layout grid 2×2 — đó là web-only (`lg:grid-cols-2`). Mobile
  không có wide breakpoint, các group stack một cột theo `sectionOrder`.

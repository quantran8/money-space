# Analytics (web + mobile)

Backend có bản đầy đủ ở `backend/memory/analytics.md` — luật dữ liệu, catalog,
`metrics:weekly`. File này chỉ nói phần client.

## Core sở hữu bề mặt, host cắm SDK

Core không import được PostHog: web cần `posthog-js`, native cần
`posthog-react-native`, và không bundler nào giải được cái kia. Nên
`shared/analytics.ts` theo đúng khuôn `configureStorage` / `configureNavigation`
/ `configureStorePurchases` đã có: một `let adapter`, một `configureAnalytics`,
và một façade đọc lại adapter **ở thời điểm gọi** (host cài adapter sau khi các
module này đã được import).

Nhờ vậy mọi sự kiện bắn từ **một chỗ trong core**, và web với mobile tự động
ngang nhau — không có chuyện một nền tảng quên bắn.

## Không key ⇒ im lặng, hai tầng

1. Adapter mặc định của core là no-op ⇒ host quên gọi `configureAnalytics` thì
   app vẫn chạy, không ném lỗi.
2. Mỗi host adapter **không dựng client** khi key rỗng ⇒ không có một request
   nào rời máy.

Bỏ trống là trạng thái được hỗ trợ, giống hệt key RevenueCat trong
`mobile/.env.example`. Đó là trạng thái CI và mọi máy dev đang chạy.

## Cắt query và hash khỏi URL — bắt buộc

`/join?household=…&token=…` mang **token mời còn sống**, và
`/auth/reset-password` mang token khôi phục ở fragment. `$current_url` thô sẽ
giao thẳng credential cho bên thứ ba.

`sanitize_properties` trong `web-analytics.ts` cắt vô điều kiện, **không dùng
allowlist** — allowlist sẽ fail-open ở route tiếp theo ai đó thêm vào.

## `app_opened` và luật 30 phút

Điện thoại bắn "active" mỗi lần liếc màn hình; tab trình duyệt bắn mỗi lần
reload. Đếm thô thì mobile sẽ báo gấp nhiều lần web cho cùng một mức dùng.
`noteAppOpened` (core) chỉ bắn khi đã cách lần trước ≥30 phút — đó là thứ khiến
hai nền tảng so sánh được với nhau.

Đọc/ghi qua `storage` đã inject, **không phải `localStorage`** (không tồn tại
trên Hermes). Adapter vốn đã async đúng vì lý do này.

## Identity

`installAnalyticsIdentity()` subscribe vào `auth-store` và `household-store`,
**không** gọi lúc đăng nhập. Lý do load-bearing: khởi động nguội với phiên đã
lưu không đi qua màn hình đăng nhập, nên gọi ở đó sẽ bỏ sót mọi người dùng quay
lại. Đây đúng là khuôn `bootstrap.ts` đã dùng cho `app_user_id` của RevenueCat,
và dùng **cùng một id** (profile UUID) — nên webhook mua hàng và event analytics
gọi tên cùng một người.

Hộ là **group**, không phải property của người: một người ở được nhiều không
gian, và event thuộc về không gian nó xảy ra.

Đăng xuất: bắn `signed_out` **trước**, rồi `clearAuth()`, rồi `reset()` sau khi
`queryClient.clear()`. Reset trước sẽ tách danh tính khỏi chính sự kiện mô tả nó.

## `paywall_shown` gắn ở action, không gắn ở sheet

Sheet mount **một lần** mỗi host và có thể không re-render. `openPaywall` mới là
chỗ mọi đường đi vào hội tụ: lớp kiểm tra lạc quan (`use-premium-action`), lưới
402 toàn cục trong `query-client.ts`, và nút nâng gói thường.

## `WhatIfSource` từng chết — sửa thế nào

Union khai báo 6 giá trị nhưng chỉ **3 call site** từng truyền, hai trong đó là
`'other'`. Nên `whatif_run.source` không phân biệt được gì.

Chỉ có **một lối vào** (FAB, có mặt mọi màn hình), nên `source` chỉ có thể nghĩa
là "màn hình nào đang mở lúc bấm". `sourceForPathname()` suy ra từ pathname —
thuần, và dùng được cho cả hai router vì mobile cố ý đặt path giống web.
Thứ tự quan trọng: `/goals/:id` phải xét **trước** `/goals`.

`source` gắn một lần trong `use-whatif.ts run()`, không gắn trong từng sheet:
cả lần chạy đầu lẫn lần chạy lại đều đi qua đó, nên không sheet nào quên được.

## Bug quota trên mobile (đã sửa)

`runWith` của mobile **không có tham số `rerun`**, trong khi web có. Hộ Free trên
điện thoại thêm rồi bỏ bước bán tài sản tiêu **3 lượt** thay vì 1 — sai với luật
"một lượt là một CÂU HỎI" trong `what-if.md`. Sửa trước khi bật analytics, nếu
không tuần dữ liệu đầu tiên vô dụng và bản sửa sau này trông như một cú tụt số.

## Khoảng mù đã biết — đừng đọc số 0 thành phép đo

- **Mobile không có preset 90 ngày và không có gate** ở `range-picker`, nên
  `forecast_horizon` **không bao giờ** bắn trên mobile. Đó là khoảng trống sản
  phẩm, không phải lỗi tracking.
- **Mobile không dẫn ra ngoài để mua** (App Store cấm), nên `paywall_action`
  không có `go_to_web` ở đó.
- **Mua qua store không truy được lý do**: IAP tới bằng webhook, không có đơn
  hàng nào của mình để mang `from_reason`.

## Liên quan

[[what-if]] · [[billing]] · [[auth]]

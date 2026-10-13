# Bank sync — notification ngân hàng → hộp thư → ghi chép

## Overview

iOS Shortcut gửi thông báo biến động số dư (Techcombank, VCB) lên backend.
Backend quyết định mọi thứ: parse, khớp tài khoản, tự ghi hay chờ. Client chỉ
quản lý thiết bị, tài khoản liên kết và xử lý hộp thư. Toàn bộ nghiệp vụ:
backend `memory/bank-sync.md`. Premium (`bank_sync`) — [[billing]].

## Rules / flow

- **Token thiết bị chỉ hiện một lần.** `useBankDevices.created` giữ raw token
  trong state tới khi dialog đóng, rồi bỏ đi. Không lưu vào storage, không log.
  Danh sách chỉ hiện prefix.
- **Gắn tài khoản luôn bắt đầu ở REVIEW.** Form không có lựa chọn AUTO; bật
  "Tự ghi" là bước riêng, có xác nhận. Tắt thì không cần xác nhận.
- **Số tài khoản phải đủ** (6–19 chữ số, cùng quy tắc chuẩn hoá với backend).
  Server chỉ trả `last4`; UI không bao giờ có số đầy đủ sau khi gửi.
- **Ví đích** chỉ là wallet (`cash`/`bank_account`) đang `active` — cùng
  `isWalletAssetType` với form sự kiện ([[money-events]]).
- **Thông báo quảng cáo/hệ thống của ngân hàng không bao giờ vào hộp thư** —
  server bỏ trước khi lưu (`NOT_TRANSACTION`). Xem backend `memory/bank-sync.md`.
- **Hộp thư hiển thị status thật từ server.** Không suy ra "đã ghi" từ việc
  Shortcut nhận 202. Tab: Cần xác nhận (`REVIEW`+`FAILED`), Chưa liên kết
  (`UNMAPPED`), Chưa đọc được (`PARSE_FAILED`).
- **Lý do chờ** là mã từ server (`statusReason`) → `bankSync.inbox.reason.*`;
  mã lạ rơi về câu chung (`reasonText`).
- **Gợi ý gắn khoản** (`suggestedCashflowEventId`, `matchStatus`) chỉ được chọn
  sẵn khi khớp duy nhất; `ambiguous` để user tự chọn — [[cashflow-settlement]].
- **Ghi từ hộp thư là một money write** → invalidate cả prefix household, giống
  mọi thao tác ghi tiền khác.
- **Mục "Hộp thư giao dịch" trên sidebar chỉ hiện khi có thông báo chờ**, để
  household không dùng tính năng này không thấy thêm một mục nav.
- **Home có card "Từ ngân hàng · cần xác nhận"** (`bank-review-section`), đặt ngay
  dưới card Quá hạn, chỉ tab `review` (REVIEW + FAILED). Không có gì chờ thì
  card biến mất — như Quá hạn, đây là lời gọi hành động chứ không phải thông tin.
  Tối đa 3 dòng, bấm mở cùng `EventDetailDialog` với hộp thư. Cảnh báo lệch số
  dư (`WalletDriftNotice`) nằm chung card, phía trên; card hiện khi có một
  trong hai. Tab `unmapped` /
  `parse_failed` không lên Home: cần cài đặt nguồn, không phải xác nhận.
- Dòng sự kiện có `origin = bank_notification` hiện nhãn "Từ ngân hàng"; note
  là nội dung thông báo của ngân hàng, số tài khoản đã được server che còn 4
  số cuối.

## Chuyển tiền giữa hai tài khoản của household

TCB `-x` và VCB `+x` của cùng một lần chuyển được backend gộp thành **một**
money event `transfer`; event còn lại thành `PROCESSED` với lý do
`TRANSFER_PAIRED` (không có money event riêng). `TRANSFER_REVIEW` = nhận ra là
transfer nhưng một bên đang duyệt tay — bấm Ghi nhận sẽ ra transfer. Chi tiết
nghiệp vụ: backend `memory/bank-sync.md`.

## Where it lives in code

- core: `packages/core/src/features/bank-sync/{api,hooks,model}`; query keys
  `bankSync*` (một prefix `['households', id, 'bank-sync']`).
- web: `web/src/features/bank-sync/ui/` — `bank-sync-page` (`/settings/bank-sync`),
  `bank-inbox-page` (`/bank-inbox`), card trong Cài đặt; badge ở `record-card`.
- mobile: chưa port.

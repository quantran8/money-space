# Mua tài sản phải trừ tiền khỏi ví (+ dòng tháng đang chạy cho goal)

- **Date**: 2026-08-19
- **Session folder**: `session/2026-08-19/asset-purchase-funding-wallet/`
- **Status**: done

## What the task is

Bàn về panel "Tính đều đặn" của goal, ta lần ra một lỗi nằm sâu hơn: **mua tài
sản không trừ tiền khỏi ví nào**. `insertAssetPurchaseEvent` ghi event
`neutral`, không có `from_asset_id`, và comment trong code tự thú nhận *"the
create-asset form does not choose a funding wallet… no wallet balance is
manufactured or debited"*. Hệ quả: mua thêm 100tr vàng làm **net worth tăng
100tr từ không khí**.

User chốt hướng xử lý:

> *"vì app là nhập liệu thủ công nên khi tạo app sẽ cần tạo asset thủ công và
> khi này cần phân biệt rõ cho user là init asset đã có sẵn hay là purchase
> asset theo nguồn tiền trong app hiện tại"*

Đó là mấu chốt: không phải "ví nguồn để trống được", mà là **hai hành động khác
bản chất**.

| | Ý nghĩa | Net worth | Ví |
|---|---|---|---|
| **Đã có sẵn** | Khai hiện trạng — vàng mua từ 2020 | **Tăng** (đúng) | Không đụng |
| **Vừa mua** | Giao dịch — đổi tiền lấy vàng | **Không đổi** | Bị trừ |

Sau đó user nêu tiếp một thiếu sót của UI goal:

> *"số tiền dự kiến đóng góp tháng này thực tế đang là bao nhiêu, thay vì bắt
> user đợi đến cuối tháng để biết số tiền thực góp, vì ui hiện tại đã k còn khái
> niệm contribute to goal"*

Đúng: bỏ nút "đóng góp" đã lấy mất phản hồi tức thời mà chưa có gì thay thế.

## Changes made

### Backend — `money-space-backend/`

Không cần migration: `money_events` đã có `from_asset_id`, enum đã có
`asset_purchase`.

- `src/modules/assets/dto/create-asset.dto.ts` — thêm `fundingAssetId?: string |
  null`. Một trường thay vì hai: **có ví = vừa mua**.
- `src/modules/assets/repositories/prisma-assets.repository.ts` —
  `insertAssetPurchaseEvent` ghi `from_asset_id` + `direction: 'outflow'` khi có
  ví, giữ `neutral` khi không. Sửa lại comment đã thành sai.
- `src/modules/assets/assets.service.ts`:
  - `assertFundingWalletCovers` — chặn ví sai loại (400) và ví không đủ tiền
    (400), **trước khi mở transaction**.
  - `resolvePurchaseCost` — giá mua (`quantity × purchasePrice`) cho market
    position, giá trị asset cho phần còn lại.
  - `logInitialPurchase` — asset mới: ghi event + debit ví.
  - `logAdditionalPurchase` — nhận thêm `fundingAssetId`, debit ví.
  - `formatVndPlain` — định dạng số trong thông báo lỗi cho người đọc.
- `src/modules/money-events/money-events.service.ts` — dọn hai comment chết còn
  nhắc `goal_contribution` (đã xoá từ lượt trước).
- `src/modules/goals/domain/goal-monthly-progress.ts` — nhận thêm tham số
  `current`; điểm "bây giờ" nhập vào cùng tập điểm đã chốt, thắng tháng của
  chính nó. Thêm `inProgress` vào kết quả, và `isMonthBefore` để chặn delta gộp
  nhiều tháng.
- `src/modules/goals/goals.service.ts` — `monthlyProgress` gọi song song
  `findGoalProgressPoints` + `resolveProgressAmount`.
- Tests: `assets.service.spec.ts` +6 case, `goal-monthly-progress.spec.ts` +7
  case. **351/351 pass** (trước: 338).

### Frontend — `money-space-frontend/`

- `src/features/assets/model/assets-form.ts` — thêm `acquisition` +
  `fundingAssetId` vào `AssetForm`; `canBePurchased()`; `purchaseCostOf()`;
  `buildAssetSchema` nhận `walletBalances` để chặn sớm khi ví không đủ.
- `src/features/assets/ui/components/asset-form-dialog.tsx` —
  `AcquisitionFields`: `Segmented` "Đã có sẵn / Vừa mua" + ô chọn ví (kèm số dư
  từng ví). Ở **phần chính**, không giấu trong `Disclosure`. Ẩn khi sửa.
- `src/features/assets/hooks/use-assets-page.ts` — `walletOptions` mang thêm
  `balance`; `openCreate(acquisition)`; payload gửi `fundingAssetId`.
- `src/features/assets/api/assets.repository.ts` — nới `AssetPayload`.
- `src/features/events/` — quick action **"Mua tài sản"** cạnh "Bán tài sản";
  `openBuyAsset` điều hướng `/networth` với `state: { buyAsset: true }`.
- `src/features/networth/ui/networth-page.tsx` — nhận state đó, mở form sẵn ở
  "Vừa mua". Sửa `onClick={openAssetCreate}` → `onClick={() =>
  openAssetCreate()}` (MouseEvent sẽ lọt vào tham số).
- `src/features/goals/ui/components/goal-monthly-progress-section.tsx` — giữ
  dòng tháng đang chạy dù `delta` null; nhãn "đang diễn ra"; cột chênh lệch nói
  **"còn Xtr"** thay vì "thiếu Xtr", giữ tông trung tính.
- `src/i18n/resources.ts` — `assets.form.acquisition*` / `payFrom*`,
  `events.form.action.buy_asset`, `goals.monthly.inProgress|remaining|paceMet`.
  Cả `vi` + `en`.

### Spec + memory

- `family-finance-v3.1/04-mvp-features-flows.md` — mục mới **§7B** (đã có sẵn vs
  vừa mua), và §8.4 bổ sung dòng tháng đang chạy.
- `memory/assets.md`, `memory/money-events.md`, `memory/goals.md` — đồng bộ cả
  hai repo.

## Key decisions

- **`fundingAssetId` không phải cột trên `assets`.** Nó mô tả **một lần mua**,
  không phải tài sản — mua thêm lần hai vào cùng position thì cột đó mang giá
  trị nào? Lịch sử mua thuộc về `money_events`, đúng chỗ `asset_sale` đang nằm.
- **Ví phải đủ tiền — khác với chi tiêu.** Ban đầu tôi định cho qua (ví về 0,
  không âm) với lý do "app không phán xét". User bác đúng: nguyên tắc đó nói về
  **cách nói chuyện**, không phải chấp nhận trạng thái bất khả thi. Chi tiêu ghi
  lại chuyện đã qua (số dư có thể lạc hậu); khoản mua đang được khai **ngay lúc
  nó xảy ra**. Tệ hơn, `Math.max(0, …)` sẽ phá đúng bất biến đang dựng: ví 10tr
  mua 50tr → ví về 0, vàng +50tr → **net worth tăng 40tr**. Dốc ví về đúng 0 thì
  cho phép; chỉ vượt mới chặn.
- **Trừ theo giá mua, không phải giá thị trường** (`resolvePurchaseCost`). Mua 1
  lượng giá 80tr trong khi niêm yết 82tr thì ví mất đúng 80tr — tính theo giá
  thị trường là bịa ra một khoản lỗ chưa từng xảy ra.
- **Mặc định "Đã có sẵn"**, vì việc đầu tiên một nhà làm khi mở app là nhập
  những thứ đang có.
- **Tháng đang chạy nói "còn Xtr", không nói "thiếu Xtr"**, và giữ tông trung
  tính. Tháng chưa xong thì chưa hụt.
- **Delta của tháng đang chạy bị giữ lại nếu tháng liền trước không có mốc
  chốt.** Nhà không mở app cả tháng 7 thì hiệu số tháng 8 sẽ gộp cả hai tháng —
  một con số khen nhầm. Thà để trống. (Tháng đã đóng vẫn so với tháng gần nhất
  có dữ liệu, vì ở đó việc bắc qua khoảng trống là cách đọc trung thực.)

## Đã biết, chưa xử lý

Con số tháng đang chạy **vẫn nhúc nhích theo giá vàng/CK**, vì tiến độ goal gồm
cả tài sản. Đây là bước 2 đã bàn nhưng chưa làm: tách "tiền nhà thực sự bỏ vào"
khỏi "lãi/lỗ thị trường". Điều tra cho thấy chưa làm được với dữ liệu hiện có —
`snapshot_asset_values` chỉ chốt `value`, không có `quantity`/`unit_price`, và
mua thêm vào position **ghi đè** `quantity` nên lượng nắm giữ quá khứ không tái
dựng được. Đợt này cố ý dừng ở bước 1 để dữ liệu mua/bán chạy thật trước.

## Mobile app parity notes

Cần port:

- Form tạo asset: `Segmented` "Đã có sẵn / Vừa mua" + ô chọn ví kèm số dư, chỉ
  hiện với `canBePurchased(type)` và chỉ khi tạo mới.
- Validate phía client: ví không đủ tiền → báo tại chỗ (server vẫn chặn lại, vì
  số dư có thể đổi giữa lúc mở form và lúc lưu).
- Quick action "Mua tài sản" trong picker sự kiện.
- Panel "Tính đều đặn": dòng tháng đang chạy + nhãn "đang diễn ra" + copy "còn
  Xtr".

Web-specific, **không** port nguyên trạng: cách chuyển màn bằng `navigate` +
router state (`{ buyAsset: true }`) — mobile dùng navigation param riêng.

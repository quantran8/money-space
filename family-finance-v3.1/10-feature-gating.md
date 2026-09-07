# 10 — Feature gating: Free và Premium

> **File này mô tả CODE ĐANG CHẠY.** Mọi hạn mức nêu ở đây đều được enforce
> thật, trừ những gì liệt kê ở §7 — mục đó nói rõ cái gì *chưa* chặn.
>
> Nguồn sự thật: `backend/src/modules/billing/constants/plan-limits.ts`.

---

## 1. Ranh giới

| Trục | Free | Premium | Đã enforce |
|---|---|---|---|
| Mục tiêu đang hoạt động | **2** | ∞ | ✅ |
| Lượt tính thử (what-if) / tháng | **5** | ∞ | ✅ |
| Tài sản tự cập nhật giá | **2** | ∞ | ✅ (không từ chối — xem §3) |
| Tầm nhìn dự báo | 7 · 30 ngày | + 60 · 90 | ✅ |
| Xuất dữ liệu | — | ✅ | ✅ |
| Lịch sử snapshot | 3 tháng | Toàn bộ | ❌ **chưa chặn** |

Ghi tài sản, khoản nợ, giao dịch, sự kiện sắp tới: **không giới hạn ở cả hai
bậc.**

---

## 2. Những thứ không bao giờ gate

Bốn thứ này bị cám dỗ gate nhưng gate sẽ phá chính sản phẩm:

**Mời bạn đời.** Hộ một người là ngõ cụt — toàn bộ giá trị nằm ở chỗ hai người
cùng nhìn một bức tranh. Gate cái này giết activation trước khi có gì để bán.

**Mức chia sẻ (`detail` / `summary_only`).** Đây là hợp đồng trình bày, không
phải tính năng, và bất kỳ thành viên nào cũng đổi được trong một lần sửa.

**Nhật ký hoạt động.** Nó là cơ chế trách nhiệm **thay cho** hệ thống phân
quyền — sản phẩm cố ý không có vai trò hay cấp quyền. Gate nó là phá thiết kế.

**Bước bán tài sản trong what-if.** Bước này chỉ xuất hiện khi hộ thiếu tiền —
đúng lúc họ cần sản phẩm nhất.

Và một điều nữa: **ghi vàng, cổ phiếu, crypto vào bảng cân đối không bao giờ bị
chặn.** Với hộ Việt Nam đó là lý do họ mở app. Cái Premium bán là **sự tự động**,
không phải quyền sở hữu vàng.

---

## 3. Từng hạn mức hoạt động ra sao

### Mục tiêu — 2 cái đang hoạt động

Kiểm tra trong `goals.service.ts` khi tạo mục tiêu, dùng danh sách đã được truy
vấn sẵn nên **không tốn thêm query nào**.

**Chỉ đếm mục tiêu `active`.** Mục tiêu đã hoàn thành không chiếm suất — nếu
không, hộ Free đạt được 2 mục tiêu rồi vĩnh viễn không tạo được cái thứ ba, tức
là bị phạt vì đã thành công.

Hai là số nhỏ nhất còn cho thấy mục tiêu dùng để làm gì: ưu tiên cao/thấp và câu
hỏi "mục tiêu nào phải nhường" trong what-if đều vô nghĩa với một mục tiêu.

Vượt trần → **402** `goal_quota`.

### Tính thử — 5 lượt/tháng

Đếm bằng **bộ đếm Redis, không có bảng DB**. What-if là thao tác đọc thuần và
người dùng chạy liên tục khi chỉnh số tiền — ghi một dòng Postgres mỗi lần sẽ
biến thao tác rẻ nhất trong app thành thao tác có ghi. Khoá theo tháng dương
lịch giờ Việt Nam, tự hết hạn, không cần cron dọn.

**Fail-open**: Redis chết ⇒ không đếm được ⇒ cho qua. Chặn nhầm một hộ trả tiền
tệ hơn nhiều so với tặng thêm vài lượt.

Thứ tự có chủ ý: **validate payload trước, tiêu quota sau khi tính xong.** Một
request sai định dạng không được phép tiêu lượt của ai.

Vượt trần → **402** `whatif_quota` kèm `{ limit, used }`.

### Tài sản tự cập nhật giá — 2 cái

Đây là hạn mức duy nhất có **chi phí biến đổi thật** phía sau (CoinMarketCap,
Twelve Data).

**Không bao giờ trả về 402.** Hai hành vi thay thế:

- **Tạo tài sản thứ ba loại market-priced** → vẫn tạo được, nhưng
  `autoPriceEnabled = false`. Hộ nhập giá tay. Chặn hẳn là chặn bảng cân đối,
  và họ sẽ rời đi chứ không trả tiền.
- **Bật tự cập nhật cho tài sản mới khi đã đủ trần** → tự tắt tài sản cũ nhất và
  bật cái mới, trả về thông tin cái vừa bị tắt. Hộ **tự chọn** hai cái nào được
  tự động, chứ không phải "hai cái đầu tiên bạn tạo".

Lý do không ném 402 ở hành vi thứ hai: hộ không xin *thêm* tự động hoá, họ chỉ
đang **di chuyển** phần tự động hoá đang có.

Cron cập nhật giá hằng ngày lọc theo cờ này, nên đây cũng là chỗ **cắt chi phí
API thật**.

### Tầm nhìn dự báo — 7/30 miễn phí, 60/90 trả phí

Gate nằm ở service, không phải controller: controller chưa có `householdId` lúc
parse query.

Tối ưu đáng chú ý: **horizon ≤ 30 trả về ngay, không hề đọc entitlement.** Đường
đi phổ biến nhất không tốn thêm gì.

30 ngày trả lời "liệu có trụ được tới kỳ lương" — câu hỏi tạo adoption. 60/90 là
lập kế hoạch, và đó mới là thứ đáng trả tiền.

Vượt → **402** `forecast_horizon` kèm `{ requested }`.

### Xuất dữ liệu — chỉ Premium

`GET /households/:householdId/export?format=json|csv&dataset=…`

Đây là **route duy nhất trong toàn bộ codebase** dùng decorator
`@RequirePremium('export_data')` — vì nó là hạn mức boolean duy nhất được thực
sự enforce.

---

## 4. Cơ chế kỹ thuật

### Hai loại hạn mức, hai cách chặn

**Hạn mức boolean** (bật/tắt) → guard toàn cục xử lý bằng decorator.

**Hạn mức đếm** (số mục tiêu, số lượt) → **guard không làm được**: nó không thể
đếm mà không tốn thêm một truy vấn. Nên chúng được kiểm tra trong service, dùng
con số mà service **đã truy vấn sẵn** cho việc khác.

### Guard đăng ký toàn cục, thứ ba

```
SupabaseAuthGuard  →  HouseholdAccessGuard  →  EntitlementGuard
```

Thứ tự bắt buộc: guard cuối đọc `request.membership` do guard trước gắn vào.

Nó đặt ở `modules/auth/guards/` chứ không phải trong module billing — để tránh
vòng phụ thuộc.

**Route không có decorator → trả `true` ngay, không đọc cache, không đọc DB.**
Đây là điều khiến nó an toàn khi đăng ký toàn cục: 99% route không tốn thêm một
byte nào.

### 402, không phải 403

403 trong sản phẩm này **đã có nghĩa cụ thể**: "bạn không phải thành viên của
hộ này". Nếu paywall cũng dùng 403 thì client không phân biệt được "đăng nhập
nhầm nhà" với "cần nâng cấp", mà `ApiError` chỉ mang theo status code.

Body của 402 mang đủ thông tin để client mở đúng paywall mà không cần request
thứ hai:

```json
{
  "message": "premium_required",
  "error": "PremiumRequired",
  "premium": {
    "reason": "goal_quota",
    "currentTier": "free",
    "status": "active",
    "limits": { "goals": 2, "whatIfPerMonth": 5, "…": "…" },
    "limit": 2,
    "used": 2
  }
}
```

`message` là **mã, không phải câu** — cùng nguyên tắc với nhật ký hoạt động:
client sở hữu toàn bộ copy.

### Bộ nhớ đệm entitlement

Hai tầng: in-process 30 giây → Redis 15 phút.

**Điểm mấu chốt: cache lưu DÒNG DỮ LIỆU GỐC, không lưu kết quả đã tính.** Việc
so `currentPeriodEnd` với thời điểm hiện tại chạy ở **mỗi lần gọi**. Nhờ vậy TTL
15 phút không cho ai dùng quá hạn dù chỉ một phút — hạn hết giây nào là mất
quyền giây đó.

Khoá cache **cố ý nằm ngoài** tiền tố `hh:<id>:`: mọi thao tác ghi vào hộ đều
xoá toàn bộ tiền tố đó, mà ghi một khoản chi thì không hề đổi gói của ai.
Nguyên tắc y hệt ở client — query key nằm dưới `['billing', …]`, không phải
`['households', id, …]`.

### Lưới an toàn phía client

Xử lý 402 tập trung trong `QueryClient`, đăng ký trên **cả** query cache lẫn
mutation cache — hạn mức đếm bị đụng bởi mutation, còn tính năng boolean bởi
query.

Nhận 402 → mở paywall đúng lý do → **nuốt lỗi, không hiện toast**. Paywall *đã
là* phản hồi rồi.

Nghĩa là **kể cả khi quên gate ở UI**, người dùng vẫn nhận đúng paywall thay vì
một thông báo lỗi khó hiểu. Đây là lưới an toàn quan trọng nhất trong toàn bộ
phần frontend.

Lớp kiểm tra phía client (`use-premium-action`, `use-quota`) chỉ để **hiển thị**,
và **fail-open** ở mọi trường hợp không chắc chắn. Server luôn là tiếng nói cuối
cùng.

### Nút không bao giờ bị vô hiệu hoá

Một nút mờ đi không giải thích được gì; paywall thì có. Các lựa chọn 60/90 ngày
vẫn hiện đủ kèm badge, để người dùng **thấy được thứ mình chưa có**.

---

## 5. Paywall

Một sheet, nội dung đổi theo lý do — một sheet chung chung "Nâng cấp Premium"
không trả lời được câu hỏi đang có trong đầu người vừa chạm tường.

| Lý do | Khi nào |
|---|---|
| `goal_quota` | Tạo mục tiêu thứ 3 |
| `whatif_quota` | Lượt tính thử thứ 6 trong tháng |
| `forecast_horizon` | Chọn 60 hoặc 90 ngày |
| `export` | Bấm xuất dữ liệu |
| `auto_price_quota` · `history` · `trial_ending` · `expired` · `general` | Client mở chủ động |

Sheet mount **một lần** ở app shell (web) và ở layout tabs (mobile), mở từ store
zustand — cùng khuôn với what-if sheet.

Đáy sheet luôn có **"Đã có mã kích hoạt?"**. Đây là thời điểm chuyển đổi cao
nhất: người vừa chạm tường và đang cầm mã trong tay.

---

## 6. Vòng đời gói

**Hết hạn** — cron chạy **09:00 giờ Việt Nam** hằng ngày (không phải 23:45 như
job định giá: thông báo phải rơi vào lúc người ta thức). Hai việc trong một lượt
quét: hạ trạng thái gói quá hạn, và đánh dấu hết hạn các đơn hàng treo.

Chống chạy trùng hai tầng: cờ trong tiến trình + khoá advisory toàn cụm. Hai nửa
độc lập — một nửa hỏng không kéo theo nửa kia.

**Gói hết hạn giữ nguyên `tier: premium`, chỉ đổi `status` thành `expired`.**
Nhờ vậy giao diện nói được *"Gói Premium của gia đình đã hết hạn ngày 12/03"*
thay vì *"Gia đình đang dùng gói Free"* — khác biệt lớn về khả năng win-back.
Hạn mức thì đã tụt về Free ngay, nên không ai dùng chùa.

**Nhắc gia hạn** dùng hạ tầng đã có: một mục "cần chú ý" trên Home khi còn ≤14
ngày, phân biệt được trial sắp hết với gói trả tiền sắp hết. **Không dựng hạ
tầng mới** — repo chưa có email và chưa có push.

Cố ý **không có** mục nhắc cho gói *đã* hết hạn: trang gói đã nói rõ rồi, nhắc
lại là cằn nhằn.

---

## 7. Chưa build — đừng nhầm là đã có

1. **Giới hạn lịch sử 3 tháng KHÔNG được enforce.** `historyMonths: 3` có trong
   `PLAN_LIMITS` và trong hàm `hasFeature`, nhưng không route nào dùng nó và
   module snapshots không đọc entitlement. **Hộ Free hiện đọc được toàn bộ lịch
   sử.**
2. **`auto_price_quota` không bao giờ được server ném** — theo thiết kế ở §3.
   Lý do nó tồn tại: để client mở paywall chủ động khi muốn giải thích.
3. **`expired` và `trial_ending`** chỉ tồn tại phía client.
4. **Không có tự động gia hạn.** Cột `autoRenew` có nhưng luôn `false`.
5. **Chưa có analytics và error monitoring.** Nghĩa là mọi con số ở §1 vẫn là
   giả thuyết — xem [09 §9](09-pricing-implemented.md).
6. **Chưa lưu kịch bản what-if.** Bảng `what_if_scenarios` chưa tồn tại; what-if
   cố ý là thao tác đọc thuần.
7. **Chỉ có PayOS.** Enum nhà cung cấp có đúng một giá trị; interface gateway để
   sẵn cho VNPay sau này.

---

## 8. Ngôn từ

Kiểm tra copy chạy trong `pnpm lint` và **làm hỏng build** nếu có từ bị cấm.
Ba cái bẫy hay gặp nhất khi viết copy cho phần này:

- **`mua được`** bị khớp dạng chuỗi con — *"chưa mua được"*, *"sẽ mua được"* đều
  trượt.
- **`kiểm tra ngay`** bị cấm ⇒ nút xác thực mã đặt là **"Xem mã"**, không phải
  "Kiểm tra".
- **`cảnh báo`** bị cấm theo ngữ cảnh ⇒ báo sắp hết hạn dùng **"Cần chú ý"**.

Chủ ngữ là **"gia đình"**, không phải "bạn" — nhất quán với giọng sẵn có của sản
phẩm.

Xem [08-brand-copy-wireframes.md](08-brand-copy-wireframes.md) §3 để biết danh
sách đầy đủ và lý do.

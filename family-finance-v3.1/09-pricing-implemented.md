# 09 — Pricing (đã triển khai)

> **File này mô tả CODE ĐANG CHẠY**, không phải giả thuyết.
> [06-pricing-metrics-validation.md](06-pricing-metrics-validation.md) là bản
> giả thuyết ban đầu và đã lỗi thời — xem §8 để biết nó sai ở đâu.
>
> Nguồn sự thật trong code: `backend/src/modules/billing/constants/plan-catalog.ts`
> (giá), `backend/src/config/billing.config.ts` (khuyến mãi), và
> `GET /billing/plans` (cái mà mọi client thực sự đọc).

---

## 1. Nguyên tắc

**Tính theo HỘ GIA ĐÌNH, không theo người.** Một gói mở khoá cho cả hai. Đây là
điều người dùng hay hiểu nhầm thành per-seat, nên paywall trả lời nó *trước* khi
hiện giá.

**Hai bậc, không phải ba.** Free và Premium. Bản spec cũ đề xuất Plus/Pro nhưng
với một sản phẩm chưa có người dùng thật, ba bậc chỉ tạo ra hai câu hỏi khó thay
vì một câu dễ.

**Giá là hằng số trong code, khuyến mãi là biến môi trường.** Đổi giá đáng được
review; chạy chiến dịch Tết thì không nên cần deploy.

**Không client nào hardcode một con số.** Cả giá lẫn hạn mức đều đi kèm trong
response của API, nên đổi chúng là sửa backend — không cần phát hành lại app.

---

## 2. Bảng giá

| Gói | Giá | Thời hạn | `planCode` |
|---|---|---|---|
| Theo tháng | **39.000đ** | 30 ngày | `premium_monthly` |
| Theo năm | **299.000đ** | 365 ngày | `premium_yearly` |
| Trọn đời | **699.000đ** | vĩnh viễn | `premium_lifetime` |

Gói năm hiển thị kèm:

- **Giá gạch ngang 468.000đ** — `YEARLY_REFERENCE_VND`, **tính bằng
  `12 × giá tháng`**, không gõ tay. Đổi giá tháng thì con số này tự đúng.
- **Tiết kiệm 169.000đ** — so với 12 tháng, không so với giá niêm yết.
- **≈25.000đ/tháng** — `299.000 / (365/30)`, làm tròn nghìn.

Dùng **ngày**, không dùng "tháng": "một tháng" là khái niệm mơ hồ vào ngày 31.
Paywall nói "30 ngày" / "365 ngày".

---

## 3. Dùng thử

**14 ngày Premium, tự động khi tạo hộ.** Không cần thẻ, không cần đăng ký.

- Cấp tại `households.service.ts` khi tạo hộ, bọc try/catch — trial hỏng thì hộ
  vẫn được tạo và ở Free.
- `trialStartedAt` là thứ chặn trial lần hai, và nó **tồn tại vĩnh viễn** kể cả
  sau khi trial kết thúc hay hộ đã lên gói trả tiền.
- Đã là Premium thì không cấp trial (không hạ cấp người đã trả tiền).
- Số ngày đổi được bằng `BILLING_TRIAL_DAYS`.

Lý do có trial: hộ dựng bức tranh đầy đủ rồi mới bị thu hẹp. Mất một thứ cụ thể
thuyết phục hơn nhiều so với chưa từng có nó.

---

## 4. Khuyến mãi — cấu hình bằng env

Tất cả đọc qua **getter** trong `billing.config.ts`, không phải giá trị cố định:
`ConfigModule.forRoot()` nạp `.env` **sau** khi file config được import, nên
field thường sẽ bỏ qua `.env` hoàn toàn. Đây là lỗi thật đã gặp và đã sửa.

| Biến | Mặc định | Tác dụng |
|---|---|---|
| `BILLING_DISCOUNT_MONTHLY_PERCENT` | 0 | Giảm giá gói tháng, đơn vị % |
| `BILLING_DISCOUNT_YEARLY_PERCENT` | 0 | Giảm giá gói năm |
| `BILLING_DISCOUNT_LIFETIME_PERCENT` | 0 | Giảm giá gói trọn đời |
| `BILLING_DISCOUNT_LABEL` | `''` | Nhãn badge, VD `Tết 2027`. Rỗng ⇒ không hiện badge |
| `BILLING_DISCOUNT_STARTS_AT` | `''` | Ngày ISO bắt đầu. Ngoài khoảng ⇒ mọi giảm giá = 0 |
| `BILLING_DISCOUNT_ENDS_AT` | `''` | Ngày ISO kết thúc |
| `BILLING_LIFETIME_ENABLED` | bật | `false` ⇒ gói trọn đời biến mất khỏi bảng giá |
| `BILLING_TRIAL_DAYS` | 14 | Số ngày dùng thử |

Ví dụ chạy khuyến mãi Tết:

```bash
BILLING_DISCOUNT_YEARLY_PERCENT=20
BILLING_DISCOUNT_LABEL=Tết 2027
BILLING_DISCOUNT_STARTS_AT=2027-01-20
BILLING_DISCOUNT_ENDS_AT=2027-02-10
```

Gói năm còn 239.000đ kèm badge "Tết 2027", tự hết hiệu lực ngày 10/02, không cần
ai tắt bằng tay.

**Về `BILLING_LIFETIME_ENABLED`:** nó chỉ dừng **bán mới**, không bao giờ thu
hồi. Hộ đã mua giữ vĩnh viễn. Đáng để mắt: chi phí API giá thị trường chạy mãi
mãi cho một lần thu, nên đây là cần gạt để giới hạn số suất khi đạt mục tiêu.

Cách tính giá nằm trong hàm thuần `buildPlanOffers(now)`
(`domain/plan-pricing.ts`), có spec riêng.

---

## 5. Thanh toán

**PayOS**, chọn thay Casso và VNPay: 0đ phí giao dịch, có trang checkout kèm QR
sẵn, webhook có chữ ký HMAC-SHA256 chuẩn. VNPay tạm hoãn (cần giấy phép kinh
doanh, thẩm định 2–4 tuần, phí 1.1–2.2% — ở mức giá 39.000đ mỗi phần trăm đều
đáng kể).

**Mô hình trả trước, không tự động gia hạn.** Không cổng VN nào có recurring
thật ở mức giá này. Copy tiếng Việt vì thế dùng **"gói"** và **"gia hạn gói"**,
không dùng "đăng ký" — trung thực với thứ người ta thực sự mua.

Ràng buộc của PayOS đã ảnh hưởng tới thiết kế:

- **`orderCode` phải là số nguyên**, không nhận chuỗi. Nên mã đơn là `BigInt`
  sinh từ `(epochSeconds % 100_000_000) * 100 + random(0..99)`.
- **`description` tối đa 9 ký tự** với tài khoản chưa liên kết → gửi cố định
  `"OURSIGHT"`. Người dùng không phải gõ nội dung chuyển khoản: họ quét QR trên
  trang của PayOS.

| Biến | Bắt buộc |
|---|---|
| `PAYOS_CLIENT_ID` · `PAYOS_API_KEY` · `PAYOS_CHECKSUM_KEY` | ✅ thiếu ⇒ API trả `payments_unavailable` |
| `PAYOS_RETURN_URL` · `PAYOS_CANCEL_URL` | ✅ |
| `PAYOS_ORDER_TTL_MINUTES` | mặc định 30 |
| `PAYOS_BASE_URL` | mặc định `https://api-merchant.payos.vn` |

**Mobile hiện giá nhưng không bán.** Không có nút dẫn tới trang thanh toán —
App Store từ chối app link ra ngoài để mua. Ô nhập mã kích hoạt thì được: nhập
mã không phải là giao dịch. Dòng gia hạn nêu tên website dạng chữ thường.

---

## 6. Mã kích hoạt

Bán được hàng **không cần cổng thanh toán**: khách chuyển khoản → chạy CLI →
nhắn mã qua Zalo. Cũng là cơ chế tặng beta tester và trả thưởng giới thiệu.

Định dạng `OURS-XXXX-XXXX`, dùng **Crockford Base32** — bỏ `I`, `L`, `O`, `U`.
Khi tra cứu, ký tự dễ nhầm được quy đổi (`O→0`, `I/L→1`, `U→V`) **chỉ ở phần
thân**, giữ nguyên tiền tố. Nhờ vậy người gõ tay từ ảnh chụp màn hình Zalo vẫn
khớp mã thật. Ký tự cuối là checksum — bắt 31/32 lỗi gõ ngay tại client, không
tốn request và không tiêu lượt chống lạm dụng.

```bash
# 50 mã một năm cho chiến dịch Shopee
pnpm redeem:create -- --campaign=shopee-tet --count=50 \
  --grant=duration_days --days=365

# Beta tester, dùng đến hết 2026
pnpm redeem:create -- --campaign=beta-2026 --count=30 \
  --grant=until_date --until=2026-12-31

# Trọn đời cho người ủng hộ sớm
pnpm redeem:create -- --campaign=founder --count=10 --grant=lifetime

# Một mã dùng chung 200 suất
pnpm redeem:create -- --campaign=webinar --count=1 \
  --grant=duration_days --days=30 --max-redemptions=200
```

In ra CSV, dán thẳng vào Google Sheet. Tra cứu lại dùng Prisma Studio
(`pnpm prisma:studio`) — **không có admin UI**, và đó là chủ ý: một trang admin
cần route riêng, auth riêng, gate riêng cho việc mà một lệnh terminal làm xong
trong năm giây.

### Cộng dồn thời hạn

Ba quy tắc, mỗi cái tồn tại vì phá nó sẽ biến quà thành hình phạt:

1. **Không mất ngày nào.** Mốc bắt đầu là `max(hạn hiện tại, hôm nay)`. Đang có
   Premium tới 30/12 mà kích hoạt mã 3 tháng → thành 30/03. Gói đã hết hạn thì
   tính từ hôm nay, không cộng bù quá khứ.
2. **Không bao giờ rút ngắn.** Mã `until_date` có hạn gần hơn hạn hiện tại thì
   giữ nguyên và báo mã chưa dùng — hộ vẫn giữ được mã.
3. **Trọn đời nuốt mọi thứ sau nó.** Đã lifetime thì mã tiếp theo là vô tác
   dụng, và preview nói rõ điều đó **mà không tiêu mã**.

Trần cứng 5 năm, chặn lỗi nhập liệu và chặn cộng dồn vô hạn.

---

## 7. Nơi các con số thực sự sống

| Thứ | Nguồn duy nhất | Client đọc qua |
|---|---|---|
| Giá | `constants/plan-catalog.ts` | `GET /billing/plans` |
| Khuyến mãi | biến môi trường | `GET /billing/plans` |
| Hạn mức | `constants/plan-limits.ts` | `GET …/entitlement` (trường `limits`) |
| Trạng thái gói | bảng `household_subscriptions` | `GET …/entitlement` |

Đây là điều khiến việc đổi Free từ 2 lên 3 mục tiêu chỉ là **một dòng backend**,
và chạy khuyến mãi chỉ là **một biến môi trường** — không lần nào cần phát hành
lại app trên hai kho ứng dụng.

---

## 8. So với bản giả thuyết ở `06`

Bản `06-pricing-metrics-validation.md` viết trước khi sản phẩm được build và giờ
đã sai ở nhiều chỗ. Giữ lại làm tư liệu lịch sử, **không dùng làm tham chiếu**.

| `06` đề xuất | Thực tế | Vì sao |
|---|---|---|
| Free/Plus/Pro (49k/79k) | Free/Premium (39k/299k/699k) | Ba bậc khi chưa có người dùng thật là chia sai |
| Bán "basic reserve" | Không tồn tại | Protected Reserve đã bị gỡ khỏi sản phẩm |
| Bán "enhanced privacy controls" | Không tồn tại | Mức chia sẻ `private` đã bị xoá, chỉ còn `detail`/`summary_only` |
| Gate "partner sharing" ở Plus | **Không bao giờ gate** | Hộ một người là ngõ cụt — gate cái này giết activation |
| Bán "scenario history/comparison" | Chưa build | Bảng `what_if_scenarios` chưa tồn tại; what-if cố ý không lưu |
| Không nhắc giá thị trường tự động | Là một hạn mức thật | Đây là thứ duy nhất có chi phí biến đổi thật |
| Không có gói trọn đời | Có, bật/tắt bằng config | |
| Casso / VNPay | PayOS | 0đ phí, có checkout page sẵn |

Phần **vẫn đúng** và được giữ nguyên: tính theo hộ chứ không theo người; giá trị
trả tiền nằm ở tầng Foresight + Decision chứ không ở Storage + Logging; và
paywall đặt sau lần what-if đầu tiên thành công.

---

## 9. Đo lường — chưa làm được

Mục §4 và §5 của `06` (metrics, North Star) **chưa đo được**: repo hiện **không
có analytics** (không PostHog, Amplitude, GA) và **không có error monitoring**
(không Sentry).

Hệ quả cụ thể: mọi con số trong `plan-limits.ts` — 2 mục tiêu, 3 lượt tính thử,
1 tài sản tự cập nhật giá — đều là **giả thuyết chưa được kiểm chứng**. Chúng
nằm trong một file nên sửa rẻ, nhưng đừng nhầm chúng với quyết định đã có căn cứ.
Bản thân các con số này đã siết lại một lần (từ 5 lượt và 2 tài sản) trước khi
có bất kỳ dữ liệu nào — nên chúng là phán đoán sản phẩm, không phải kết quả đo.

Những câu hỏi cần trả lời trước khi tinh chỉnh giá:

| Câu hỏi | Dấu hiệu đáng lo |
|---|---|
| Có ai chạm trần không? | <20% hộ Free chạm bất kỳ hạn mức nào trong 30 ngày ⇒ Free quá rộng |
| Chạm có quá sớm không? | Trước ngày thứ 3 ⇒ chặn trước khi kịp tin sản phẩm |
| Paywall nào chuyển đổi? | Lý do nào dưới 2% ⇒ trục đó không đáng tiền |
| Trial → trả tiền | <5% ⇒ Premium chưa đủ khác biệt |
| Cơ cấu gói | Gói năm dưới 40% ⇒ mức tiết kiệm chưa đủ rõ |
| Gia hạn | <60% ⇒ sản phẩm chưa tạo lý do quay lại hằng tháng |

Chưa nên A/B giá trước khi có khoảng 100 hộ thật.

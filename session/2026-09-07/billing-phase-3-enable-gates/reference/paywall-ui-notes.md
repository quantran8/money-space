# Paywall UI — reference mockup

A standalone HTML mockup of the paywall was supplied on 2026-09-07 (Tailwind CDN
+ Urbanist + lucide, not part of the build). These are the decisions worth
carrying into the real component; the file itself is a sketch, not a spec.

## Layout

Two columns inside one dialog, ~940px max width, collapsing to a full-screen
sheet under 720px:

- **Left (value)** — eyebrow `OURSIGHT PREMIUM`, one headline, then a card of
  four benefit rows. Each row is `[36px icon] [label + one-line detail] [value]`,
  separated by hairlines. The right-hand value is the concrete number:
  `90 ngày`, `Luôn cập nhật`, `What-if`, `Không giới hạn`.
- **Right (pricing)** — a "one plan for both of you" callout, three plan
  buttons, one primary CTA, a payment note, and a quiet "Để sau".

## What to keep

- **The household callout above the plans.** "Một gói Premium cho cả hai người
  · Cả hai cùng được mở khóa. Không cần mua riêng từng người." Per-household
  pricing is the thing people misread as per-seat, and it is answered before the
  prices rather than after.
- **Two avatars (M / L) beside "Bạn nhận được"** — the same point, made
  visually.
- **The yearly plan pre-selected**, carrying the savings badge and the struck
  price. It is the plan the pricing is built around.
- **The CTA states the choice**: `Chọn gói 1 năm · 299.000đ`, not "Tiếp tục".
- **Benefits are outcomes, not features** — "Biết lúc nào household có thể bị
  căng", not "Forecast 90 ngày".
- **`Để sau` is present and quiet.** A paywall with no way out reads as a trap.

## What must change when it is built for real

- **No hardcoded prices.** The mockup writes `299.000đ`, `468.000đ`,
  `~24.900đ/tháng`. All of it comes from `GET /billing/plans` (`amount`,
  `compareAtAmount`, `savingsAmount`, `monthlyEquivalent`) — that is what makes
  a discount campaign an env change. Note the API rounds the monthly equivalent
  to `25.000đ`, not `24.900đ`.
- **The lifetime button is conditional** on `available`, which follows
  `BILLING_LIFETIME_ENABLED`.
- **A discount badge** appears only when `discountPercent > 0`, and reads
  `discountLabel`.
- **Copy must pass `check-copy.mjs`.** The mockup is clean, but keep clear of
  `"mua được"` (matched as a substring), `"kiểm tra ngay"` and `"cảnh báo"`.
- **Design tokens, not literals.** The mockup redefines `--ink`, `--wash`,
  `--data` etc. and writes `text-[28px]`; the real component uses the `.t-*`
  steps and the v5 tokens, and `check-design-scale.mjs` enforces it.
- **One sheet, many reasons.** The mockup is the `general` entry. The headline
  and the top benefit row change per `PaywallReason` (`goal_quota`,
  `whatif_quota`, `auto_price_quota`, `forecast_horizon`, `trial_ending`,
  `expired`) — a household that just hit the goal ceiling should see that
  sentence first.
- **Add the redeem-code line** at the foot: `Đã có mã kích hoạt?`. Highest
  intent moment there is — someone holding a code, at the wall.
- **Web uses `ResponsiveDialog`**; mobile uses `BottomSheet` and shows **no
  payment button at all**, only status and the code field.

## Payment note

The mockup says "Thanh toán qua VietQR". PayOS hosts its own checkout page with
the QR on it, so the real flow redirects to `checkoutUrl` rather than rendering
a QR inside the dialog.

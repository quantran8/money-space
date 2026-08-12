# Backend Tables & Relationships — Money Space MVP v3.1

## 1. Tổng quan

Money Space là app **shared financial clarity + foresight + decision support** cho couple/household.

Sản phẩm không đi theo hướng app ghi thu chi từng giao dịch nhỏ. Trung tâm của sản phẩm là:

```txt
households
snapshots
assets
debts
cashflow_events
protected_reserves
financial_goals
money_events
attention_items
```

Trong đó:

```txt
households
= không gian tài chính của một gia đình/couple

snapshots
= bức tranh tài chính được freeze tại một thời điểm

assets
= tiền/tài sản đang nằm ở đâu, ai đang giữ và mức chia sẻ

debts
= khoản vay / khoản nợ household còn phải trả

cashflow_events
= dòng tiền dự kiến trong tương lai, gồm cả incoming và outgoing

protected_reserves
= phần tiền household muốn bảo vệ, không coi là discretionary money

financial_goals
= mục tiêu tài chính và các input cần để projection

money_events
= sự kiện tài chính đã thực sự xảy ra và đáng ghi nhận

attention_items
= khoản/tình huống cần chú ý
```

Schema vẫn hỗ trợ long-term asset valuation:

```txt
asset_valuations
= lịch sử giá trị của từng tài sản

snapshot_asset_values
= giá trị từng asset được freeze trong từng snapshot

asset_market_positions
= số lượng vàng/crypto/cổ phiếu/quỹ/ngoại tệ mà user đang giữ

market_prices
= giá thị trường được cache từ API bên ngoài

fx_rates
= tỷ giá ngoại tệ

asset_calculation_terms
= thông tin đầu vào để tự tính tài sản như gửi tiết kiệm, trái phiếu, khoản cho vay
```

Decision layer của v3.1 **không yêu cầu thêm bảng `what_if_scenarios` trong MVP**. What-if được xử lý bằng calculation service stateless:

```txt
ForecastCalculationService
FlexibleMoneyCalculationService
WhatIfCalculationService
```

Chỉ thêm bảng scenario sau này nếu product có nhu cầu save / compare / revisit / freeze scenario.

---

# 2. Những update chính sau review

## 2.1. Thêm `money_events`

Schema ban đầu cần một model để user log khoản chi/thu/sự kiện tài chính đáng ghi nhận.

Không nên gọi là `transactions`, vì dễ khiến sản phẩm bị hiểu thành app ghi thu chi chi tiết.

Dùng:

```txt
money_events
```

Mục tiêu:

```txt
Ghi lại các sự kiện tài chính đủ quan trọng để giải thích biến động snapshot.
```

Ví dụ:

```txt
Đóng học phí 12M
Sửa xe 5M
Nhận lương 35M
Chuyển 20M sang tiết kiệm
Mua thêm vàng 20M
Góp 10M vào quỹ dự phòng
```

---

## 2.2. Tách `money_events` và `asset_valuations`

Không dùng `money_events` để lưu mọi thay đổi giá trị tài sản.

Cần tách:

```txt
money_events
= dòng tiền hoặc sự kiện tài chính

asset_valuations
= giá trị tài sản tại từng thời điểm
```

Ví dụ:

```txt
Mua thêm vàng 20M
→ money_events

Giá vàng tăng khiến giá trị vàng từ 54M lên 58M
→ asset_valuations
```

---

## 2.3. Đổi `assets.value` thành `assets.current_value`

Không nên để field tên `value` vì dễ nhầm là giá trị cố định.

Dùng:

```txt
current_value
```

Ý nghĩa:

```txt
current_value
= giá trị hiện tại mới nhất của asset, dùng để query dashboard nhanh
```

Lịch sử giá trị nằm ở:

```txt
asset_valuations
```

---

## 2.4. Thêm `valuation_mode`

Mỗi asset cần biết cách định giá:

```txt
manual
market_priced
formula_calculated
```

Ý nghĩa:

```txt
manual
= user tự nhập giá trị ước tính

market_priced
= app tự lấy giá thị trường từ API bên ngoài

formula_calculated
= app tự tính dựa trên input ban đầu
```

---

## 2.5. Hỗ trợ auto pricing cho vàng, crypto, cổ phiếu, quỹ, ngoại tệ

Với các loại asset như:

```txt
gold
crypto
stock
fund
foreign_currency
```

Không nên bắt user nhập giá thủ công.

User chỉ nhập:

```txt
mình đang giữ gì
số lượng bao nhiêu
đơn vị là gì
```

App tự lấy giá từ API, cache vào `market_prices`, rồi tính ra `assets.current_value`.

---

## 2.6. Hỗ trợ calculated assets cho gửi tiết kiệm, trái phiếu, khoản cho vay

Với các loại asset như:

```txt
saving_deposit
bond
loan_receivable
certificate_of_deposit
```

User chỉ nhập input ban đầu:

```txt
số tiền gốc
lãi suất
ngày bắt đầu
ngày đáo hạn
cách trả lãi
```

App tự tính giá trị hiện tại và lưu vào `asset_valuations`.

---

## 2.7. Thêm `snapshot_asset_values`

Snapshot không nên chỉ lưu tổng số.

Cần freeze giá trị từng asset tại thời điểm snapshot.

Lý do:

```txt
Snapshot tháng trước không bị thay đổi ngầm khi giá vàng/crypto/cổ phiếu hôm nay thay đổi.
```

---

## 2.8. Thêm debt / liability core

Snapshot đã có `total_debt`, nhưng trước đây chưa có bảng core để lưu từng khoản nợ.

Với khoản vay, cần tách rõ:

```txt
Tiền nhận được
= asset tăng

Khoản phải trả lại
= debt tăng
```

Ví dụ vay 100M nhận vào VCB:

```txt
assets.current_value của VCB +100M
debts.outstanding_amount +100M
net worth không đổi
```

Schema MVP vì vậy cần thêm:

```txt
debts
debt_interest_periods
```

Ghi chú: các điều khoản trả nợ (payment_frequency, fixed_payment_amount, minimum_payment_amount, interest_type, interest_calculation) đã được gộp thẳng vào bảng `debts`, không tách riêng bảng `debt_terms`.

`cashflow_events` và `money_events` cũng nên có `debt_id` để nối kỳ trả nợ và các sự kiện liên quan về đúng khoản vay gốc.


## 2.9. Đổi `upcoming_payments` thành `cashflow_events`

V3.1 cần forecast cả tiền vào và tiền ra.

```txt
cashflow_events
= future expected cash-flow

money_events
= actual financial events that already happened
```

Không tạo riêng `upcoming_incomes` vì một timeline unified sẽ đơn giản hơn cho forecast engine.

---

## 2.10. Thêm `protected_reserves`

Flexible Money cần biết phần tiền household muốn bảo vệ.

Ví dụ:

```txt
Emergency fund = 100M
```

Reserve là financial constraint, không nhất thiết là một account riêng.

---

## 2.11. Update `financial_goals` cho projection

Goal cần có current state ngay từ onboarding và contribution rate để tính projected date / goal delay.

Thêm:

```txt
current_amount
current_amount_updated_at
target_date
planned_monthly_contribution
```

Không derive `current_amount` hoàn toàn từ lịch sử `money_events`, vì user mới có thể đã tiết kiệm được một số tiền trước khi dùng app.

---

## 2.12. What-if là calculation service, không phải table

MVP chỉ preview consequence:

```txt
POST /households/:id/what-if
→ calculate realtime
→ return result
→ không persist scenario
```

Chỉ thêm `what_if_scenarios` khi cần:

```txt
save scenario
compare scenarios
revisit later
freeze result để share partner
convert scenario thành planned event
```

---

## 2.13. Update asset semantics cho household + privacy

Tách hai câu hỏi độc lập:

```txt
financial_nature
= khoản này có tính chất household/personal thế nào

visibility_level
= partner được thấy chi tiết tới đâu
```

Thêm `privacy_owner_member_id` để không dùng `created_by` làm ownership của dữ liệu private.

---

## 2.14. Snapshot freeze thêm foresight context

Snapshot v3.1 freeze thêm:

```txt
protected_reserve_amount
upcoming_income_amount
upcoming_outgoing_amount
lowest_projected_balance
flexible_money
forecast_horizon_days
```

Các giá trị realtime vẫn được tính từ current assets + cashflow events + reserve + goals. Snapshot chỉ dùng cho history.

---

## 2.15. Recurrence dùng projection, không cần pre-create mọi kỳ

`cashflow_events` lưu recurrence rule đơn giản. Forecast service tự generate virtual occurrences trong horizon.

Không cần đợi kỳ hiện tại completed mới tạo kỳ tiếp theo để forecast 30/60/90 ngày.

---

# 3. Schema groups

## User & Household

```txt
profiles
households
household_members
household_invites
```

## Finance Core — Clarity / Foresight / Goals

```txt
snapshots
assets
asset_valuations
snapshot_asset_values

debts
debt_interest_periods

cashflow_events
protected_reserves
financial_goals

money_events
money_event_categories
attention_items
```

## Asset Pricing / Calculation

```txt
asset_market_positions
market_prices
fx_rates
asset_calculation_terms
```

## Application Calculation Services — không phải DB tables

```txt
ForecastCalculationService
FlexibleMoneyCalculationService
WhatIfCalculationService
GoalProjectionService
```

## System / Safety

```txt
audit_logs
```

---

# 4. MVP table priority

## Must-have cho v3.1

```txt
profiles
households
household_members
household_invites

snapshots
assets
asset_valuations
snapshot_asset_values

cashflow_events
protected_reserves
financial_goals

money_events
attention_items

audit_logs
```

## Existing / giữ nếu đã build, nhưng không ưu tiên mở rộng MVP

```txt
debts
debt_interest_periods

asset_market_positions
market_prices
fx_rates
asset_calculation_terms
money_event_categories
```

## Later

```txt
notification_preferences
monthly_reports
exports
bank_imports
bank_connections
discussion_threads
comments
advanced_recurring_rules
what_if_scenarios
```

`what_if_scenarios` chỉ chuyển lên core khi user thực sự cần save / compare / revisit scenario.

---

# 5. Relationship overview

```txt
auth.users
   │
   │ 1 - 1
   ▼
profiles
   │
   │ 1 - n
   ▼
household_members
   ▲
   │ n - 1
   │
households
   ├── household_invites
   ├── snapshots
   ├── assets
   ├── asset_valuations
   ├── snapshot_asset_values
   ├── asset_market_positions
   ├── asset_calculation_terms
   ├── debts
   ├── debt_interest_periods
   ├── cashflow_events
   ├── protected_reserves
   ├── financial_goals
   ├── money_events
   ├── attention_items
   └── audit_logs
```

Chi tiết asset:

```txt
assets
   ├── asset_valuations
   ├── asset_market_positions
   ├── asset_calculation_terms
   ├── snapshot_asset_values
   ├── cashflow_events.planned_asset_id
   ├── cashflow_events.last_completed_asset_id
   ├── money_events.from_asset_id
   └── money_events.to_asset_id
```

Chi tiết snapshot:

```txt
snapshots
   └── snapshot_asset_values
```

Chi tiết cash-flow / goal:

```txt
cashflow_events
   └── money_events.cashflow_event_id

financial_goals
   ├── cashflow_events.financial_goal_id
   └── money_events.financial_goal_id
```

Decision calculation:

```txt
current assets
+ cashflow_events
+ protected_reserves
+ financial_goals
→ ForecastCalculationService
→ FlexibleMoneyCalculationService
→ WhatIfCalculationService
```

Không có `what_if_scenarios` table trong MVP.

---

# 6. Table: profiles

## Dùng để làm gì?

Lưu thông tin hiển thị của user trong app.

Auth provider như Supabase Auth quản lý đăng nhập, password, session.

`profiles` chỉ lưu thông tin product cần hiển thị.

## Fields

```txt
id              uuid primary key references auth.users(id)

full_name       text
display_name    text
avatar_url      text
email           text
phone           text

created_at      timestamptz not null default now()
updated_at      timestamptz
```

## Relationships

```txt
profiles 1 - n household_members
profiles 1 - n households.created_by
profiles 1 - n snapshots.created_by
profiles 1 - n assets.created_by
profiles 1 - n cashflow_events.created_by
profiles 1 - n protected_reserves.created_by
profiles 1 - n financial_goals.created_by
profiles 1 - n money_events.created_by
profiles 1 - n audit_logs.actor_id
```

## Note

`email` và `phone` trong `profiles` chỉ nên xem là cached display info.

Source of truth cho đăng nhập vẫn là auth provider.

---

# 7. Table: households

## Dùng để làm gì?

`households` là một “nhà”, tức không gian tài chính chung của couple/family.

Tất cả dữ liệu tài chính đều thuộc về một household.

## Fields

```txt
id                         uuid primary key

name                       text not null
currency                   text not null default 'VND'
update_frequency           text not null default 'weekly'
financial_management_mode  text not null default 'unsure'

created_by                 uuid references profiles(id)

created_at                 timestamptz not null default now()
updated_at                 timestamptz
deleted_at                 timestamptz
```

## Enum

```txt
update_frequency:
- weekly
- monthly
- manual

financial_management_mode:
- one_person_primary
- partner_primary
- split_responsibility
- joint
- unsure
```

`financial_management_mode` dùng để personalize onboarding/analytics, không quyết định permission.

## Constraints

```txt
name <> ''
currency <> ''
```

## Relationships

```txt
households 1 - n household_members
households 1 - n household_invites
households 1 - n snapshots
households 1 - n assets
households 1 - n asset_valuations
households 1 - n snapshot_asset_values
households 1 - n debts
households 1 - n debt_interest_periods
households 1 - n cashflow_events
households 1 - n protected_reserves
households 1 - n money_events
households 1 - n money_event_categories
households 1 - n financial_goals
households 1 - n attention_items
households 1 - n audit_logs
```

## Note

`currency` reference tới `currencies(code)` (xem §14A). Không còn dùng enum/text tự do cho tiền tệ.

---

# 8. Table: household_members

## Dùng để làm gì?

Lưu user nào thuộc household nào và có quyền gì.

Đây là bảng quan trọng cho permission và enforcement quyền (app-layer guard, xem §31).

## Fields

```txt
id                  uuid primary key

household_id        uuid not null references households(id)
user_id             uuid not null references profiles(id)

role                text not null
permission_level    text                    (nullable, null = derive từ role)

status              text not null default 'active'

joined_at           timestamptz
invited_by          uuid references profiles(id)

created_at          timestamptz not null default now()
updated_at          timestamptz
deleted_at          timestamptz
```

## Enum

```txt
role:
- owner
- partner
- viewer

permission_level:
- view_summary
- view_grouped
- view_detail
- edit_content
- admin

status:
- active
- invited
```

## Note về permission_level

`permission_level` giờ NULLABLE và chỉ là override.

```txt
permission_level = null
→ capability được derive từ role (role → permission mặc định)

permission_level = <giá trị>
→ override, dùng thẳng giá trị này thay cho mặc định của role
```

`status`:

```txt
active
= member đang hoạt động

invited
= record được tạo sẵn cho lời mời, chưa join thật
```

Bảng dùng soft-delete qua `deleted_at`.

## Constraints

```txt
unique(household_id, user_id)
```

## Permission meaning

```txt
view_summary
= chỉ xem tổng quan: tổng tiền, tổng tài sản, tổng nợ, trạng thái

view_grouped
= xem theo nhóm: tiền mặt, ngân hàng, tiết kiệm, vàng, nợ

view_detail
= xem chi tiết các khoản được chia sẻ

edit_content
= thêm/sửa tài sản, cash-flow dự kiến, reserve, mục tiêu, snapshot

admin
= quản lý thành viên, quyền truy cập, household settings
```

## Important note

Các bảng như `assets`, `cashflow_events` reference đến `household_members`.

Cần đảm bảo member được reference thuộc cùng household.

Có thể enforce bằng:

```txt
app logic
database trigger
composite foreign key
```

---

# 9. Table: household_invites

## Dùng để làm gì?

Lưu lời mời partner/thành viên vào household.

## Fields

```txt
id                         uuid primary key

household_id               uuid not null references households(id)
invited_by                 uuid not null references profiles(id)

invitee_email              text
invitee_phone              text
token                      text not null unique

status                     text not null default 'pending'

default_role               text not null default 'partner'
default_permission_level   text                    (nullable, null = derive từ default_role)

expires_at                 timestamptz not null

accepted_by                uuid references profiles(id)
accepted_at                timestamptz

created_at                 timestamptz not null default now()
updated_at                 timestamptz
```

## Enum

```txt
status:
- pending
- accepted
- expired
- cancelled
```

## Constraints

```txt
invitee_email is not null OR invitee_phone is not null
```

## Flow

```txt
1\. User tạo household
2\. User tạo invite
3\. App tạo household_invites status = pending
4\. Partner bấm link
5\. Partner đăng ký/đăng nhập
6\. App tạo household_members
7\. Invite chuyển thành accepted
```

---

# 10. Table: snapshots

## Dùng để làm gì?

`snapshots` lưu bức tranh tài chính được freeze tại một thời điểm.

Snapshot không phải ledger và cũng không phải source of truth cho forecast realtime.

Snapshot trả lời:

```txt
Nhà mình tại thời điểm đó đang thế nào?
Tiền thanh khoản là bao nhiêu?
Reserve đã đặt là bao nhiêu?
30 ngày sau snapshot có incoming/outgoing bao nhiêu?
Lowest projected balance là bao nhiêu?
Flexible money tại thời điểm snapshot là bao nhiêu?
Tổng nợ là bao nhiêu?
```

## Fields

```txt
id                           uuid primary key
household_id                 uuid not null references households(id)

snapshot_date                date not null

total_liquid                 numeric not null default 0
total_savings                numeric not null default 0
total_long_term_assets       numeric not null default 0
total_debt                   numeric not null default 0

protected_reserve_amount     numeric not null default 0
forecast_horizon_days        integer not null default 30
upcoming_income_amount       numeric not null default 0
upcoming_outgoing_amount     numeric not null default 0
lowest_projected_balance     numeric
flexible_money               numeric

attention_count              integer not null default 0

note                         text

created_by                   uuid references profiles(id)     (nullable, ON DELETE SET NULL)
created_at                   timestamptz not null default now()
deleted_at                   timestamptz
```

`lowest_projected_balance` và `flexible_money` có thể âm nên không đặt constraint >= 0.

## Derived values (không lưu cột)

`status` và `source_mode` được derive lúc đọc:

```txt
status
- on_track
- watch
- tight
- incomplete

Gợi ý logic:
- on_track: required cash-flow covered + reserve protected
- watch: flexible money thấp / forecast gần reserve / data cần confirm
- tight: projected balance âm hoặc reserve bị chạm đáng kể
- incomplete: thiếu critical data

source_mode
- manual
- calculated
- mixed
```

## Constraints

```txt
total_liquid >= 0
total_savings >= 0
total_long_term_assets >= 0
total_debt >= 0
protected_reserve_amount >= 0
forecast_horizon_days > 0
upcoming_income_amount >= 0
upcoming_outgoing_amount >= 0
attention_count >= 0
```

## Source of truth

```txt
assets
= trạng thái hiện tại của từng nguồn tiền/tài sản

cashflow_events
= các dòng tiền tương lai đang được forecast

protected_reserves
= constraint cần bảo vệ

financial_goals
= current goal state + contribution assumptions

asset_valuations
= lịch sử giá trị của từng asset

snapshots
= số tổng và foresight context được chốt tại một thời điểm

snapshot_asset_values
= giá trị từng asset được freeze trong snapshot

money_events
= bối cảnh giải thích các sự kiện đã xảy ra
```

Realtime Home / What-if không đọc snapshot gần nhất làm source of truth; nó calculate từ current state.

## Endpoints

```txt
POST /snapshots
= tạo snapshot thật theo flow §26

GET /snapshots
= đọc snapshots, status + sourceMode derive lúc đọc
```

---

# 11. Table: assets

## Dùng để làm gì?

`assets` lưu tiền/tài sản của household đang nằm ở đâu.

Nó trả lời:

```txt
Tiền nhà mình đang nằm ở đâu?
Có bao nhiêu tiền có thể dùng ngay?
Có bao nhiêu tiền tiết kiệm?
Có tài sản dài hạn gì?
Ai đang giữ khoản đó?
Khoản này là shared hay personal?
Partner được thấy chi tiết tới đâu?
```

## Fields

```txt
id                       uuid primary key
household_id             uuid not null references households(id)

name                     text not null
type                     text not null

valuation_mode           text not null default 'manual'

current_value            numeric not null default 0
currency                 text not null default 'VND'
value_updated_at         timestamptz

holder_member_id         uuid references household_members(id)
privacy_owner_member_id  uuid references household_members(id)

liquidity                text not null
financial_nature         text not null default 'household'
purpose                  text
visibility_level         text not null default 'detail'
note                     text

created_by               uuid references profiles(id)
created_at               timestamptz not null default now()
updated_by               uuid references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

## Enum

```txt
type:
- cash
- bank_account
- saving_deposit
- bond
- gold
- stock
- fund
- crypto
- foreign_currency
- real_estate
- insurance
- loan_receivable
- certificate_of_deposit
- investment
- other

valuation_mode:
- manual
- market_priced
- formula_calculated

liquidity:
- usable_now
- not_immediately_usable
- long_term

financial_nature:
- household
- personal_included
- managed_for_household
- personal_private

visibility_level:
- summary_only
- grouped
- detail
- private
```

Hai trục khác nhau:

```txt
financial_nature
= khoản tiền có vai trò gì trong household planning

visibility_level
= partner được xem tới mức nào
```

## Shared calculation rule

Không cần thêm cột `included_in_household_calculation` ở MVP; có thể derive:

```txt
financial_nature = personal_private
→ excluded

visibility_level = private
→ excluded

household / managed_for_household / personal_included
+ visibility != private
→ included trong shared totals / forecast theo liquidity
```

## Constraints

```txt
current_value >= 0
name <> ''
currency <> ''
```

## Privacy note

Không dùng `created_by` để suy ra owner của dữ liệu private.

```txt
created_by
= ai nhập record

holder_member_id
= ai đang giữ / phụ trách khoản này

privacy_owner_member_id
= member sở hữu quyền riêng tư của record
```

Với `visibility_level = private`, new records nên có `privacy_owner_member_id`.

## Notes

`assets.current_value` là cached current value để dashboard query nhanh.

Lịch sử giá trị nằm ở `asset_valuations`.

Với asset có giá thị trường như vàng, crypto, cổ phiếu, app có thể tự cập nhật `current_value` từ API.

Với asset tính được như gửi tiết kiệm, trái phiếu, app có thể tự tính `current_value` từ input ban đầu.

---

# 12. Table: asset_market_positions

## Dùng để làm gì?

Lưu position của các asset có thể tự định giá theo giá thị trường.

Dùng cho:

```txt
gold
crypto
stock
fund
foreign_currency
```

User không nhập giá trị hiện tại. User chỉ nhập số lượng, mã, đơn vị. App tự lấy giá.

## Fields

```txt
id                    uuid primary key

household_id          uuid not null references households(id)
asset_id              uuid not null references assets(id)

symbol                text
market                text
asset_class           text not null

quantity              numeric not null
unit                  text

quote_currency        text not null
price_source          text
price_source_symbol   text

last_price            numeric
last_price_at         timestamptz

created_at            timestamptz not null default now()
updated_at            timestamptz
deleted_at            timestamptz
```

## Enum

```txt
asset_class:
- gold
- crypto
- stock
- fund
- foreign_currency
```

## Constraints

```txt
quantity >= 0
quote_currency <> ''
```

## Examples

### Gold

```txt
asset_class = gold
symbol = SJC
quantity = 5
unit = chi
quote_currency = VND
price_source = gold_price_api
```

### Crypto

```txt
asset_class = crypto
symbol = BTC
quantity = 0.05
unit = BTC
quote_currency = USD
price_source = crypto_price_api
```

### Stock

```txt
asset_class = stock
symbol = FPT
market = HOSE
quantity = 100
unit = shares
quote_currency = VND
price_source = stock_price_api
```

---

# 13. Table: market_prices

## Dùng để làm gì?

Cache giá thị trường từ API bên ngoài.

Không nên gọi API mỗi lần mở dashboard.

## Fields

```txt
id                    uuid primary key

asset_class           text not null
symbol                text not null
market                text
quote_currency        text not null

price                 numeric not null
price_time            timestamptz not null

source                text not null
source_payload_hash   text

created_at            timestamptz not null default now()
```

## Constraints

```txt
price >= 0
symbol <> ''
quote_currency <> ''
source <> ''
```

## Index

```txt
market_prices(asset_class, symbol, market, quote_currency, price_time desc)
```

## Usage

App lấy latest price theo:

```txt
asset_class + symbol + market + quote_currency
```

Sau đó tính:

```txt
asset_value = quantity \* latest_price
```

Nếu quote currency khác household currency, dùng `fx_rates`.

---

# 14. Table: fx_rates

## Dùng để làm gì?

Lưu tỷ giá để quy đổi tài sản về currency của household.

Ví dụ app chính dùng VND, nhưng BTC có giá USD.

## Fields

```txt
id              uuid primary key

base_currency   text not null
quote_currency  text not null

rate            numeric not null
rate_time       timestamptz not null

source          text not null

created_at      timestamptz not null default now()
```

## Constraints

```txt
rate > 0
base_currency <> ''
quote_currency <> ''
source <> ''
```

## Example

```txt
base_currency = USD
quote_currency = VND
rate = 25400
```

## Index

```txt
fx_rates(base_currency, quote_currency, rate_time desc)
```

## Note

`base_currency` và `quote_currency` reference tới `currencies(code)` (xem §14A).

---

# 14A. Table: currencies

## Dùng để làm gì?

Bảng chuẩn hóa danh mục tiền tệ theo ISO-4217. Đây là **\*\*nguồn chuẩn hóa đa tiền tệ\*\*** duy nhất, thay cho các bộ enum currency mâu thuẫn nhau trước đây (households.currency, assets.currency, quote_currency của market position/fx_rate...).

## Fields

```txt
code         char(3) primary key         (ISO-4217, ví dụ VND, USD, EUR)

name         text not null
symbol       text
decimals     integer not null default 0
is_active    boolean not null default true
```

## Constraints

```txt
code <> ''
decimals >= 0
```

## Example

```txt
code = VND, name = Vietnamese Dong, symbol = ₫, decimals = 0
code = USD, name = US Dollar,       symbol = $, decimals = 2
```

## Note về FK

Mọi cột currency trong schema giờ có foreign key tới `currencies(code)`:

```txt
households.currency
assets.currency
asset_valuations.currency
asset_calculation_terms.currency
snapshot_asset_values.currency
cashflow_events (amount cùng household currency)
money_events.currency
financial_goals (theo household currency)
debts.currency
asset_market_positions.quote_currency
market_prices.quote_currency
fx_rates.base_currency
fx_rates.quote_currency
```

Điều này thay thế 3 bộ enum tiền tệ mâu thuẫn trước đây bằng một danh mục duy nhất.

---

# 15. Table: asset_calculation_terms

## Dùng để làm gì?

Lưu thông tin đầu vào để app tự tính giá trị hiện tại của các asset có công thức.

Dùng cho:

```txt
saving_deposit
bond
loan_receivable
certificate_of_deposit
```

User không phải nhập giá trị mỗi tháng. User chỉ nhập điều kiện ban đầu.

## Fields

```txt
id                    uuid primary key

household_id          uuid not null references households(id)
asset_id              uuid not null references assets(id)

calculation_type      text not null

principal_amount      numeric not null
currency              text not null default 'VND'

start_date            date not null
maturity_date         date

interest_rate         numeric
interest_rate_type    text
compounding_frequency text
payout_frequency      text

coupon_rate           numeric
coupon_frequency      text

expected_return_rate  numeric

status                text not null default 'active'

created_at            timestamptz not null default now()
updated_at            timestamptz
deleted_at            timestamptz
```

## Enum

```txt
calculation_type:
- saving_deposit
- bond
- loan_receivable
- certificate_of_deposit
- custom_interest
```

```txt
interest_rate_type:
- fixed
- floating
```

```txt
compounding_frequency:
- none
- daily
- monthly
- quarterly
- yearly
- at_maturity
```

```txt
payout_frequency:
- at_maturity
- monthly
- quarterly
- yearly
```

```txt
status:
- active
- matured
- closed
- cancelled
```

## Constraints

```txt
principal_amount >= 0
interest_rate >= 0
coupon_rate >= 0
expected_return_rate >= 0
```

## Example: saving deposit

User nhập:

```txt
principal_amount = 100.000.000
interest_rate = 5% / year
start_date = 2026-07-01
maturity_date = 2027-01-01
payout_frequency = at_maturity
compounding_frequency = at_maturity
```

App tự tính:

```txt
estimated_current_value
expected_interest
maturity_value
days_elapsed
days_to_maturity
```

Sau đó app tạo:

```txt
asset_valuations
```

với:

```txt
valuation_method = formula_calculated
```

---

# 16. Table: asset_valuations

## Dùng để làm gì?

Lưu lịch sử giá trị của từng asset tại từng thời điểm.

Bất kể giá trị đến từ đâu, cuối cùng đều lưu vào `asset_valuations`.

Nguồn giá trị có thể là:

```txt
manual
market_price_api
formula_calculated
statement
appraised
other
```

## Fields

```txt
id                    uuid primary key

household_id          uuid not null references households(id)
asset_id              uuid not null references assets(id)

value                 numeric not null
currency              text not null default 'VND'
valuation_date        date not null

valuation_method      text not null
source                text
confidence_level      text

market_price_id       uuid references market_prices(id)
fx_rate_id            uuid references fx_rates(id)
calculation_term_id   uuid references asset_calculation_terms(id)

note                  text

created_by            uuid references profiles(id)
created_at            timestamptz not null default now()
updated_by            uuid references profiles(id)
updated_at            timestamptz
deleted_at            timestamptz
```

## Enum

```txt
valuation_method:
- manual
- market_price_api
- formula_calculated
- statement
- appraised
- other
```

```txt
confidence_level:
- low
- medium
- high
```

## Constraints

```txt
value >= 0
currency <> ''
```

## Suggested unique index

```txt
unique(asset_id, valuation_date)
where deleted_at is null
```

## Usage

### Manual asset

```txt
real_estate
insurance
other
```

User nhập giá trị ước tính. App tạo `asset_valuations`.

### Market-priced asset

```txt
gold
crypto
stock
fund
foreign_currency
```

App lấy giá từ API, tính giá trị, tạo `asset_valuations`.

### Formula-calculated asset

```txt
saving_deposit
bond
loan_receivable
certificate_of_deposit
```

App tính giá trị từ `asset_calculation_terms`, tạo `asset_valuations`.

## Important rule

Khi tạo valuation mới:

```txt
1\. Create asset_valuations
2\. Update assets.current_value nếu valuation đó là latest
3\. Update assets.value_updated_at
4\. Write audit_logs asset.valuation_created
```

---

# 17. Table: snapshot_asset_values

## Dùng để làm gì?

Freeze giá trị và classification của từng asset trong từng snapshot.

Nếu không có bảng này, snapshot cũ có thể bị thay đổi ngầm khi giá hoặc metadata asset hôm nay thay đổi.

## Fields

```txt
id                       uuid primary key

household_id             uuid not null references households(id)
snapshot_id              uuid not null references snapshots(id)
asset_id                 uuid not null references assets(id)

asset_name               text not null
asset_type               text not null
liquidity                text not null
financial_nature         text not null
holder_member_id         uuid references household_members(id)
privacy_owner_member_id  uuid references household_members(id)

value                    numeric not null
currency                 text not null default 'VND'

valuation_id             uuid references asset_valuations(id)
valuation_method         text
valuation_date           date

visibility_level         text not null

created_at               timestamptz not null default now()
```

## Constraints

```txt
value >= 0
unique(snapshot_id, asset_id)
```

## Vì sao freeze metadata?

Để snapshot lịch sử không bị sai nếu sau này user đổi:

- tên asset
- liquidity
- financial nature
- holder
- sharing/privacy metadata

Snapshot đã tạo thì không đổi ngầm.

---

# 18. Table: cashflow_events

## Dùng để làm gì?

Lưu các dòng tiền **dự kiến trong tương lai**, gồm cả incoming và outgoing.

Đây là input chính cho timeline forecast và Flexible Money.

Nó trả lời:

```txt
Sắp tới tiền nào sẽ vào?
Sắp tới phải trả gì?
Khi nào event xảy ra?
Khoản đó bao nhiêu?
Ai phụ trách?
Mức chắc chắn thế nào?
Event đã xảy ra thật chưa?
```

`cashflow_events` khác `money_events`:

```txt
cashflow_events
= expected future

money_events
= actual past / completed event
```

## Fields

```txt
id                       uuid primary key
household_id             uuid not null references households(id)

name                     text not null
direction                text not null
amount                   numeric not null default 0
expected_date            date not null

recurrence               text not null default 'once'
recurrence_end_date      date

requirement              text
certainty                text not null default 'confirmed'

owner_member_id          uuid references household_members(id)
privacy_owner_member_id  uuid references household_members(id)

debt_id                  uuid references debts(id)
financial_goal_id        uuid references financial_goals(id)

planned_asset_id         uuid references assets(id)

status                   text not null default 'expected'
attention_level          text not null default 'normal'
visibility_level         text not null default 'detail'

last_completed_at        timestamptz
last_completed_by        uuid references profiles(id)
last_completed_amount    numeric
last_completed_asset_id  uuid references assets(id)

note                     text

created_by               uuid references profiles(id)
created_at               timestamptz not null default now()
updated_by               uuid references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

## Enum

```txt
direction:
- incoming
- outgoing

recurrence:
- once
- weekly
- monthly
- quarterly
- yearly

requirement:
- required
- planned
- null        # thường dùng cho incoming

certainty:
- confirmed
- estimated

status:
- expected
- completed
- pending_confirmation
- postponed
- overdue
- cancelled

attention_level:
- normal
- important
- urgent

visibility_level:
- summary_only
- grouped
- detail
- private
```

## Validation rules

```txt
direction = incoming
→ requirement nên null

direction = outgoing
→ requirement = required | planned

recurrence_end_date nếu có
→ >= expected_date
```

## Constraints

```txt
amount >= 0
last_completed_amount >= 0
name <> ''
```

## Completion logic

### One-time event

Nếu `recurrence = once` và event hoàn tất:

```txt
1. Create money_events từ actual occurrence
2. Update:
   - status = completed
   - last_completed_at
   - last_completed_by
   - last_completed_amount
   - last_completed_asset_id
```

Outgoing tạo `money_events.event_type = payment_paid`. Incoming tạo `money_events.event_type = income`. Cả hai link bằng `money_events.cashflow_event_id`.

### Recurring event

Nếu `recurrence != once`, record `cashflow_events` đóng vai trò **series hiện tại**, không phải lịch sử từng occurrence.

Khi occurrence hiện tại hoàn tất:

```txt
1. Create money_events cho occurrence vừa xảy ra
2. Update last_completed_*
3. Advance expected_date sang kỳ tiếp theo
4. Giữ status = expected
```

Ví dụ:

```txt
Salary monthly
expected_date = 2026-08-15

15 Aug received
→ create money_event income
→ last_completed_at = 2026-08-15
→ expected_date = 2026-09-15
→ status vẫn expected
```

Nhờ vậy không cần tạo trước từng row tháng sau nhưng forecast vẫn có series tiếp tục.

## Recurring logic MVP

Không cần pre-create từng record kỳ tiếp theo.

Ví dụ một record:

```txt
Salary
expected_date = 2026-08-15
recurrence = monthly
```

Forecast service có thể generate virtual occurrences:

```txt
2026-08-15
2026-09-15
2026-10-15
...
```

trong horizon đang xem.

Forecast generate virtual occurrences bắt đầu từ `expected_date` hiện tại. Nếu sau này recurrence phức tạp hơn (custom day rules, biweekly, exceptions) mới tách `recurring_cashflow_rules`.

---

# 19. Table: money_events

## Dùng để làm gì?

Lưu các sự kiện tài chính **đã thực sự xảy ra** và đáng ghi nhận.

Đây không phải bảng transaction chi tiết.

Nó trả lời:

```txt
Gần đây có khoản lớn nào xảy ra không?
Vì sao tiền dùng ngay tăng/giảm?
Khoản actual này có xuất phát từ cash-flow dự kiến nào không?
Khoản này liên quan đến asset, debt, goal hay snapshot nào?
```

## Fields

```txt
id                       uuid primary key
household_id             uuid not null references households(id)

title                    text not null
description              text

event_type               text not null
category                 text                    (code, FK mềm tới money_event_categories.code)

amount                   numeric not null default 0
currency                 text not null default 'VND'
event_date               date not null

direction                text not null

from_asset_id            uuid references assets(id)
to_asset_id              uuid references assets(id)

cashflow_event_id        uuid references cashflow_events(id)
debt_id                  uuid references debts(id)
financial_goal_id        uuid references financial_goals(id)
snapshot_id              uuid references snapshots(id)

privacy_owner_member_id  uuid references household_members(id)
visibility_level         text not null default 'detail'
status                   text not null default 'recorded'

created_by               uuid references profiles(id)
created_at               timestamptz not null default now()
updated_by               uuid references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

## Enum

```txt
event_type:
- expense
- income
- transfer
- asset_purchase
- asset_sale
- asset_update
- payment_paid
- goal_contribution
- debt_update
- adjustment
- other

direction:
- inflow
- outflow
- neutral

status:
- recorded
- pending_confirmation
- cancelled

visibility_level:
- summary_only
- grouped
- detail
- private
```

## Category

`category` là string code tham chiếu mềm tới `money_event_categories.code`.

System codes mặc định:

```txt
housing
education
transport
health
family_support
insurance
saving
investment
debt
interest
income
repair
household
children
travel
other
```

## Constraints

```txt
amount >= 0
title <> ''
currency <> ''
```

## Example: completed outgoing cash-flow

```txt
event_type = payment_paid
direction = outflow
amount = 12.000.000
from_asset_id = Tài khoản VCB
cashflow_event_id = Học phí tháng 8
```

## Example: completed incoming cash-flow

```txt
event_type = income
direction = inflow
amount = 35.000.000
to_asset_id = Tài khoản VCB
cashflow_event_id = Lương tháng 8
```

## Goal contribution rule

Nếu user ghi một `money_event` có `event_type = goal_contribution`, transaction/service layer nên update `financial_goals.current_amount` cùng transaction để không lệch state.

---

# 19A. Debt / Liability Extension

## Table: debts

```txt
id                       uuid primary key
household_id             uuid not null references households(id)

name                     text not null
debt_type                text not null
lender_type              text not null
lender_name              text

original_amount          numeric not null default 0
outstanding_amount       numeric not null default 0
currency                 text not null default 'VND'

borrowed_at              date
expected_final_due_date  date

status                   text not null default 'active'

payment_frequency        text
fixed_payment_amount     numeric
minimum_payment_amount   numeric
interest_type            text not null default 'none'
interest_calculation     text

owner_member_id          uuid references household_members(id)
received_to_asset_id     uuid references assets(id)

note                     text

created_by               uuid references profiles(id)
created_at               timestamptz not null default now()
updated_by               uuid references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

Payment kỳ tương lai của debt được biểu diễn bằng `cashflow_events.debt_id`.

Enum:

```txt
debt_type:
- family_loan
- friend_loan
- bank_loan
- consumer_finance
- mortgage
- credit_card
- installment
- other

lender_type:
- family
- friend
- bank
- credit_institution
- company
- other

status:
- active
- paid_off
- paused
- overdue
- cancelled
```

## Table: debt_interest_periods

```txt
id                   uuid primary key
household_id         uuid not null references households(id)
debt_id              uuid not null references debts(id)

start_date           date not null
end_date             date
term_months          integer
interest_rate        numeric not null
rate_type            text not null default 'fixed'
note                 text

created_at           timestamptz not null default now()
updated_at           timestamptz
deleted_at           timestamptz
```

---

# 19B. Table: money_event_categories

## Dùng để làm gì?

Danh mục category cho `money_events`, cho phép category hệ thống và category riêng của household.

## Fields

```txt
id             uuid primary key
household_id   uuid references households(id)     (nullable, null = global/system)
code           text not null
label          text not null
is_system      boolean not null default false
sort_order     integer not null default 0
created_at     timestamptz not null default now()
deleted_at     timestamptz
```

## Constraints

```txt
code <> ''
global scope: unique(code) where household_id is null
household scope: unique(household_id, code)
```

---

# 19C. Table: protected_reserves

## Dùng để làm gì?

Lưu financial constraint mà household muốn bảo vệ khi tính Flexible Money.

Reserve không nhất thiết là một account riêng.

Ví dụ:

```txt
Emergency fund
100.000.000 VND
```

## Fields

```txt
id             uuid primary key
household_id   uuid not null references households(id)

name           text not null
amount         numeric not null default 0
status         text not null default 'active'
note           text

created_by     uuid references profiles(id)
created_at     timestamptz not null default now()
updated_by     uuid references profiles(id)
updated_at     timestamptz
deleted_at     timestamptz
```

## Enum

```txt
status:
- active
- archived
```

## Constraints

```txt
amount >= 0
name <> ''
```

MVP UI có thể chỉ cho tạo một reserve chính, nhưng schema cho phép nhiều reserve để tránh migration sau này.

---

# 20. Table: financial_goals

## Dùng để làm gì?

Lưu mục tiêu tài chính và các input cần cho goal projection / What-if impact.

Trả lời:

```txt
Nhà mình đang hướng tới mục tiêu gì?
Hiện đã có bao nhiêu?
Còn thiếu bao nhiêu?
Muốn đạt vào khi nào?
Dự kiến mỗi tháng đóng góp bao nhiêu?
Nếu giữ pace hiện tại thì khi nào đạt?
```

## Fields

```txt
id                            uuid primary key
household_id                  uuid not null references households(id)

name                          text not null
category                      text not null

target_amount                 numeric not null default 0
current_amount                numeric not null default 0
current_amount_updated_at     timestamptz

target_date                   date
planned_monthly_contribution  numeric

priority                      text not null default 'medium'
status                        text not null default 'active'

linked_asset_id               uuid references assets(id)

note                          text

created_by                    uuid references profiles(id)
created_at                    timestamptz not null default now()
updated_by                    uuid references profiles(id)
updated_at                    timestamptz
deleted_at                    timestamptz
```

## Enum

```txt
category:
- emergency_fund
- wedding
- home
- home_repair
- car
- children
- travel
- debt_repayment
- education
- career_break
- investment
- other

priority:
- low
- medium
- high

status:
- active
- paused
- completed
- cancelled
```

## Vì sao `current_amount` là cột thật?

User mới có thể onboarding với một goal đã có sẵn tiền từ trước khi dùng app.

Ví dụ:

```txt
Goal mua nhà
current_amount = 400M
```

Không nên bắt backend tạo fake historical `goal_contribution` events chỉ để reconstruct số hiện tại.

Rule:

```txt
financial_goals.current_amount
= current state / source of truth cho goal progress

money_events.goal_contribution
= optional history / explanation cho contribution xảy ra trong app
```

Nếu create `goal_contribution`, service update `current_amount` cùng transaction.

## Derived values — không cần lưu

```txt
remaining_amount
= target_amount - current_amount

estimated_months_to_goal
≈ remaining_amount / planned_monthly_contribution

projected_completion_date
= derive từ estimated_months_to_goal
```

Nếu `planned_monthly_contribution` null hoặc <= 0 thì không show projected completion date.

## Constraints

```txt
target_amount >= 0
current_amount >= 0
planned_monthly_contribution >= 0
name <> ''
```

## Note

`linked_asset_id` có thể dùng để nói goal hiện được giữ ở đâu, nhưng MVP không nên tự động derive `current_amount` từ asset nếu chưa có explicit tracking rule.

---

# 21. Table: attention_items

## Dùng để làm gì?

Lưu các khoản hoặc tình huống cần chú ý.

MVP không cần chat/discussion phức tạp. `attention_items` là đủ để thay module “trao đổi nhẹ”.

Nó trả lời:

```txt
Có khoản nào nên cùng xem lại không?
Có khoản nào hơi cao hơn dự kiến không?
Có gì cần để ý trong tháng này không?
```

## Fields

```txt
id                    uuid primary key
household_id          uuid not null references households(id)

title                 text not null
reason                text
amount                numeric

related_object_type   text
related_object_id     uuid

level                 text not null default 'normal'
status                text not null default 'open'

privacy_owner_member_id uuid references household_members(id)
visibility_level      text not null default 'detail'

created_by            uuid references profiles(id)     (nullable, ON DELETE SET NULL)
created_at            timestamptz not null default now()

seen_by               uuid references profiles(id)
seen_at               timestamptz

resolved_by           uuid references profiles(id)
resolved_at           timestamptz
```

## Note về xóa

`attention_items` KHÔNG có `deleted_at`. Trạng thái "đã xóa" được biểu diễn bằng `status = dismissed` thay cho soft-delete.

## Enum

```txt
related_object_type:
- asset
- cashflow_event
- financial_goal
- snapshot
- money_event
```

```txt
level:
- normal
- important
- urgent
```

```txt
status:
- open
- seen
- resolved
- dismissed
```

```txt
visibility_level:
- summary_only
- grouped
- detail
- private
```

## Note

`attention_items` có thể dùng polymorphic relation:

```txt
related_object_type
related_object_id
```

Vì đây là bảng nhẹ phục vụ UI, không phải core financial ledger.

---

# 22. Table: audit_logs

## Dùng để làm gì?

Lưu lịch sử hành động quan trọng.

Vì dữ liệu tài chính gia đình nhạy cảm, nên cần biết ai tạo/sửa/xóa dữ liệu quan trọng.

## Fields

```txt
id             uuid primary key

household_id   uuid references households(id)
actor_id       uuid references profiles(id)     (nullable, null = system/worker; ON DELETE SET NULL)

action         text not null
entity_type    text not null
entity_id      uuid

metadata       jsonb

created_at     timestamptz not null default now()
```

## Actions nên log ở MVP

```txt
household.created

member.invited
member.joined
member.permission_updated

snapshot.created

asset.created
asset.updated
asset.deleted
asset.valuation_created
asset.valuation_updated

cashflow_event.created
cashflow_event.updated
cashflow_event.completed

reserve.created
reserve.updated
reserve.deleted

money_event.created
money_event.updated
money_event.deleted

attention_item.created
attention_item.resolved

goal.created
goal.updated
goal.deleted
```

## Không nên lưu trong metadata

```txt
note đầy đủ
toàn bộ dữ liệu tài chính trước/sau
thông tin quá nhạy cảm
```

Nên chỉ lưu metadata nhẹ:

```txt
changed_fields
old_status
new_status
```

---

# 23. Asset valuation source matrix

```txt
cash
→ manual

bank_account
→ manual ở MVP, bank sync later

saving_deposit
→ formula_calculated

bond
→ formula_calculated ở MVP
→ market_priced later nếu có giá thị trường

certificate_of_deposit
→ formula_calculated

gold
→ market_priced

stock
→ market_priced

fund
→ market_priced hoặc statement/manual

crypto
→ market_priced

foreign_currency
→ market_priced qua FX rate

real_estate
→ manual / appraised

insurance
→ statement / manual

loan_receivable
→ formula_calculated hoặc manual

investment
→ manual hoặc market_priced tùy loại

other
→ manual
```

---

# 24. Cách tính market-priced asset

## Formula

```txt
asset_value_in_quote_currency = quantity \* latest_price

asset_value_in_household_currency
= asset_value_in_quote_currency \* fx_rate
```

## Example: crypto

```txt
BTC quantity = 0.05
BTC price = 60,000 USD
USD/VND = 25,400

current_value = 0.05 \* 60,000 \* 25,400
```

## Sync flow

```txt
1\. Fetch latest price từ provider
2\. Insert market_prices
3\. Fetch fx_rates nếu quote_currency khác household currency
4\. Tính current_value
5\. Update assets.current_value
6\. Update assets.value_updated_at
7\. Insert asset_valuations:
   - valuation_method = market_price_api
   - market_price_id = latest market price
   - fx_rate_id = fx rate nếu có
```

---

# 25. Cách tính formula-based asset

## Saving deposit simple formula

Input:

```txt
principal_amount
interest_rate
start_date
maturity_date
payout_frequency
compounding_frequency
```

Output:

```txt
estimated_current_value
expected_interest
maturity_value
days_elapsed
days_to_maturity
```

## Flow

```txt
1\. User tạo asset loại saving_deposit
2\. User nhập asset_calculation_terms
3\. App tính current value
4\. Update assets.current_value
5\. Insert asset_valuations:
   - valuation_method = formula_calculated
   - calculation_term_id = asset_calculation_terms.id
```

## Bond MVP logic

MVP có thể tính đơn giản:

```txt
current_value = principal + accrued_interest
```

Later mới cần market price/yield phức tạp.

---

# 26. Snapshot creation flow

Khi user tạo snapshot:

```txt
1. App lấy tất cả assets active được phép tham gia shared household calculation
2. Với mỗi asset:
   - manual: lấy current_value hoặc latest asset_valuations
   - market_priced: sync giá nếu cần
   - formula_calculated: tính lại nếu cần
3. App đọc:
   - debts
   - active protected_reserves
   - cashflow_events trong forecast horizon
   - financial_goals cần projection
4. ForecastCalculationService generate timeline theo ngày
5. FlexibleMoneyCalculationService tính:
   - upcoming_income_amount
   - upcoming_outgoing_amount
   - lowest_projected_balance
   - protected_reserve_amount
   - flexible_money
6. App tính asset/debt totals
7. Create snapshots
8. Create snapshot_asset_values cho từng asset
9. Create audit_logs snapshot.created
```

## Important rule

```txt
Snapshot đã tạo thì không đổi ngầm.
```

Realtime forecast vẫn tính từ current data, không dùng snapshot cũ làm source of truth.

Nếu user sửa valuation cũ, app không tự động sửa snapshot cũ.

---

# 26A. ForecastCalculationService — không phải table

## Input

```txt
household_id
as_of_date
horizon_days
current liquid assets
cashflow_events
protected reserves
```

## Rule MVP

```txt
1. Xác định starting liquid balance từ assets có liquidity = usable_now
2. Loại các record private khỏi shared household calculation
3. Generate recurring cashflow occurrences trong horizon
4. Sort event theo expected_date
5. Incoming:
   - mặc định chỉ dùng confirmed cho conservative forecast
   - estimated vẫn hiển thị nhưng không nên silently coi như chắc chắn
6. Outgoing required:
   - đưa vào obligation coverage
7. Tính running projected balance theo ngày
8. Lấy lowest_projected_balance
```

Không cần bảng `forecasts` ở MVP.

---

# 26B. FlexibleMoneyCalculationService — không phải table

Concept:

```txt
Flexible money
= phần tiền household có thể cân nhắc sử dụng
  sau khi bảo vệ obligations và reserve đã khai báo
```

Conservative MVP:

```txt
flexible_money_today
=
current_shared_liquid_money
- protected_reserve
- required_outflows_before_next_sufficiently_certain_inflow
```

Dashboard có thể trả thêm flexible money ở end-of-horizon, nhưng phải label rõ assumption.

`flexible_money` có thể âm.

---

# 26C. GoalProjectionService — không phải table

```txt
remaining_amount
= target_amount - current_amount

estimated_months_to_goal
≈ remaining_amount / planned_monthly_contribution
```

MVP không tính investment returns.

---

# 26D. WhatIfCalculationService — không phải table

MVP What-if là preview stateless.

Endpoint gợi ý:

```txt
POST /households/:householdId/what-if
```

Request:

```txt
amount
planned_date
goal_id optional
```

Service tạo một synthetic outgoing event trong memory rồi chạy lại forecast.

Response:

```txt
obligations_covered
reserve_protected
before_flexible_money
after_flexible_money
before_lowest_projected_balance
after_lowest_projected_balance
before_goal_date
after_goal_date
goal_delay_days
assumptions
```

**Không persist vào DB trong MVP.**

Analytics chỉ cần event như:

```txt
what_if_run
- household_id
- has_goal
- amount_bucket
- result_type
```

Không gửi toàn bộ financial payload sang analytics nếu không cần.

Chỉ thêm `what_if_scenarios` table nếu sau này cần save / compare / revisit / freeze/share scenario.

---

# 27. Asset update flows

## 27.1. Manual asset update

```txt
1\. User mở asset
2\. Bấm “Cập nhật giá trị”
3\. Nhập giá trị mới
4\. Nhập valuation_date
5\. Optional note
6\. Create asset_valuations:
   - valuation_method = manual
7\. Update assets.current_value nếu valuation là latest
8\. Write audit_logs asset.valuation_created
```

## 27.2. Market-priced asset update

```txt
1\. User mở dashboard hoặc asset detail
2\. App check market_prices cache
3\. Nếu cache còn mới:
   - dùng cache
4\. Nếu cache cũ:
   - fetch API
   - insert market_prices
5\. Tính current_value
6\. Update assets.current_value
7\. Insert asset_valuations:
   - valuation_method = market_price_api
8\. Write audit_logs asset.valuation_created nếu cần
```

## 27.3. Formula-calculated asset update

```txt
1\. App đọc asset_calculation_terms
2\. Tính giá trị hiện tại theo ngày
3\. Update assets.current_value
4\. Insert asset_valuations:
   - valuation_method = formula_calculated
5\. Write audit_logs asset.valuation_created nếu cần
```

---

# 28. Money event flows

## 28.1. Add large expense

```txt
1\. Create money_events:
   - event_type = expense
   - direction = outflow
   - amount = số tiền
   - from_asset_id = nguồn tiền, nếu có
2\. Nếu user đánh dấu cần chú ý:
   - Create attention_items related to money_event
3\. Write audit_logs money_event.created
```

## 28.2. Add income

```txt
1\. Create money_events:
   - event_type = income
   - direction = inflow
   - amount = số tiền
   - to_asset_id = nơi nhận tiền
2\. Optional update assets.current_value
3\. Optional create asset_valuations nếu asset value thay đổi
4\. Write audit_logs money_event.created
```

## 28.3. Transfer between assets

```txt
1\. Create money_events:
   - event_type = transfer
   - direction = neutral
   - from_asset_id = asset chuyển đi
   - to_asset_id = asset nhận
2\. Update current_value của 2 assets nếu app quản lý trực tiếp
3\. Create asset_valuations cho 2 assets nếu cần
4\. Write audit_logs money_event.created
```

## 28.4. Asset purchase

```txt
1\. Create money_events:
   - event_type = asset_purchase
   - direction = neutral
   - from_asset_id = nguồn tiền
   - to_asset_id = asset được mua
2\. Update asset position nếu là market asset
3\. Update asset valuation
4\. Write audit_logs money_event.created
```

## 28.5. Asset sale

```txt
1\. Create money_events:
   - event_type = asset_sale
   - direction = neutral
   - from_asset_id = asset bán
   - to_asset_id = nơi nhận tiền
2\. Update asset position nếu là market asset
3\. Update asset valuation
4\. Write audit_logs money_event.created
```

---

# 29. Attention item creation rules

App có thể tạo `attention_items` khi:

```txt
User tự đánh dấu “cần chú ý”

Khoản tiền vượt ngưỡng user đặt

Cash-flow outgoing required sắp đến hạn trong 7 ngày

Có cash-flow outgoing bị overdue

Dữ liệu chưa cập nhật quá lâu

Lowest projected balance thấp hoặc reserve có nguy cơ bị chạm

User tạo attention_item liên quan tới một money_event

Asset giảm/tăng mạnh so với snapshot trước
```

Tone UI nên nhẹ nhàng:

```txt
Khoản cần chú ý
Khoản nên xem lại
Cần cập nhật thêm
Cần trao đổi
```

Không dùng tone:

```txt
Cảnh báo nghiêm trọng
Đáng ngờ
Ai tiêu khoản này?
Vượt chi
```

---

# 30. Visibility & privacy

## Hai khái niệm phải tách riêng

```txt
financial_nature
= record có vai trò gì trong household planning

visibility_level
= người khác được xem tới mức nào
```

`financial_nature` hiện áp dụng chủ yếu cho `assets`.

`visibility_level` dùng cho:

```txt
assets
cashflow_events
money_events
attention_items
snapshot_asset_values
```

## Levels

```txt
summary_only
= có tính vào tổng, nhưng không hiện chi tiết

grouped
= hiện theo nhóm, không hiện từng dòng chi tiết

detail
= hiện đầy đủ theo quyền xem

private
= không hiển thị cho member khác, không tính vào shared calculation
```

## Privacy ownership

Không mặc định:

```txt
private owner = created_by
```

vì người nhập record có thể không phải người sở hữu khoản private.

New private records nên có:

```txt
privacy_owner_member_id
```

Rule:

```txt
visibility_level = private
→ privacy_owner_member_id hoặc admin được xem
→ không tính vào shared totals / forecast / flexible money
```

Legacy record chưa có privacy owner có thể fallback về `created_by` cho migration compatibility.

## Recommended MVP UI mapping

Backend có thể giữ 4 levels, UI chỉ cần expose 3 lựa chọn:

```txt
Shared details
→ detail

Count in total only
→ summary_only (hoặc grouped nếu UI cần)

Private
→ private
```

---

# 31. Enforcement quyền (app-layer)

Enforcement quyền được làm ở **\*\*app-layer\*\*** (NestJS guards), **\*\*KHÔNG dùng Postgres RLS\*\***. Lý do: giữ DB portable, không khóa vào Supabase/Postgres RLS.

## Guard stack

```txt
SupabaseAuthGuard   (global)
= xác thực token, resolve user hiện tại

HouseholdAccessGuard (global)
= đảm bảo user là member (deleted_at is null) của household đang truy cập

@RequireCapability(...) (trên từng route ghi)
= kiểm tra capability cần thiết cho hành động ghi
```

## Hai trục enforcement

Quyền được chia thành 2 trục độc lập:

### 1. Capability (role → permission)

```txt
role → permission mặc định
permission_level (nullable) = override

null  → derive từ role
<val> → dùng thẳng giá trị override
```

Capability levels:

```txt
view_summary
- đọc snapshots tổng quan
- đọc attention_items summary
- không đọc asset/money_event detail

view_grouped
- đọc dữ liệu grouped
- không đọc note nhạy cảm

view_detail
- đọc detail theo visibility_level

edit_content
- thêm/sửa finance records
- không quản lý member

admin
- quản lý member, invite, permission, household settings
```

### 2. Visibility (VisibilityLevel tier + private)

```txt
visibility_level tier: summary_only < grouped < detail
= record chỉ hiện nếu capability của user đạt tier tương ứng

private
= privacy_owner_member_id hoặc admin được xem; legacy fallback created_by; không tính vào tổng chia sẻ
```

## Base rule

User chỉ được access dữ liệu nếu họ là member (còn active) của household đó — kiểm tra ở `HouseholdAccessGuard`, không phải ở policy DB.

---

# 32. Indexes

Recommended indexes cho schema v3.1. Các index của bảng cũ có thể đã tồn tại; các index cho `cashflow_events`, `protected_reserves`, `financial_goals.target_date` và `assets.financial_nature` cần được thêm trong migration tương ứng.

Danh sách chính:

```txt
household_members(user_id)
household_members(household_id, user_id)

household_invites(token)
household_invites(household_id, status)

snapshots(household_id, snapshot_date desc)
snapshots(household_id, created_at desc)

assets(household_id, deleted_at)
assets(household_id, type)
assets(household_id, liquidity)
assets(household_id, valuation_mode)
assets(household_id, financial_nature)

asset_market_positions(household_id, asset_id)
asset_market_positions(asset_class, symbol, market)

market_prices(asset_class, symbol, market, quote_currency, price_time desc)

fx_rates(base_currency, quote_currency, rate_time desc)

asset_calculation_terms(household_id, asset_id)
asset_calculation_terms(calculation_type, status)

asset_valuations(household_id, asset_id, valuation_date desc)
asset_valuations(asset_id, valuation_date desc)

snapshot_asset_values(snapshot_id)
snapshot_asset_values(household_id, snapshot_id)
snapshot_asset_values(asset_id)

cashflow_events(household_id, expected_date)
cashflow_events(household_id, status)
cashflow_events(household_id, direction, expected_date)
cashflow_events(household_id, certainty)
cashflow_events(household_id, owner_member_id)

protected_reserves(household_id, status)

money_events(household_id, event_date desc)
money_events(household_id, event_type)
money_events(household_id, category)
money_events(from_asset_id)
money_events(to_asset_id)

money_event_categories(household_id, code)

financial_goals(household_id, status)
financial_goals(household_id, target_date)

attention_items(household_id, status)
attention_items(household_id, level)

debts(household_id, deleted_at)
debt_interest_periods(household_id, debt_id)

audit_logs(household_id, created_at desc)
```

---

# 33. UI mapping

Không expose tên database ra UI.

```txt
snapshots
→ Cập nhật tình hình / Lịch sử cập nhật

assets
→ Tài sản & nguồn tiền

asset_valuations
→ Lịch sử giá trị

snapshot_asset_values
→ Chi tiết snapshot

asset_market_positions
→ Số lượng đang giữ

asset_calculation_terms
→ Thông tin tính toán

cashflow_events
→ Sắp tới / Timeline tiền vào-ra

money_events
→ Hoạt động gần đây / Sự kiện tài chính

attention_items
→ Khoản cần chú ý

protected_reserves
→ Quỹ cần bảo vệ

financial_goals
→ Mục tiêu chung

household_members
→ Thành viên & quyền xem

household_invites
→ Lời mời

WhatIfCalculationService
→ Thử một khoản chi / Kiểm tra ảnh hưởng
```

---

# 34. MVP UI recommendation

Backend có thể hỗ trợ đầy đủ 3 valuation modes ngay từ đầu:

```txt
manual
market_priced
formula_calculated
```

Nhưng UI MVP nên đơn giản:

## Add asset flow

```txt
1\. User chọn loại tài sản
2\. App tự chọn valuation_mode
3\. User chỉ nhập các field cần thiết
```

## Examples

### Chọn Vàng

```txt
valuation_mode = market_priced

User nhập:
- loại vàng
- số lượng
- đơn vị

App tự:
- lấy giá
- tính current_value
- tạo asset_valuations
```

### Chọn Crypto

```txt
valuation_mode = market_priced

User nhập:
- symbol
- quantity

App tự:
- lấy giá
- quy đổi currency
- tính current_value
```

### Chọn Gửi tiết kiệm

```txt
valuation_mode = formula_calculated

User nhập:
- số tiền gốc
- lãi suất
- ngày gửi
- ngày đáo hạn
- cách trả lãi

App tự:
- tính giá trị hiện tại
- tính lãi dự kiến
```

### Chọn Bất động sản

```txt
valuation_mode = manual

User nhập:
- giá trị ước tính
- ngày cập nhật
- ghi chú
```

---

# 35. Những thứ không nên thêm ngay

Không nên thêm trong MVP:

```txt
transactions table
budgets
bank credentials
bank imports
complex portfolio analytics
stock P/L nâng cao
crypto wallet sync
discussion threads
comments
monthly reports
exports
complex recurring rules
what_if_scenarios table
forecasts table
```

Có thể dùng enum/text trước. Khi có usage thật rồi mới normalize thêm.

---

# 36. Final recommended schema

Bản nên build cho Money Space v3.1:

```txt
profiles
households
household_members
household_invites

snapshots
snapshot_asset_values

assets
asset_valuations

cashflow_events
protected_reserves
financial_goals

money_events
attention_items

audit_logs
```

Existing tables có thể giữ nếu đã build, nhưng không nên là focus tiếp theo của MVP:

```txt
debts
debt_interest_periods
money_event_categories

asset_market_positions
asset_calculation_terms
market_prices
fx_rates
currencies
```

Application layer bắt buộc cho v3.1:

```txt
ForecastCalculationService
FlexibleMoneyCalculationService
GoalProjectionService
WhatIfCalculationService
```

Không cần trong MVP:

```txt
what_if_scenarios
forecasts
scenario_history
advanced_recurring_rules
```

`what_if_scenarios` chỉ được thêm khi product validate nhu cầu persist scenario.

---

# 37. Final mental model

```txt
households
= nhà mình và cách household đang quản lý tài chính

assets
= tiền/tài sản hiện đang nằm ở đâu, ai giữ, có được tính vào shared picture không

asset_valuations
= giá trị tài sản tại từng thời điểm

snapshots
= bức tranh clarity + foresight được freeze tại một thời điểm

snapshot_asset_values
= từng asset được freeze thế nào trong snapshot

cashflow_events
= trong tương lai tiền nào dự kiến vào / ra

protected_reserves
= phần tiền nhà mình muốn bảo vệ

financial_goals
= nhà mình đang hướng tới điều gì, hiện có bao nhiêu và pace đóng góp thế nào

money_events
= những sự kiện tài chính đáng ghi nhận đã thực sự xảy ra

attention_items
= khoản/tình huống nên cùng xem lại

debts
= nghĩa vụ nợ dài hạn; các kỳ trả tương lai đi qua cashflow_events

audit_logs
= ai đã làm gì với dữ liệu quan trọng
```

Calculation mental model:

```txt
CURRENT STATE
assets + debts + protected_reserves + financial_goals

        ↓

FUTURE EVENTS
cashflow_events

        ↓

FORECAST
running projected balance
lowest projected balance
flexible money

        ↓

WHAT-IF
synthetic planned spend
→ recalculate in memory
→ return consequence
→ no DB persistence by default
```

Schema giữ đúng định vị v3.1:

```txt
Không phải app ghi thu chi từng khoản nhỏ.
Không phải app kế toán gia đình.
Không phải app kiểm soát người kia.

Clarity:
Biết nhà mình đang có gì và tiền nằm ở đâu.

Foresight:
Biết tiền nào sắp vào/ra và household có thời điểm nào bị tight không.

Decision:
Preview một quyết định hôm nay sẽ ảnh hưởng Flexible Money, reserve và goal ra sao.
```

---

# 38. Migration checklist từ schema hiện tại sang v3.1

## P0 — cần để chạy core product

```txt
1. Rename/refactor upcoming_payments → cashflow_events
2. Add incoming + certainty + requirement + recurrence projection fields
3. Rename money_events.upcoming_payment_id → cashflow_event_id
4. Add protected_reserves
5. Update financial_goals:
   - add current_amount
   - add current_amount_updated_at
   - deadline → target_date
   - add planned_monthly_contribution
6. Implement ForecastCalculationService
7. Implement FlexibleMoneyCalculationService
8. Implement GoalProjectionService
9. Implement stateless WhatIfCalculationService
```

## P1 — nên làm để semantics/privacy đúng với v3.1

```txt
10. Add households.financial_management_mode
11. Add assets.financial_nature
12. Add privacy_owner_member_id cho records hỗ trợ private
13. Freeze financial_nature / holder / privacy metadata trong snapshot_asset_values
14. Add foresight fields vào snapshots
15. Update indexes / audit actions / attention rules
```

## Không làm lúc này

```txt
what_if_scenarios table
forecasts table
complex scenario history
complex recurring rule engine
additional portfolio analytics
```

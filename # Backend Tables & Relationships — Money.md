# Backend Tables & Relationships — Money Space MVP Revised

## 1. Tổng quan

Money Space là app dashboard tài chính gia đình/couple.

Sản phẩm không đi theo hướng app ghi thu chi từng giao dịch nhỏ. Trung tâm của sản phẩm là:

```txt
households
snapshots
assets
debts
upcoming_payments
money_events
attention_items
```

Trong đó:

```txt
households
= không gian tài chính của một gia đình/couple

snapshots
= bức tranh tài chính tại một thời điểm

assets
= tiền/tài sản đang nằm ở đâu

debts
= khoản vay / khoản nợ household còn phải trả

upcoming_payments
= khoản sắp phải trả

money_events
= sự kiện tài chính đáng ghi nhận

attention_items
= khoản/tình huống cần chú ý
```

Sau review, schema cần hỗ trợ thêm long-term asset valuation:

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
debt_terms
debt_interest_periods
```

`upcoming_payments` và `money_events` cũng nên có `debt_id` để nối kỳ trả nợ và các sự kiện liên quan về đúng khoản vay gốc.

---

# 3. Schema groups

## User & Household

```txt
profiles
households
household_members
household_invites
```

## Finance Core

```txt
snapshots
assets
asset_valuations
snapshot_asset_values
debts
debt_terms
debt_interest_periods
upcoming_payments
money_events
financial_goals
attention_items
```

## Asset Pricing / Calculation

```txt
asset_market_positions
market_prices
fx_rates
asset_calculation_terms
```

## System / Safety

```txt
audit_logs
```

---

# 4. MVP table priority

## Must-have

```txt
profiles
households
household_members
household_invites

snapshots
assets
asset_valuations
snapshot_asset_values

upcoming_payments
money_events
attention_items

audit_logs
```

## Must-have nếu MVP có mục tiêu tài chính

```txt
financial_goals
```

## Must-have nếu muốn build asset long-term đúng ngay từ đầu

```txt
asset_market_positions
market_prices
fx_rates
asset_calculation_terms
```

## Later

```txt
notification_preferences
recurring_payment_rules
monthly_reports
exports
bank_imports
bank_connections
discussion_threads
comments
```

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
   ├── upcoming_payments
   ├── money_events
   ├── financial_goals
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
   ├── money_events.from_asset_id
   └── money_events.to_asset_id
```

Chi tiết snapshot:

```txt
snapshots
   └── snapshot_asset_values
```

Chi tiết payment / goal:

```txt
upcoming_payments
   └── money_events.upcoming_payment_id

financial_goals
   └── money_events.financial_goal_id
```

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
id                 uuid primary key

name               text not null
currency           text not null default 'VND'
update_frequency   text not null default 'weekly'

created_by         uuid references profiles(id)

created_at         timestamptz not null default now()
updated_at         timestamptz
deleted_at         timestamptz
```

## Enum

```txt
update_frequency:
- weekly
- monthly
- manual
```

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
households 1 - n upcoming_payments
households 1 - n money_events
households 1 - n financial_goals
households 1 - n attention_items
households 1 - n audit_logs
```

---

# 8. Table: household_members

## Dùng để làm gì?

Lưu user nào thuộc household nào và có quyền gì.

Đây là bảng quan trọng cho permission và RLS.

## Fields

```txt
id                  uuid primary key

household_id        uuid not null references households(id)
user_id             uuid not null references profiles(id)

role                text not null
permission_level    text not null

joined_at           timestamptz
invited_by          uuid references profiles(id)

created_at          timestamptz not null default now()
updated_at          timestamptz
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
```

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
= thêm/sửa tài sản, khoản sắp tới, mục tiêu, snapshot

admin
= quản lý thành viên, quyền truy cập, household settings
```

## Important note

Các bảng như `assets`, `upcoming_payments` reference đến `household_members`.

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
default_permission_level   text not null default 'view_detail'

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
1. User tạo household
2. User tạo invite
3. App tạo household_invites status = pending
4. Partner bấm link
5. Partner đăng ký/đăng nhập
6. App tạo household_members
7. Invite chuyển thành accepted
```

---

# 10. Table: snapshots

## Dùng để làm gì?

`snapshots` lưu bức tranh tài chính tại một thời điểm.

Snapshot không phải ledger.

Snapshot trả lời:

```txt
Nhà mình đang thế nào?
Tiền có thể dùng ngay là bao nhiêu?
Tổng tiết kiệm là bao nhiêu?
Tổng tài sản dài hạn là bao nhiêu?
Tổng nợ là bao nhiêu?
```

## Fields

```txt
id                         uuid primary key
household_id               uuid not null references households(id)

snapshot_date              date not null

total_liquid               numeric not null default 0
total_savings              numeric not null default 0
total_long_term_assets     numeric not null default 0
total_debt                 numeric not null default 0

upcoming_due_amount        numeric not null default 0
attention_count            integer not null default 0

status                     text not null default 'insufficient_data'
source_mode                text not null default 'manual'

note                       text

created_by                 uuid references profiles(id)
created_at                 timestamptz not null default now()
deleted_at                 timestamptz
```

## Enum

```txt
status:
- good
- attention
- tight
- insufficient_data

source_mode:
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
upcoming_due_amount >= 0
attention_count >= 0
```

## Source of truth

```txt
assets
= trạng thái hiện tại của từng nguồn tiền/tài sản

asset_valuations
= lịch sử giá trị của từng asset

snapshots
= số tổng được chốt tại một thời điểm

snapshot_asset_values
= giá trị từng asset được freeze trong snapshot

money_events
= bối cảnh giải thích biến động
```

Snapshot không bắt buộc luôn khớp tuyệt đối với tổng assets tại hiện tại, vì snapshot là bản ghi lịch sử.

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
```

## Fields

```txt
id                  uuid primary key
household_id        uuid not null references households(id)

name                text not null
type                text not null

valuation_mode      text not null default 'manual'

current_value       numeric not null default 0
currency            text not null default 'VND'
value_updated_at    timestamptz

holder_member_id    uuid references household_members(id)

liquidity           text not null
purpose             text
visibility_level    text not null default 'detail'
note                text

created_by          uuid references profiles(id)
created_at          timestamptz not null default now()
updated_by          uuid references profiles(id)
updated_at          timestamptz
deleted_at          timestamptz
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
```

```txt
valuation_mode:
- manual
- market_priced
- formula_calculated
```

```txt
liquidity:
- usable_now
- not_immediately_usable
- long_term
```

```txt
visibility_level:
- summary_only
- grouped
- detail
- private
```

## Constraints

```txt
current_value >= 0
name <> ''
currency <> ''
```

## Notes

`assets.current_value` là cached current value để dashboard query nhanh.

Lịch sử giá trị nằm ở:

```txt
asset_valuations
```

Với asset có giá thị trường như vàng, crypto, cổ phiếu, app tự cập nhật current_value từ API.

Với asset tính được như gửi tiết kiệm, trái phiếu, app tự tính current_value từ input ban đầu.

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
asset_value = quantity * latest_price
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
1. Create asset_valuations
2. Update assets.current_value nếu valuation đó là latest
3. Update assets.value_updated_at
4. Write audit_logs asset.valuation_created
```

---

# 17. Table: snapshot_asset_values

## Dùng để làm gì?

Freeze giá trị từng asset trong từng snapshot.

Nếu không có bảng này, snapshot cũ có thể bị thay đổi ngầm khi giá asset hôm nay thay đổi.

## Fields

```txt
id                     uuid primary key

household_id           uuid not null references households(id)
snapshot_id            uuid not null references snapshots(id)
asset_id               uuid not null references assets(id)

asset_name             text not null
asset_type             text not null
liquidity              text not null

value                  numeric not null
currency               text not null default 'VND'

valuation_id           uuid references asset_valuations(id)
valuation_method       text
valuation_date         date

visibility_level       text not null

created_at             timestamptz not null default now()
```

## Constraints

```txt
value >= 0
unique(snapshot_id, asset_id)
```

## Vì sao lưu asset_name, asset_type, liquidity?

Để snapshot lịch sử không bị sai nếu sau này user đổi tên asset.

Ví dụ:

```txt
Tài khoản VCB
```

sau này đổi thành:

```txt
Tài khoản ngân hàng chính
```

Snapshot cũ vẫn nên giữ tên tại thời điểm đó.

---

# 18. Table: upcoming_payments

## Dùng để làm gì?

Lưu các khoản sắp phải trả.

Trả lời:

```txt
Sắp tới phải trả gì?
Khi nào đến hạn?
Khoản đó bao nhiêu?
Ai phụ trách?
Đã trả chưa?
```

## Fields

```txt
id                    uuid primary key
household_id          uuid not null references households(id)

name                  text not null
amount                numeric not null default 0
due_date              date not null

frequency             text not null default 'once'
auto_create_next      boolean not null default false

owner_member_id       uuid references household_members(id)
debt_id               uuid references debts(id)

status                text not null default 'unpaid'
attention_level       text not null default 'normal'
is_attention_needed   boolean not null default false

note                  text

paid_at               timestamptz
paid_by               uuid references profiles(id)
paid_amount           numeric
paid_from_asset_id    uuid references assets(id)

created_by            uuid references profiles(id)
created_at            timestamptz not null default now()
updated_by            uuid references profiles(id)
updated_at            timestamptz
deleted_at            timestamptz
```

## Enum

```txt
frequency:
- once
- weekly
- monthly
- quarterly
- yearly
```

```txt
status:
- unpaid
- paid
- pending_confirmation
- postponed
- overdue
```

```txt
attention_level:
- normal
- important
- urgent
```

## Constraints

```txt
amount >= 0
paid_amount >= 0
name <> ''
```

## Mark paid logic

```txt
1. upcoming_payments.status = paid
2. paid_at = now()
3. paid_by = current user
4. paid_amount = actual amount
5. paid_from_asset_id = source asset nếu user chọn
6. Create money_events:
   - event_type = payment_paid
   - direction = outflow
   - amount = paid_amount hoặc amount
   - upcoming_payment_id = upcoming_payments.id
   - from_asset_id = paid_from_asset_id
```

## Recurring logic MVP

Nếu:

```txt
frequency != once
auto_create_next = true
```

sau khi mark paid, app tạo record kỳ tiếp theo.

Ví dụ:

```txt
Tiền nhà tháng 7 paid
→ tạo Tiền nhà tháng 8 với due_date + 1 month
```

Nếu chưa muốn tự động, app hỏi:

```txt
Tạo khoản tương tự cho kỳ tiếp theo không?
```

---

# 19. Table: money_events

## Dùng để làm gì?

Lưu các sự kiện tài chính đáng ghi nhận.

Đây không phải bảng transaction chi tiết.

Nó trả lời:

```txt
Gần đây có khoản lớn nào xảy ra không?
Vì sao tiền dùng ngay tăng/giảm?
Khoản này liên quan đến asset, payment, goal hay snapshot nào?
```

## Fields

```txt
id                       uuid primary key
household_id             uuid not null references households(id)

title                    text not null
description              text

event_type               text not null
category                 text

amount                   numeric not null default 0
currency                 text not null default 'VND'
event_date               date not null

direction                text not null

from_asset_id            uuid references assets(id)
to_asset_id              uuid references assets(id)

upcoming_payment_id      uuid references upcoming_payments(id)
debt_id                  uuid references debts(id)
financial_goal_id        uuid references financial_goals(id)
snapshot_id              uuid references snapshots(id)

is_large_event           boolean not null default false
is_attention_needed      boolean not null default false

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
```

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

owner_member_id          uuid references household_members(id)
received_to_asset_id     uuid references assets(id)

note                     text

created_by               uuid references profiles(id)
created_at               timestamptz not null default now()
updated_by               uuid references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

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

## Table: debt_terms

```txt
id                         uuid primary key
household_id               uuid not null references households(id)
debt_id                    uuid not null references debts(id)

repayment_type             text not null
principal_payment_type     text
payment_frequency          text

fixed_payment_amount       numeric
minimum_payment_amount     numeric

start_date                 date
end_date                   date

has_interest               boolean not null default false
interest_type              text not null default 'none'
interest_calculation       text

grace_period_months        integer

created_at                 timestamptz not null default now()
updated_at                 timestamptz
deleted_at                 timestamptz
```

## Table: debt_interest_periods

```txt
id                   uuid primary key
household_id         uuid not null references households(id)
debt_id              uuid not null references debts(id)

start_date           date not null
end_date             date

interest_rate        numeric not null
rate_type            text not null default 'fixed'

note                 text

created_at           timestamptz not null default now()
updated_at           timestamptz
deleted_at           timestamptz
```

```txt
direction:
- inflow
- outflow
- neutral
```

```txt
status:
- recorded
- pending_confirmation
- cancelled
```

```txt
visibility_level:
- summary_only
- grouped
- detail
- private
```

## Category

```txt
category:
- housing
- education
- transport
- health
- family_support
- insurance
- saving
- investment
- debt
- income
- repair
- household
- children
- travel
- other
```

## Constraints

```txt
amount >= 0
title <> ''
currency <> ''
```

## Examples

### Expense

```txt
event_type = expense
direction = outflow
amount = 5.000.000
from_asset_id = Tài khoản VCB
to_asset_id = null
```

### Income

```txt
event_type = income
direction = inflow
amount = 35.000.000
from_asset_id = null
to_asset_id = Tài khoản VCB
```

### Transfer

```txt
event_type = transfer
direction = neutral
amount = 20.000.000
from_asset_id = Tài khoản VCB
to_asset_id = Sổ tiết kiệm
```

### Asset purchase

```txt
event_type = asset_purchase
direction = neutral
amount = 20.000.000
from_asset_id = Tài khoản VCB
to_asset_id = Vàng
```

### Payment paid

```txt
event_type = payment_paid
direction = outflow
amount = 12.000.000
from_asset_id = Tài khoản VCB
upcoming_payment_id = Học phí
```

### Goal contribution

```txt
event_type = goal_contribution
direction = neutral
amount = 10.000.000
from_asset_id = Tài khoản VCB
to_asset_id = Quỹ dự phòng
financial_goal_id = Quỹ dự phòng
```

---

# 20. Table: financial_goals

## Dùng để làm gì?

Lưu mục tiêu tài chính chung.

Trả lời:

```txt
Nhà mình đang tiết kiệm vì mục tiêu gì?
Mục tiêu đã đạt bao nhiêu phần trăm?
Còn thiếu bao nhiêu?
Khi nào cần đạt?
```

## Fields

```txt
id                 uuid primary key
household_id       uuid not null references households(id)

name               text not null
category           text not null

target_amount      numeric not null default 0
current_amount     numeric not null default 0

deadline           date
priority           text not null default 'medium'
status             text not null default 'active'

linked_asset_id    uuid references assets(id)

note               text

created_by         uuid references profiles(id)
created_at         timestamptz not null default now()
updated_by         uuid references profiles(id)
updated_at         timestamptz
deleted_at         timestamptz
```

## Enum

```txt
category:
- emergency_fund
- home
- home_repair
- children
- travel
- debt_repayment
- investment
- education
- other
```

```txt
priority:
- low
- medium
- high
```

```txt
status:
- active
- paused
- completed
- cancelled
```

## Constraints

```txt
target_amount >= 0
current_amount >= 0
name <> ''
```

Có thể thêm:

```txt
current_amount <= target_amount
```

Nhưng nếu muốn cho phép vượt mục tiêu thì không nên thêm constraint này.

## Note

`linked_asset_id` hữu ích nếu goal được giữ trong một asset cụ thể.

Ví dụ:

```txt
Quỹ dự phòng
linked_asset_id = Sổ tiết kiệm
```

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

visibility_level      text not null default 'detail'

created_by            uuid references profiles(id)
created_at            timestamptz not null default now()

seen_by               uuid references profiles(id)
seen_at               timestamptz

resolved_by           uuid references profiles(id)
resolved_at           timestamptz

deleted_at            timestamptz
```

## Enum

```txt
related_object_type:
- asset
- upcoming_payment
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
actor_id       uuid references profiles(id)

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

payment.created
payment.updated
payment.marked_paid

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
asset_value_in_quote_currency = quantity * latest_price

asset_value_in_household_currency
= asset_value_in_quote_currency * fx_rate
```

## Example: crypto

```txt
BTC quantity = 0.05
BTC price = 60,000 USD
USD/VND = 25,400

current_value = 0.05 * 60,000 * 25,400
```

## Sync flow

```txt
1. Fetch latest price từ provider
2. Insert market_prices
3. Fetch fx_rates nếu quote_currency khác household currency
4. Tính current_value
5. Update assets.current_value
6. Update assets.value_updated_at
7. Insert asset_valuations:
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
1. User tạo asset loại saving_deposit
2. User nhập asset_calculation_terms
3. App tính current value
4. Update assets.current_value
5. Insert asset_valuations:
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
1. App lấy tất cả assets active của household
2. Với mỗi asset:
   - nếu manual: lấy assets.current_value hoặc latest asset_valuations
   - nếu market_priced: sync giá nếu cache quá cũ, rồi lấy latest valuation
   - nếu formula_calculated: tính lại value, tạo valuation mới nếu cần
3. App tính tổng:
   - total_liquid
   - total_savings
   - total_long_term_assets
   - total_debt
   - upcoming_due_amount
   - attention_count
4. Create snapshots
5. Create snapshot_asset_values cho từng asset
6. Create audit_logs snapshot.created
```

## Important rule

```txt
Snapshot đã tạo thì không đổi ngầm.
```

Nếu user sửa valuation cũ, app không tự động sửa snapshot cũ.

Có thể gợi ý:

```txt
Giá trị này liên quan đến snapshot trước đó. Bạn có muốn tạo snapshot mới không?
```

---

# 27. Asset update flows

## 27.1. Manual asset update

```txt
1. User mở asset
2. Bấm “Cập nhật giá trị”
3. Nhập giá trị mới
4. Nhập valuation_date
5. Optional note
6. Create asset_valuations:
   - valuation_method = manual
7. Update assets.current_value nếu valuation là latest
8. Write audit_logs asset.valuation_created
```

## 27.2. Market-priced asset update

```txt
1. User mở dashboard hoặc asset detail
2. App check market_prices cache
3. Nếu cache còn mới:
   - dùng cache
4. Nếu cache cũ:
   - fetch API
   - insert market_prices
5. Tính current_value
6. Update assets.current_value
7. Insert asset_valuations:
   - valuation_method = market_price_api
8. Write audit_logs asset.valuation_created nếu cần
```

## 27.3. Formula-calculated asset update

```txt
1. App đọc asset_calculation_terms
2. Tính giá trị hiện tại theo ngày
3. Update assets.current_value
4. Insert asset_valuations:
   - valuation_method = formula_calculated
5. Write audit_logs asset.valuation_created nếu cần
```

---

# 28. Money event flows

## 28.1. Add large expense

```txt
1. Create money_events:
   - event_type = expense
   - direction = outflow
   - amount = số tiền
   - from_asset_id = nguồn tiền, nếu có
2. Nếu user đánh dấu cần chú ý:
   - Create attention_items related to money_event
3. Write audit_logs money_event.created
```

## 28.2. Add income

```txt
1. Create money_events:
   - event_type = income
   - direction = inflow
   - amount = số tiền
   - to_asset_id = nơi nhận tiền
2. Optional update assets.current_value
3. Optional create asset_valuations nếu asset value thay đổi
4. Write audit_logs money_event.created
```

## 28.3. Transfer between assets

```txt
1. Create money_events:
   - event_type = transfer
   - direction = neutral
   - from_asset_id = asset chuyển đi
   - to_asset_id = asset nhận
2. Update current_value của 2 assets nếu app quản lý trực tiếp
3. Create asset_valuations cho 2 assets nếu cần
4. Write audit_logs money_event.created
```

## 28.4. Asset purchase

```txt
1. Create money_events:
   - event_type = asset_purchase
   - direction = neutral
   - from_asset_id = nguồn tiền
   - to_asset_id = asset được mua
2. Update asset position nếu là market asset
3. Update asset valuation
4. Write audit_logs money_event.created
```

## 28.5. Asset sale

```txt
1. Create money_events:
   - event_type = asset_sale
   - direction = neutral
   - from_asset_id = asset bán
   - to_asset_id = nơi nhận tiền
2. Update asset position nếu là market asset
3. Update asset valuation
4. Write audit_logs money_event.created
```

---

# 29. Attention item creation rules

App có thể tạo `attention_items` khi:

```txt
User tự đánh dấu “cần chú ý”

Khoản tiền vượt ngưỡng user đặt

Khoản sắp đến hạn trong 7 ngày

Có khoản quá hạn

Dữ liệu chưa cập nhật quá lâu

Tiền dùng ngay thấp hơn khoản sắp phải trả

Có money_event được đánh dấu is_attention_needed = true

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

## visibility_level

Dùng cho:

```txt
assets
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
= chỉ người tạo hoặc admin xem
```

## Recommended MVP rule

```txt
private
= không hiển thị cho người không có quyền, không tính vào tổng chia sẻ

summary_only
= có tính vào tổng, nhưng không hiện chi tiết
```

Cách này dễ hiểu cho user hơn.

---

# 31. RLS rule gợi ý

## Base rule

User chỉ được access dữ liệu nếu họ là member của household đó:

```txt
exists household_members
where household_members.household_id = row.household_id
and household_members.user_id = auth.uid()
```

## Permission rules

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

## Private records

```txt
visibility_level = private
→ chỉ created_by hoặc admin được xem
```

---

# 32. Indexes nên có

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

upcoming_payments(household_id, due_date)
upcoming_payments(household_id, status)
upcoming_payments(household_id, is_attention_needed)

money_events(household_id, event_date desc)
money_events(household_id, event_type)
money_events(household_id, is_attention_needed)
money_events(from_asset_id)
money_events(to_asset_id)

financial_goals(household_id, status)

attention_items(household_id, status)
attention_items(household_id, level)

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

upcoming_payments
→ Khoản sắp tới

money_events
→ Hoạt động gần đây / Sự kiện tài chính

attention_items
→ Khoản cần chú ý

financial_goals
→ Mục tiêu chung

household_members
→ Thành viên & quyền xem

household_invites
→ Lời mời
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
1. User chọn loại tài sản
2. App tự chọn valuation_mode
3. User chỉ nhập các field cần thiết
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
```

Có thể dùng enum/text trước. Khi có usage thật rồi mới normalize thêm.

---

# 36. Final recommended schema

Bản nên build nếu muốn MVP chắc và có nền long-term:

```txt
profiles
households
household_members
household_invites

snapshots
snapshot_asset_values

assets
asset_valuations
asset_market_positions
asset_calculation_terms

market_prices
fx_rates

upcoming_payments
money_events
financial_goals
attention_items

audit_logs
```

Nếu muốn MVP cực gọn, có thể tạm hoãn:

```txt
financial_goals
market_prices
fx_rates
```

Nhưng nếu sản phẩm muốn đi long-term cho tài sản như vàng, crypto, cổ phiếu, gửi tiết kiệm, trái phiếu thì nên thiết kế sẵn:

```txt
asset_market_positions
market_prices
fx_rates
asset_calculation_terms
asset_valuations
snapshot_asset_values
```

---

# 37. Final mental model

```txt
households
= nhà mình

assets
= nhà mình có những tài sản gì

asset_market_positions
= với tài sản có giá thị trường, nhà mình đang giữ bao nhiêu

asset_calculation_terms
= với tài sản tính được, điều kiện đầu vào là gì

market_prices / fx_rates
= dữ liệu giá bên ngoài được cache

asset_valuations
= giá trị tài sản tại từng thời điểm

snapshots
= tình hình tài chính tổng tại một thời điểm

snapshot_asset_values
= từng asset được tính thế nào trong snapshot đó

money_events
= gần đây có sự kiện tài chính đáng ghi nhận nào

upcoming_payments
= sắp phải trả gì

attention_items
= khoản nào nên cùng xem lại

financial_goals
= mục tiêu tài chính chung

audit_logs
= ai đã làm gì với dữ liệu quan trọng
```

Schema này giữ đúng định vị:

```txt
Không phải app ghi thu chi từng khoản nhỏ.
Không phải app kế toán gia đình.
Không phải app kiểm soát người kia.

Là dashboard tài chính gia đình có snapshot, tài sản, khoản sắp tới, sự kiện đáng chú ý, quyền riêng tư, và khả năng theo dõi giá trị tài sản dài hạn.
```

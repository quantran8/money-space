# Backend Tables & Relationships — Money Space MVP

## 1. Tổng quan schema

MVP có các nhóm bảng chính:

```txt
User & Household
- profiles
- households
- household_members
- household_invites

Finance Core
- snapshots
- assets
- upcoming_payments
- money_events
- financial_goals
- attention_items

System / Safety
- audit_logs
```

Trung tâm của sản phẩm là:

```txt
households
snapshots
assets
upcoming_payments
money_events
```

Trong đó:

```txt
households        = không gian tài chính của một gia đình/couple
snapshots         = bức tranh tài chính tại một thời điểm
assets            = tiền/tài sản đang nằm ở đâu
upcoming_payments = khoản sắp phải trả
money_events      = sự kiện tài chính đáng ghi nhận
attention_items   = khoản cần chú ý
```

---

# 2. Sơ đồ quan hệ tổng quan

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
   ├── assets
   ├── upcoming_payments
   ├── financial_goals
   ├── snapshots
   ├── money_events
   ├── attention_items
   ├── household_invites
   └── audit_logs
```

Quan hệ chi tiết hơn:

```txt
profiles
  └── household_members.user_id

households
  ├── household_members.household_id
  ├── household_invites.household_id
  ├── assets.household_id
  ├── upcoming_payments.household_id
  ├── financial_goals.household_id
  ├── snapshots.household_id
  ├── money_events.household_id
  ├── attention_items.household_id
  └── audit_logs.household_id

assets
  └── money_events.asset_id

upcoming_payments
  └── money_events.upcoming_payment_id

financial_goals
  └── money_events.financial_goal_id

snapshots
  └── money_events.snapshot_id

household_members
  ├── assets.holder_member_id
  └── upcoming_payments.owner_member_id
```

---

# 3. Table: profiles

## Dùng để làm gì?

`profiles` lưu thông tin cơ bản của user trong app.

Auth provider như Supabase Auth quản lý đăng nhập, password, session. Bảng `profiles` chỉ lưu thông tin hiển thị trong product.

## Fields chính

```txt
id              uuid, primary key, references auth.users(id)
full_name       text
display_name    text
avatar_url      text
email           text
phone           text
created_at      timestamptz
updated_at      timestamptz
```

## Quan hệ

```txt
profiles 1 - n household_members
profiles 1 - n households.created_by
profiles 1 - n snapshots.created_by
profiles 1 - n money_events.created_by
profiles 1 - n audit_logs.actor_id
```

## Ví dụ

```txt
Minh Nguyễn
minh@example.com
avatar_url = /avatars/minh.png
```

---

# 4. Table: households

## Dùng để làm gì?

`households` là một “nhà”, tức không gian tài chính chung của couple/family.

Tất cả dữ liệu tài chính như tài sản, khoản sắp tới, snapshot, mục tiêu đều thuộc về một household.

## Fields chính

```txt
id                 uuid, primary key
name               text
currency           text, default VND
update_frequency   text: weekly / monthly / manual
created_by         uuid, references profiles(id)
created_at         timestamptz
updated_at         timestamptz
deleted_at         timestamptz, soft delete
```

## Quan hệ

```txt
households 1 - n household_members
households 1 - n household_invites
households 1 - n assets
households 1 - n upcoming_payments
households 1 - n financial_goals
households 1 - n snapshots
households 1 - n money_events
households 1 - n attention_items
households 1 - n audit_logs
```

## Ví dụ

```txt
Nhà Minh & An
currency = VND
update_frequency = weekly
```

---

# 5. Table: household_members

## Dùng để làm gì?

`household_members` lưu user nào thuộc household nào và có quyền gì.

Đây là bảng quan trọng nhất cho permission và RLS.

## Fields chính

```txt
id                  uuid, primary key
household_id        uuid, references households(id)
user_id             uuid, references profiles(id)
role                owner / partner / viewer
permission_level    view_summary / view_grouped / view_detail / edit_content / admin
joined_at           timestamptz
invited_by          uuid, references profiles(id)
created_at          timestamptz
updated_at          timestamptz
```

## Quan hệ

```txt
household_members n - 1 households
household_members n - 1 profiles

household_members 1 - n assets.holder_member_id
household_members 1 - n upcoming_payments.owner_member_id
```

## Unique constraint

```txt
unique(household_id, user_id)
```

Một user không thể là thành viên trùng lặp trong cùng household.

## Permission ý nghĩa

```txt
view_summary
- Chỉ xem tổng quan: tổng tiền, tổng tài sản, tổng nợ, trạng thái.

view_grouped
- Xem theo nhóm: tiền mặt, ngân hàng, tiết kiệm, vàng, nợ.

view_detail
- Xem chi tiết các khoản được chia sẻ.

edit_content
- Thêm/sửa tài sản, khoản sắp tới, mục tiêu, snapshot.

admin
- Quản lý thành viên, quyền, cài đặt household.
```

## Ví dụ

```txt
Minh: owner, admin
An: partner, view_detail
Ba mẹ: viewer, view_summary
```

---

# 6. Table: household_invites

## Dùng để làm gì?

`household_invites` lưu lời mời partner/thành viên vào household.

Khi user tạo household, họ có thể gửi link mời người còn lại.

## Fields chính

```txt
id                         uuid, primary key
household_id               uuid, references households(id)
invited_by                 uuid, references profiles(id)
invitee_email              text
invitee_phone              text
token                      text, unique
status                     pending / accepted / expired / cancelled
default_role               owner / partner / viewer
default_permission_level   view_summary / view_grouped / view_detail / edit_content / admin
expires_at                 timestamptz
accepted_by                uuid, references profiles(id)
accepted_at                timestamptz
created_at                 timestamptz
updated_at                 timestamptz
```

## Quan hệ

```txt
household_invites n - 1 households
household_invites n - 1 profiles.invited_by
household_invites n - 1 profiles.accepted_by
```

## Ví dụ flow

```txt
1. Minh tạo household “Nhà Minh & An”
2. Minh mời An bằng email/link
3. App tạo household_invites với status = pending
4. An bấm link và đăng ký/đăng nhập
5. App tạo household_members cho An
6. Invite chuyển thành accepted
```

---

# 7. Table: snapshots

## Dùng để làm gì?

`snapshots` lưu bức tranh tài chính tại một thời điểm.

Đây là entity trung tâm của product, vì app không tập trung vào ghi từng giao dịch nhỏ mà tập trung vào financial snapshot.

## Fields chính

```txt
id                         uuid, primary key
household_id               uuid, references households(id)

total_liquid               numeric
total_savings              numeric
total_long_term_assets     numeric
total_debt                 numeric

upcoming_due_amount        numeric
attention_count            integer

status                     good / attention / tight / insufficient_data
note                       text

created_by                 uuid, references profiles(id)
created_at                 timestamptz
```

## Quan hệ

```txt
snapshots n - 1 households
snapshots n - 1 profiles.created_by
snapshots 1 - n money_events.snapshot_id
```

## Dashboard dùng thế nào?

Home dashboard lấy snapshot mới nhất:

```txt
latest snapshot = snapshot mới nhất của household
```

## Ví dụ

```txt
Ngày 05/07/2026
total_liquid = 24.500.000
total_savings = 86.000.000
total_long_term_assets = 320.000.000
total_debt = 18.000.000
status = good
```

---

# 8. Table: assets

## Dùng để làm gì?

`assets` lưu tiền và tài sản của household đang nằm ở đâu.

Nó trả lời:

```txt
Tiền nhà mình đang nằm ở đâu?
Có bao nhiêu tiền có thể dùng ngay?
Có bao nhiêu tiền tiết kiệm?
Có tài sản dài hạn gì?
Ai đang giữ khoản đó?
```

## Fields chính

```txt
id                  uuid, primary key
household_id        uuid, references households(id)

name                text
type                cash / bank_account / saving / gold / real_estate / investment / insurance / loan_receivable / other
value               numeric

holder_member_id    uuid, references household_members(id)

liquidity           usable_now / not_immediately_usable / long_term
purpose             text
visibility_level    summary_only / grouped / detail / private
note                text

created_by          uuid, references profiles(id)
created_at          timestamptz
updated_by          uuid, references profiles(id)
updated_at          timestamptz
deleted_at          timestamptz
```

## Quan hệ

```txt
assets n - 1 households
assets n - 1 household_members.holder_member_id
assets n - 1 profiles.created_by
assets n - 1 profiles.updated_by

assets 1 - n money_events.asset_id
```

## Ví dụ

```txt
Tiền mặt ở nhà
type = cash
value = 4.500.000
liquidity = usable_now

Tài khoản VCB
type = bank_account
value = 20.000.000
liquidity = usable_now

Sổ tiết kiệm
type = saving
value = 86.000.000
liquidity = not_immediately_usable

Vàng
type = gold
value = 54.000.000
liquidity = long_term
```

---

# 9. Table: upcoming_payments

## Dùng để làm gì?

`upcoming_payments` lưu các khoản sắp phải trả.

Nó trả lời:

```txt
Sắp tới phải trả gì?
Khi nào đến hạn?
Khoản đó bao nhiêu?
Ai phụ trách?
Đã trả chưa?
```

## Fields chính

```txt
id                    uuid, primary key
household_id          uuid, references households(id)

name                  text
amount                numeric
due_date              date
frequency             once / weekly / monthly / quarterly / yearly

owner_member_id       uuid, references household_members(id)

status                unpaid / paid / pending_confirmation / postponed / overdue

attention_level       normal / important / urgent
is_attention_needed   boolean

note                  text

paid_at               timestamptz
paid_by               uuid, references profiles(id)

created_by            uuid, references profiles(id)
created_at            timestamptz
updated_by            uuid, references profiles(id)
updated_at            timestamptz
deleted_at            timestamptz
```

## Quan hệ

```txt
upcoming_payments n - 1 households
upcoming_payments n - 1 household_members.owner_member_id
upcoming_payments n - 1 profiles.paid_by
upcoming_payments n - 1 profiles.created_by
upcoming_payments n - 1 profiles.updated_by

upcoming_payments 1 - n money_events.upcoming_payment_id
```

## Ví dụ

```txt
Học phí
amount = 12.000.000
due_date = 2026-07-10
frequency = once
status = unpaid

Tiền nhà
amount = 8.000.000
due_date = 2026-07-15
frequency = monthly
status = unpaid
```

## Khi mark paid

Khi user đánh dấu một khoản đã trả:

```txt
1. upcoming_payments.status = paid
2. paid_at = now()
3. paid_by = current user
4. tạo money_events:
   - event_type = payment_paid
   - direction = outflow
   - amount = payment.amount
   - upcoming_payment_id = payment.id
```

---

# 10. Table: money_events

## Dùng để làm gì?

`money_events` lưu các sự kiện tài chính đáng ghi nhận.

Đây không phải bảng để ép user ghi từng khoản nhỏ. Nó dùng cho những sự kiện đủ lớn hoặc đủ quan trọng để giải thích thay đổi trong snapshot.

Nó trả lời:

```txt
Gần đây có khoản lớn nào xảy ra không?
Vì sao tiền dùng ngay tăng/giảm?
Khoản này liên quan đến asset, payment, goal hay snapshot nào?
```

## Ví dụ use case

```txt
Hôm nay tiêu 5tr cho bảo dưỡng xe
Vừa nhận lương 35tr
Vừa đóng học phí 12tr
Vừa gửi thêm 10tr vào quỹ dự phòng
Vừa chuyển 20tr từ ngân hàng sang tiết kiệm
```

## Fields chính

```txt
id                       uuid, primary key
household_id             uuid, references households(id)

title                    text
description              text

event_type               expense / income / transfer / asset_update / payment_paid / goal_contribution / debt_update / adjustment / other
category                 housing / education / transport / health / family_support / insurance / saving / investment / debt / income / repair / household / children / travel / other

amount                   numeric
currency                 text, default VND
event_date               date

direction                inflow / outflow / neutral

related_object_type      asset / upcoming_payment / financial_goal / snapshot / attention_item
related_object_id        uuid

asset_id                 uuid, references assets(id)
upcoming_payment_id      uuid, references upcoming_payments(id)
financial_goal_id        uuid, references financial_goals(id)
snapshot_id              uuid, references snapshots(id)

is_large_event           boolean
is_attention_needed      boolean

visibility_level         summary_only / grouped / detail / private

created_by               uuid, references profiles(id)
created_at               timestamptz
updated_by               uuid, references profiles(id)
updated_at               timestamptz
deleted_at               timestamptz
```

## Quan hệ

```txt
money_events n - 1 households
money_events n - 1 profiles.created_by
money_events n - 1 profiles.updated_by

money_events n - 1 assets
money_events n - 1 upcoming_payments
money_events n - 1 financial_goals
money_events n - 1 snapshots
```

## Ví dụ record

```txt
title = Bảo dưỡng xe
event_type = expense
category = repair
amount = 5.000.000
direction = outflow
event_date = 2026-07-05
is_large_event = true
is_attention_needed = true
```

## Vì sao cần bảng này?

Nếu không có `money_events`, app chỉ có snapshot tổng. User sẽ thấy tiền giảm nhưng không biết lý do.

`money_events` tạo ngữ cảnh nhẹ:

```txt
Tiền dùng ngay giảm vì có khoản bảo dưỡng xe 5M.
```

Nhưng vẫn không biến app thành app ghi thu chi hằng ngày.

---

# 11. Table: financial_goals

## Dùng để làm gì?

`financial_goals` lưu mục tiêu tài chính chung.

Nó trả lời:

```txt
Nhà mình đang tiết kiệm vì mục tiêu gì?
Mục tiêu đã đạt bao nhiêu phần trăm?
Còn thiếu bao nhiêu?
Khi nào cần đạt?
```

## Fields chính

```txt
id                 uuid, primary key
household_id       uuid, references households(id)

name               text
category           emergency_fund / home / home_repair / children / travel / debt_repayment / investment / education / other

target_amount      numeric
current_amount     numeric
deadline           date

priority           low / medium / high
status             active / paused / completed / cancelled

note               text

created_by         uuid, references profiles(id)
created_at         timestamptz
updated_by         uuid, references profiles(id)
updated_at         timestamptz
deleted_at         timestamptz
```

## Quan hệ

```txt
financial_goals n - 1 households
financial_goals n - 1 profiles.created_by
financial_goals n - 1 profiles.updated_by

financial_goals 1 - n money_events.financial_goal_id
```

## Ví dụ

```txt
Quỹ dự phòng
target_amount = 120.000.000
current_amount = 86.000.000
status = active
priority = high
```

## Khi góp tiền vào goal

Ví dụ user góp thêm 10M vào quỹ dự phòng:

```txt
1. financial_goals.current_amount tăng thêm 10M
2. tạo money_events:
   - event_type = goal_contribution
   - direction = neutral hoặc outflow tùy logic sản phẩm
   - amount = 10M
   - financial_goal_id = goal.id
```

---

# 12. Table: attention_items

## Dùng để làm gì?

`attention_items` lưu các khoản hoặc tình huống cần chú ý.

Bảng này thay cho module “Trao đổi tài chính” trong MVP. Nó không có chat, không có comment, không có thread.

Nó trả lời:

```txt
Có khoản nào nên cùng xem lại không?
Có khoản nào hơi cao hơn dự kiến không?
Có gì cần để ý trong tháng này không?
```

## Fields chính

```txt
id                    uuid, primary key
household_id          uuid, references households(id)

title                 text
reason                text
amount                numeric

related_object_type   asset / upcoming_payment / financial_goal / snapshot / money_event
related_object_id     uuid

level                 normal / important / urgent
status                open / seen / resolved / dismissed

created_by            uuid, references profiles(id)
created_at            timestamptz

seen_by               uuid, references profiles(id)
seen_at               timestamptz

resolved_by           uuid, references profiles(id)
resolved_at           timestamptz

deleted_at            timestamptz
```

## Quan hệ

```txt
attention_items n - 1 households
attention_items n - 1 profiles.created_by
attention_items n - 1 profiles.seen_by
attention_items n - 1 profiles.resolved_by

attention_items có thể liên quan mềm tới:
- assets
- upcoming_payments
- financial_goals
- snapshots
- money_events
```

## Ví dụ

```txt
Sửa xe phát sinh
reason = Cao hơn dự kiến trong tháng 7
amount = 5.000.000
related_object_type = money_event
related_object_id = money_events.id
status = open
```

## Khi nào tạo attention item?

```txt
User tự đánh dấu “cần chú ý”
Khoản tiền vượt ngưỡng user đặt
Khoản sắp đến hạn trong 7 ngày
Có khoản quá hạn
Dữ liệu chưa cập nhật quá lâu
```

---

# 13. Table: audit_logs

## Dùng để làm gì?

`audit_logs` lưu lịch sử hành động quan trọng.

Dữ liệu tài chính nhạy cảm, nên cần biết ai tạo/sửa/xóa dữ liệu quan trọng. Bảng này chủ yếu dùng cho debug, support, security review.

## Fields chính

```txt
id             uuid, primary key
household_id   uuid, references households(id)
actor_id       uuid, references profiles(id)

action         text
entity_type    text
entity_id      uuid

metadata       jsonb
created_at     timestamptz
```

## Quan hệ

```txt
audit_logs n - 1 households
audit_logs n - 1 profiles.actor_id
```

## Ví dụ action

```txt
household.created
member.invited
member.permission_updated

snapshot.created

asset.created
asset.updated
asset.deleted

payment.created
payment.marked_paid

money_event.created
money_event.updated
money_event.deleted

attention_item.created
attention_item.resolved
```

## Lưu ý

Không nên lưu quá nhiều dữ liệu nhạy cảm trong `metadata`.

Nên lưu:

```txt
action
entity_type
entity_id
actor_id
timestamp
```

Hạn chế lưu:

```txt
toàn bộ note
toàn bộ số tiền trước/sau
dữ liệu nhạy cảm người dùng nhập
```

---

# 14. Quan hệ theo từng màn hình

## 14.1. Dashboard Home

Home cần query:

```txt
households
latest snapshots
assets summary
upcoming_payments trong 7–30 ngày
money_events gần đây
attention_items đang open
financial_goals summary
```

Data source:

```txt
Status Card
- snapshots.status
- snapshots.created_at
- upcoming_payments overdue/upcoming
- attention_items open

Tiền có thể dùng ngay
- snapshots.total_liquid
- hoặc assets where liquidity = usable_now

Dự phòng
- snapshots.total_savings
- hoặc assets where type = saving

Tổng nợ
- snapshots.total_debt

Khoản sắp tới
- upcoming_payments

Tài sản
- assets grouped by type/liquidity

Hoạt động gần đây
- money_events order by event_date desc

Khoản cần chú ý
- attention_items where status = open
```

---

## 14.2. Update Snapshot Flow

Khi user cập nhật tình hình:

```txt
1. Tạo snapshots record mới
2. Optional: tạo money_events nếu có khoản lớn phát sinh
3. Optional: tạo attention_items nếu có khoản cần chú ý
4. Ghi audit_logs snapshot.created
```

Ví dụ:

```txt
User nhập:
- Tiền dùng ngay: 24.5M
- Tiết kiệm: 86M
- Tài sản dài hạn: 320M
- Tổng nợ: 18M
- Có khoản lớn: Bảo dưỡng xe 5M

App tạo:
- snapshots
- money_events: Bảo dưỡng xe 5M
- attention_items nếu user đánh dấu cần chú ý
```

---

## 14.3. Mark Payment Paid Flow

Khi user đánh dấu “đã trả” khoản học phí:

```txt
1. Update upcoming_payments.status = paid
2. Set paid_at, paid_by
3. Create money_events:
   - title = Đóng học phí
   - event_type = payment_paid
   - category = education
   - amount = 12M
   - direction = outflow
   - upcoming_payment_id = payment.id
4. Write audit_logs payment.marked_paid
```

---

## 14.4. Add Asset Flow

Khi user thêm tài sản:

```txt
1. Create assets
2. Optional create money_events:
   - event_type = asset_update
   - direction = neutral
3. Write audit_logs asset.created
```

---

## 14.5. Goal Contribution Flow

Khi user góp tiền vào mục tiêu:

```txt
1. Update financial_goals.current_amount
2. Create money_events:
   - event_type = goal_contribution
   - amount = contribution amount
   - financial_goal_id = goal.id
3. Write audit_logs goal.updated
```

---

# 15. Quan hệ cardinality chi tiết

```txt
profiles 1 - 1 auth.users

profiles 1 - n household_members
households 1 - n household_members

households 1 - n household_invites

households 1 - n snapshots
households 1 - n assets
households 1 - n upcoming_payments
households 1 - n financial_goals
households 1 - n money_events
households 1 - n attention_items
households 1 - n audit_logs

household_members 1 - n assets as holder_member
household_members 1 - n upcoming_payments as owner_member

assets 1 - n money_events
upcoming_payments 1 - n money_events
financial_goals 1 - n money_events
snapshots 1 - n money_events

profiles 1 - n created_by fields
profiles 1 - n updated_by fields
profiles 1 - n paid_by fields
profiles 1 - n seen_by/resolved_by fields
profiles 1 - n audit_logs.actor_id
```

---

# 16. MVP table priority

## Must-have

```txt
profiles
households
household_members
household_invites
snapshots
assets
upcoming_payments
money_events
attention_items
```

## Should-have

```txt
financial_goals
audit_logs
```

## Later

```txt
notification_preferences
recurring_payment_rules
monthly_reports
exports
bank_imports
```

---

# 17. Gợi ý đặt tên màn hình theo table

Không nên expose tên database ra UI. Mapping nên như sau:

```txt
snapshots
→ Cập nhật tình hình / Lịch sử cập nhật

assets
→ Tài sản & nguồn tiền

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

# 18. Kết luận

Schema MVP nên xoay quanh 5 entity tài chính chính:

```txt
snapshots
assets
upcoming_payments
money_events
attention_items
```

Vai trò từng bảng:

```txt
snapshots
= nhà mình đang thế nào tại một thời điểm

assets
= tiền và tài sản đang nằm ở đâu

upcoming_payments
= sắp phải trả gì

money_events
= gần đây có sự kiện tài chính lớn nào

attention_items
= khoản nào nên cùng xem lại
```

Cách này giữ đúng định vị sản phẩm:

```txt
Không phải app ghi thu chi từng khoản nhỏ.
Không phải app kế toán gia đình.
Là dashboard tài chính chung có snapshot, bối cảnh và khoản cần chú ý.
```

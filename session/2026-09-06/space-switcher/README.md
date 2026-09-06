# Space switcher — một người, nhiều không gian

- **Date**: 2026-09-06
- **Session folder**: `session/2026-09-06/space-switcher/`
- **Status**: done

## What the task is

Người dùng hỏi: điều gì xảy ra nếu một người đã tạo không gian rồi lại tham gia
một không gian khác?

Câu trả lời hoá ra là một bug mất dữ liệu **cảm nhận được**. Backend vốn
many-to-many hoàn chỉnh: `HouseholdMember` chỉ có `@@unique([householdId, userId])`,
`acceptInvite` **thêm** membership chứ không thay thế, `HouseholdAccessGuard` phân
quyền theo cặp `(householdId, userId)` sống ở từng request nên **cả hai không gian
vẫn truy cập được đầy đủ**, và `GET /households` trả về cả hai.

Nhưng client thì giả định đúng một: `use-join-invite.ts` ghi đè `activeHouseholdId`
vô điều kiện, và **không có switcher nào tồn tại**. Không gian cũ biến mất khỏi UI,
không dấu hiệu nào cho biết nó còn đó. Lối ra duy nhất là xoá tay localStorage
(bất khả thi trên mobile) hoặc rời không gian mới.

Người dùng quyết định: **chấp nhận nhiều không gian, thêm switcher**. Backend
không đổi một dòng nào.

## Changes made

### Core (dùng chung web + mobile)

- `packages/core/src/shared/hooks/use-active-household.ts` — **thay đổi nền tảng**.
  Bỏ fallback `?? items[0]`; gộp effect auto-select thành effect tự chữa lành
  (`!items.some(id)` → rơi về không gian cũ nhất). Trước đây, đổi sang B trong lúc
  list chưa có B thì `.find()` trượt và hook âm thầm trả về A — mọi consumer query
  A trong khi store nói B.
- `packages/core/src/features/settings/hooks/use-space-switcher.ts` — **mới**. Trả
  `{ spaces, activeSpaceId, activeSpace, canSwitch, isLoading, switchTo }`.
- `packages/core/src/features/settings/hooks/use-settings-page.ts` — `handleSave`
  thêm `initializedHouseholdId.current !== activeHouseholdId` → return.
- `packages/core/src/features/invites/hooks/use-household-invite.ts` — reset
  `requestedRef` khi đổi không gian.
- `packages/core/src/features/auth/hooks/use-logout.ts` — xoá `activeHouseholdId`
  khi đăng xuất.
- `packages/core/src/i18n/resources.ts` — thêm `settings.spaces` (vi + en).

### Web

- `web/src/features/settings/ui/components/space-switcher-card.tsx` — **mới**.
- `web/src/features/settings/ui/settings-page.tsx` — cắm làm panel đầu tiên.
- `web/src/app/layout/app-shell.tsx` — danh sách space nằm **trong popup menu của
  account** (`SidebarAccount`), giữa label danh tính và sign-out; và mở rộng key của
  `motion.div` thành `${activeHouseholdId}:${pathname}`.

### Mobile

- `mobile/src/features/household/ui/space-switcher-section.tsx` — **mới**, dùng lại
  `Select` (BottomSheet + `Check` + tự tìm kiếm khi >8).
- `mobile/app/(tabs)/household.tsx` — cắm làm section đầu tiên.
- `mobile/app/(tabs)/_layout.tsx` — `<Tabs key={activeHouseholdId}>`.

## Key decisions

**1. Không đụng vào cache khi đổi không gian.** Mọi query key household-scoped đều
là `['households', id, …]`, nên đổi A→B là đổi toàn bộ key: TanStack tự phục vụ
entry của B và giữ nguyên của A → đổi ngược lại **tức thì**.

**2. `exact: true` là bắt buộc, không phải tuỳ chọn.** `queryKeys.households` là
`['households']` — **tiền tố của mọi key household-scoped**. Đã kiểm chứng bằng
`QueryClient` thật: `invalidateQueries({ queryKey: ['households'], exact: true })`
giữ nguyên cả 4 entry; `removeQueries({ queryKey: ['households'] })` không có
`exact` **xoá sạch cả hai không gian lẫn chính danh sách**, chỉ còn `market-data`.

**3. Remount bằng `key`, không viết reset effect từng hook.** Có ≥9 chỗ `useState`
giữ id household-scoped rải khắp 7 file, cộng 2 `useRef`. Sửa lẻ nghĩa là 11 effect
phải nhớ mãi mãi và page tiếp theo sẽ quên.

**4. Sheet what-if phải đóng tay.** Nó mount **một lần** ở shell nên nằm ngoài ranh
giới remount; `prefill.goalId` thuộc không gian cũ trong khi `useWhatIf` POST tới
không gian đang active.

**5. Switcher nằm trong popup menu của account (quyết định của user).** Bản đầu tôi
để thành hàng riêng trên `SidebarAccount` vì comment trong file ghi hàng đó chỉ trả
lời "ai đang đăng nhập". User chọn gộp vào menu account — ít chrome hơn, và ở đó
đã có sẵn `DropdownMenu` với `ChevronsUpDown`. Nhóm space đặt giữa label danh tính
và sign-out, ẩn hoàn toàn khi chỉ có một space nên menu giữ nguyên như cũ.

**6. `canSwitch = spaces.length > 1`.** Với hộ chỉ có một không gian, cả hai
platform **không render gì cả** — giao diện giống hệt hiện tại.

**7. `/join` không đổi.** `setActiveHouseholdId` khi accept giờ là **đúng**: người
vừa nhận lời mời muốn vào đó. Cái đổi là không gian cũ nay vẫn tới được.

## Mobile app parity notes

**Không có việc tồn đọng — web và mobile đã ship cùng lúc trong task này.** Toàn bộ
logic nằm ở `useSpaceSwitcher` trong core, hai platform chỉ khác lớp UI:

| | Web | Mobile |
|---|---|---|
| Control | shadcn `Select` trong `Panel` | `Select` (BottomSheet) trong `Panel` |
| Vị trí | Panel đầu ở `/settings` + menu account ở sidebar | Section đầu tab Gia đình |
| Remount | `motion.div` key | `Tabs` key |

**Web-specific, KHÔNG port:** nhóm space trong menu account — mobile không có
sidebar, và `AccountHeader` có hợp đồng "identity only: no account menu"; 5 tab bị
hard-cap nên không thêm tab.

**Remount trên mobile quan trọng hơn web:** tab screen **không unmount** trên điện
thoại, nên `editingEventId` cũ sống dai vô hạn. Trên web route remount đã che phần
lớn.

## Chưa làm (có lý do)

- **Tạo không gian thứ hai từ trong app** — `RequireNoHousehold` vẫn chặn
  `/onboarding`. Người dùng chọn để sau; hiện chỉ vào không gian thứ 2 qua lời mời.
- **`use-settings-page.ts:92-97`** invalidate `queryKeys.households` non-exact →
  quét sạch cache mỗi lần lưu cài đặt. Lỗi có sẵn, không liên quan; nên sửa riêng.
- **`native-storage.ts:43-45`** nuốt lỗi ghi SecureStore.
- **`vi.assets` (L132 & L334) và `vi.goals` (L163 & L1990) trùng key**, khối sau che
  khối trước.

## Kiểm chứng

Đã chạy, tất cả pass:

- `pnpm build` (tsc -b, phủ cả core) — sạch
- `pnpm lint` (check-copy + eslint) — 0 error, 13 warning có sẵn, không chạm file mới
- `cd mobile && npx tsc --noEmit` — sạch
- `cd mobile && npx expo lint` — 0 error, 1 warning có sẵn

Kịch bản thủ công cần tài khoản thuộc 2 không gian — xem phần "Kiểm chứng" trong
plan file.

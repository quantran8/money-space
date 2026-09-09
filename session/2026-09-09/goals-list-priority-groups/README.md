# Goal list: 3 cột và group theo mức ưu tiên

- **Date**: 2026-09-09
- **Session folder**: `session/2026-09-09/goals-list-priority-groups/`
- **Status**: done

## What the task is

Hai yêu cầu liên tiếp trên danh sách mục tiêu (web):
1. Chia thẻ mục tiêu thành 3 cột 1 hàng.
2. Group danh sách theo mức ưu tiên.

## Changes made

- `web/src/features/goals/ui/components/goals-list-section.tsx`
  - `CARD_GRID` đổi từ inline style `repeat(auto-fit, minmax(min(100%, 360px), 560px))`
    sang class Tailwind `grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3`.
    Track `auto-fit` với cap 560px không bao giờ đạt cột thứ ba ở bề rộng cửa sổ
    thông thường — 3 mục tiêu bị wrap xuống hàng hai.
  - Thêm `PRIORITY_ORDER` (`high` → `medium` → `low`) và `priorityGroups`; mỗi
    rank là một `<section>` có heading `t('options.priority.*')` + số lượng,
    bên trong là grid 3 cột riêng. Rank rỗng bị bỏ hẳn.
  - Trong mỗi block, thứ tự vẫn là sort theo progress (giảm dần) như cũ.
  - Skeleton loading đổi từ 2 lên 3 thẻ cho khớp grid, cao 268px → 212px.
  - Giảm chiều cao thẻ: nhịp dọc trong `GoalCard` rút gần một nửa
    (`mt-7`→`mt-4`, `mt-2`→`mt-1`, `mt-4`→`mt-2.5`, `mt-2`→`mt-1.5`,
    `mt-6`→`mt-2`, `gap-y-3`→`gap-y-1`), bỏ `mt-1` ở dòng "Mục tiêu ...".
    Padding `s-card` giữ nguyên vì đó là spacing role của design system.

## Key decisions

- **Priority là heading, không chỉ là sort key.** Trước đó chỉ sort theo
  `priorityRank`, người đọc phải tự đoán rank nào hết và rank nào bắt đầu — và
  `GoalPriorityMark` cố tình **không** vẽ icon cho `low`, nên trên một hàng 3
  thẻ không có gì trên thẻ nói nó thuộc rank nào. Heading nói một lần cho cả
  block.
- **Rank rỗng bị bỏ, khác với section tài sản.** Asset section giữ card rỗng vì
  vị trí cố định giúp người đọc học được "chỗ này không có gì". Với mục tiêu thì
  ngược lại: phần lớn hộ gia đình không dùng `low`, ba heading cho một mục tiêu
  đọc như một cái form chưa điền xong.
- **Block một thẻ giữ nguyên bề rộng một cột.** Đã thử `max-w-[560px]` cho
  trường hợp một thẻ nhưng nó đánh nhau với grid track và ra một cột hẹp ~180px
  (thấy trong screenshot). Track cố định là đủ: thẻ đơn lẻ thẳng cột với các
  thẻ ở block trên.
- Dùng lại key i18n có sẵn `options.priority.*` và `goals.countLabel` — không
  thêm copy mới.

## Mobile app parity notes

- **Chưa port.** Mobile có màn goals riêng, chưa sửa trong task này.
- Khi port: phần group theo `PRIORITY_ORDER` + heading nên port (đó là quyết
  định nghiệp vụ/thông tin). Grid 3 cột là **web-only** —
  `sm:grid-cols-2 lg:grid-cols-3` không có nghĩa trên mobile, các thẻ stack một
  cột trong từng block.

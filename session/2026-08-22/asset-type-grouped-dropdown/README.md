# Asset type picker → grouped shadcn DropdownMenu

- **Date**: 2026-08-22
- **Session folder**: `session/2026-08-22/asset-type-grouped-dropdown/`
- **Status**: done

## What the task is

Thay `Select` chọn loại tài sản trong asset form bằng shadcn **DropdownMenu**, chia
làm 3 nhóm: cash/bank account, market asset, và other.

## Changes made

- `src/features/assets/model/assets.ts` — thêm `assetTypeGroups` (3 nhóm: `wallet`,
  `market`, `other`); `assetTypeOrder` giờ được derive từ `assetTypeGroups.flatMap(...)`
  thay vì là một mảng phẳng viết tay, nên zod schema và picker không thể lệch nhau.
- `src/features/assets/ui/components/asset-form-dialog.tsx` — trường "Loại tài sản"
  đổi từ `Select` sang `DropdownMenu` + `DropdownMenuRadioGroup`, mỗi nhóm có
  `DropdownMenuLabel` và ngăn cách bằng `DropdownMenuSeparator`. Trigger giữ nguyên
  `fieldShell` / `fieldControlReset` nên hình dạng field không đổi, chỉ thêm
  `ChevronDownIcon`. Content rộng bằng trigger qua
  `w-[var(--radix-dropdown-menu-trigger-width)]` và `max-h-[320px]` có scroll.
  Các `Select` khác trong file (ví, kỳ trả lãi, nguồn tiền) giữ nguyên.
- `src/features/assets/ui/components/symbol-combobox.tsx` — mỗi dòng gợi ý rút từ
  3 cột (`symbol` + `name` + `exchange`) xuống còn **title + brand**
  (`symbol` + `exchange`). Với vàng thì `name` chỉ là chính cái title viết dài ra
  ("VÀNG MIẾNG SJC" / "VÀNG MIẾNG SJC — Vàng SJC"), nên 3 cột trong popover hẹp
  bằng dialog làm title xuống dòng mỗi từ một hàng.
- `src/i18n/resources.ts` — thêm `assets.form.typeGroup.{wallet,market,other}` cho
  cả `vi` và `en`.

## Key decisions

- Nhóm theo **cách định giá** chứ không theo tên loại: `wallet` = số dư mình giữ,
  `market` = giá do thị trường quyết định, `other` = phần còn lại. Trùng khớp với
  `valuationModeByType`, nên nhóm nào cũng đọc ra được là form sẽ hỏi gì tiếp theo.
- Dùng `DropdownMenuRadioGroup` (không phải `DropdownMenuItem` thường) để giá trị
  đang chọn vẫn hiện dấu chọn — Select cũ có, mất đi sẽ là bước lùi.
- `assetTypeOrder` derive từ groups: thêm/bớt loại chỉ sửa một chỗ.
- Bỏ cột `name` khỏi symbol combobox chỉ là thay đổi hiển thị: `Command` chạy
  `shouldFilter={false}`, việc khớp tìm kiếm do backend làm, nên vẫn tìm được
  theo tên đầy đủ dù tên không còn hiện trên dòng.
- `handleTypeChange` không đổi — vẫn reset `symbol`/`market`/`unit`/`purchasePrice`
  và `countsAsFlexible` khi đổi loại.

## Mobile app parity notes

- `assetTypeGroups` là domain data, port sang mobile để picker chia nhóm giống nhau.
- Key i18n `assets.form.typeGroup.*` cần copy sang mobile resources.
- Dòng gợi ý symbol ở mobile cũng nên là title + brand, cùng lý do: màn hẹp.
- Riêng `DropdownMenu` là Radix/web-specific: mobile nên dùng section list trong
  bottom sheet với cùng 3 nhóm và cùng thứ tự.

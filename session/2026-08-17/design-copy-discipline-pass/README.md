# Copy discipline pass cho design system (design.md v4.1)

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/design-copy-discipline-pass/`
- **Status**: done

## What the task is

Bỏ mọi copy không cần thiết trong design system, chỉ giữ lại dòng nào giúp user hiểu con số hoặc biết việc cần làm. Mọi copy phải ngắn gọn, không dài dòng. Phạm vi: `family-finance-v3.1/design.md` (spec UI/component), không sửa code.

## Changes made

- `family-finance-v3.1/design.md` — bump v4.0 → v4.1, thêm changelog v4.0 → v4.1. Chỉ đổi copy, không đổi hệ thị giác.
  - **§2.10** viết lại thành quy tắc cứng: 3 việc một dòng chữ được phép làm, **“một dữ kiện, một chỗ”**, copy budget cho mỗi Home section, giới hạn độ dài (nhãn ≤ 4 từ, câu hệ quả/caveat ≤ 12 từ, nút ≤ 4 từ), bảng trước/sau.
  - **§16.6 MỚI — Canonical strings**: mỗi dữ kiện đúng một cách viết, một i18n key, số luôn là biến.
  - **§11.1** header section: title + đúng một thứ bên phải (metadata HOẶC link, không cả hai).
  - **§11.4** legend money composition về 2 dòng, aria-label đọc 2 giá trị (bar đã còn 2 đoạn từ §5.4).
  - **§11.5** coverage strip bỏ “3 mới trong tuần”; caveat `Số trên chưa gồm thay đổi của A và B.` → `Chưa gồm A và B.`
  - **§11.7** một luồng mô phỏng chỉ một dấu hiệu bằng chữ (`Nếu thực hiện`); bỏ nhãn header “Đang thử — chưa ghi vào bức tranh”, trạng thái đó đi qua `aria-describedby`.
  - **§12.1** bỏ dòng `trên tổng 209,7 tr tiền mặt · giá trị ròng 1,81 tỷ` dưới hero.
  - **§12.2** dòng tổng bảng dòng tiền đổi thành `Vào … · Ra …`; bỏ “Cuối kỳ dự kiến còn linh hoạt”.
  - **§12.3** bỏ chip “chính” và số “20%”; nhãn “Để về đúng ngày mong muốn” → “Để đúng hẹn cần”.
  - **§12.6 / §23** dòng phạm vi mô phỏng: bỏ “Tính trên dữ liệu hiện có”, còn `Chưa gồm N nguồn cần cập nhật.`
  - **§16.4** thêm hai nhóm avoid: filler `Tính trên dữ liệu hiện có`, và nhóm “lặp lại thứ đã có trên màn”.
  - **§16.5** status copy rút còn một dòng mỗi trạng thái, dưới 10 từ, có số khi có số.
  - **§22.1/22.4/22.7/22.8/22.11** rút copy trong form: helper “Lấy từ 48,2 tr đang linh hoạt”; câu hệ quả tối đa hai dòng (+ ví dụ “đúng ý nhưng dài gấp đôi”); tóm tắt thay đổi về một dòng có `→`; hệ quả phá huỷ một dòng.
  - **§9.2** page header bỏ tên thứ trong ngày (mono không chạm chuỗi có dấu — §10.1).
  - **§19** thêm 3 do + 4 do-not về copy. **§20** ví dụ Home viết lại. **§25** thêm 8 dòng deprecated.
  - Sửa vài chỗ lệch có sẵn: `thanh 3 đoạn` → 2 đoạn (§1.2), `12,4 tr` → `12,1 tr` (§12.2, khớp 48,2 − 36,1), hai cách viết cách tính hero (§2.6/§2.15) gộp về `Sau các khoản đã có nhiệm vụ`.

## Key decisions

- Quy tắc điều phối là **“một dữ kiện, một chỗ”**: một con số xuất hiện đúng một lần trên một trang; một dữ kiện có đúng một cách viết trong toàn app; một action có đúng một nhãn và tối đa hai lối vào.
- Ngoại lệ duy nhất: legend là nhãn trực tiếp của một hình (bar/chart) nên được nhắc lại giá trị đoạn nó chú thích — nếu không thì hình không đọc được.
- Cắt `giá trị ròng` khỏi Home không chỉ vì trùng: nó vi phạm §2.13 (net worth chỉ ở trang Tài sản) — spec cũ tự mâu thuẫn ở đây.
- Dòng tổng của bảng dòng tiền đổi thành tổng vào/tổng ra thay vì xoá hẳn, vì §2.7 vẫn đòi incoming/outgoing total, còn số cuối cột “Còn lại” thì đã có trong bảng.
- **Chưa áp vào code.** `src/i18n/resources.ts` và các component vẫn theo copy cũ; đồng bộ theo §16.6 là task riêng, và các chuỗi canonical nên thành một key dùng lại ở mọi surface.

## Mobile app parity notes

- §2.10 (một dữ kiện, một chỗ + giới hạn độ dài) và §16.6 (canonical strings) áp cho cả mobile — copy là shared, không phải web-specific.
- Khi port: cùng một chuỗi, cùng một key. Mobile không được fork bản dài hơn cho màn hẹp; nếu chật thì cắt chữ theo §2.10, không xuống hai dòng.
- Web-specific, KHÔNG port: §11.1 (header section + metadata/link), §9.2 page header, hover nền `--sunk` của table row.

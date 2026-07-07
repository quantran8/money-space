import type { MoneyEventItem } from '@/features/events/model/events.types'

export const moneyEvents: MoneyEventItem[] = [
  {
    title: 'Bảo dưỡng xe',
    amount: '-5M',
    note: 'Chi sửa xe để đi làm tuần này',
    date: '05 Jul',
    type: 'expense',
    category: 'repair',
    direction: 'outflow',
  },
  {
    title: 'Chuyển thêm vào quỹ dự phòng',
    amount: '+10M',
    note: 'Bổ sung từ tài khoản lương',
    date: '02 Jul',
    type: 'goal_contribution',
    category: 'saving',
    direction: 'neutral',
  },
  {
    title: 'Đóng trước tiền điện nước',
    amount: '-1,2M',
    note: 'Giảm áp lực giữa tháng',
    date: '01 Jul',
    type: 'expense',
    category: 'household',
    direction: 'outflow',
  },
  {
    title: 'Nhận lương tháng 7',
    amount: '+35M',
    note: 'Tiền lương chuyển vào tài khoản chung',
    date: '30 Jun',
    type: 'income',
    category: 'income',
    direction: 'inflow',
  },
]

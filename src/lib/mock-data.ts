export type MoneyEventItem = {
  title: string
  amount: string
  note: string
  date: string
  type: 'expense' | 'income' | 'transfer' | 'goal_contribution'
  category: string
  direction: 'inflow' | 'outflow' | 'neutral'
}

export const dashboardSnapshot = {
  updatedAt: '05/07/2026',
  liquid: '24.5',
  liquidDisplay: '24,5M',
  liquidSplit: {
    cash: '4.5M',
    account: '20M',
  },
  savings: '86M',
  debt: '18M',
  attentionCount: 1,
}

export const upcomingPayments = [
  { name: 'Học phí tháng 7', amount: '12M', due: '10 Jul', owner: 'An phụ trách' },
  { name: 'Tiền nhà', amount: '8M', due: '15 Jul', owner: 'Minh phụ trách' },
  { name: 'Bảo hiểm xe', amount: '1,8M', due: '22 Jul', owner: 'Đang chờ xác nhận' },
]

export const dashboardGoals = [
  {
    name: 'Quỹ dự phòng',
    progress: 72,
    current: '86M',
    target: '120M',
    deadline: 'Q4/2026',
  },
  {
    name: 'Du lịch cuối năm',
    progress: 38,
    current: '19M',
    target: '50M',
    deadline: 'Dec 2026',
  },
]

export const assetGroups = [
  { name: 'Có thể dùng ngay', value: '24,5M', note: 'Tiền mặt, VCB, Techcombank' },
  { name: 'Tiết kiệm & dự phòng', value: '86M', note: '2 sổ tiết kiệm, quỹ khẩn cấp' },
  { name: 'Dài hạn', value: '374M', note: 'Vàng, đầu tư, bảo hiểm, đất' },
]

export const attentionItems = [
  {
    title: 'Học phí tháng 7 hơi lớn so với mức tiền dùng ngay',
    reason: 'Nên chốt nguồn chi trước 10 Jul để tránh rút từ quỹ dự phòng.',
    level: 'Quan trọng',
  },
  {
    title: 'Bảo dưỡng xe tháng này cao hơn bình thường',
    reason:
      'Khoản 5M đã ghi nhận là sự kiện lớn, nên để lại ghi chú cho cả hai cùng hiểu.',
    level: 'Cần trao đổi',
  },
]

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

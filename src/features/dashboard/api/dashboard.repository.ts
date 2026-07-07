/**
 * Dashboard overview data (mock).
 *
 * The home dashboard reads a pre-aggregated snapshot of the household's
 * situation. In the MVP this is seed data; later it becomes a Supabase
 * read of the latest snapshot + derived rollups.
 */

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

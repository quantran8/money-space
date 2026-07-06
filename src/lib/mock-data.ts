export type MoneyEventItem = {
  title: string
  amount: string
  note: string
  date: string
  type: 'expense' | 'income' | 'transfer' | 'goal_contribution'
  category: string
  direction: 'inflow' | 'outflow' | 'neutral'
}

export const eventTypeLabels: Record<MoneyEventItem['type'], string> = {
  expense: 'Chi ra',
  income: 'Tiền vào',
  transfer: 'Chuyển khoản',
  goal_contribution: 'Góp mục tiêu',
}

export const eventCategoryLabels: Record<string, string> = {
  education: 'Giáo dục',
  repair: 'Sửa chữa',
  saving: 'Tiết kiệm',
  income: 'Thu nhập',
  household: 'Sinh hoạt',
  other: 'Khác',
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

export type PaymentStatus = 'important' | 'normal' | 'pending'

export type UpcomingPaymentItem = {
  id: string
  name: string
  amount: string
  due: string
  status: PaymentStatus
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  important: 'Quan trọng',
  normal: 'Bình thường',
  pending: 'Chờ xác nhận',
}

export const upcomingPaymentList: UpcomingPaymentItem[] = [
  { id: 'p1', name: 'Học phí tháng 7', amount: '12M', due: '10 Jul', status: 'important' },
  { id: 'p2', name: 'Tiền nhà', amount: '8M', due: '15 Jul', status: 'normal' },
  { id: 'p3', name: 'Bảo hiểm xe', amount: '1,8M', due: '22 Jul', status: 'pending' },
]

export type AssetLiquidity = 'usable_now' | 'not_immediate' | 'long_term'

export type AssetItem = {
  id: string
  name: string
  value: string
  liquidity: AssetLiquidity
  note: string
}

export const liquidityLabels: Record<AssetLiquidity, string> = {
  usable_now: 'Dùng ngay',
  not_immediate: 'Dự phòng',
  long_term: 'Dài hạn',
}

export const assets: AssetItem[] = [
  { id: 'a1', name: 'Tiền mặt ở nhà', value: '4,5M', liquidity: 'usable_now', note: 'Chi tiêu hằng ngày' },
  { id: 'a2', name: 'VCB Family', value: '20M', liquidity: 'usable_now', note: 'Tài khoản chung' },
  { id: 'a3', name: 'Sổ tiết kiệm', value: '86M', liquidity: 'not_immediate', note: 'Quỹ dự phòng 6 tháng' },
  { id: 'a4', name: 'Vàng', value: '54M', liquidity: 'long_term', note: 'Giữ dài hạn' },
]

export type GoalPriority = 'high' | 'medium' | 'low'

export type GoalItem = {
  id: string
  name: string
  current: string
  target: string
  progress: number
  priority: GoalPriority
  note: string
}

export const priorityLabels: Record<GoalPriority, string> = {
  high: 'Ưu tiên cao',
  medium: 'Bình thường',
  low: 'Ưu tiên thấp',
}

export const financialGoals: GoalItem[] = [
  { id: 'g1', name: 'Quỹ dự phòng', current: '86M', target: '120M', progress: 72, priority: 'high', note: 'Ưu tiên cao' },
  { id: 'g2', name: 'Du lịch cuối năm', current: '19M', target: '50M', progress: 38, priority: 'medium', note: 'Đang tích lũy dần' },
  { id: 'g3', name: 'Học cho con', current: '12M', target: '40M', progress: 30, priority: 'medium', note: 'Bắt đầu sớm để nhẹ áp lực' },
]

export function parseAmount(raw: string) {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function computeProgress(current: string, target: string) {
  const targetValue = parseAmount(target)
  if (targetValue <= 0) return 0
  return Math.round(Math.min(100, (parseAmount(current) / targetValue) * 100))
}

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

export type HouseholdRole = 'owner' | 'partner' | 'viewer'

export type PermissionLevel =
  | 'view_summary'
  | 'view_grouped'
  | 'view_detail'
  | 'edit_content'
  | 'admin'

export type MemberItem = {
  id: string
  name: string
  email: string
  initials: string
  role: HouseholdRole
  permission: PermissionLevel
  joinedAt: string
  lastActive: string
  status: 'active' | 'invited'
}

export const roleLabels: Record<HouseholdRole, string> = {
  owner: 'Chủ hộ',
  partner: 'Bạn đời',
  viewer: 'Người xem',
}

export const permissionLabels: Record<PermissionLevel, string> = {
  view_summary: 'Xem tổng quan',
  view_grouped: 'Xem theo nhóm',
  view_detail: 'Xem chi tiết',
  edit_content: 'Chỉnh sửa nội dung',
  admin: 'Toàn quyền',
}

export const householdMembers: MemberItem[] = [
  {
    id: 'm1',
    name: 'Minh Nguyễn',
    email: 'minh@nhaminh.vn',
    initials: 'MN',
    role: 'owner',
    permission: 'admin',
    joinedAt: '12 Jan 2026',
    lastActive: 'Hôm nay',
    status: 'active',
  },
  {
    id: 'm2',
    name: 'An Trần',
    email: 'an@nhaminh.vn',
    initials: 'AT',
    role: 'partner',
    permission: 'edit_content',
    joinedAt: '18 Jan 2026',
    lastActive: 'Hôm qua',
    status: 'active',
  },
  {
    id: 'm3',
    name: 'Bà ngoại',
    email: 'ngoai@nhaminh.vn',
    initials: 'BN',
    role: 'viewer',
    permission: 'view_summary',
    joinedAt: '02 Feb 2026',
    lastActive: '3 ngày trước',
    status: 'invited',
  },
]

export const household = {
  name: 'Nhà Minh',
  currency: 'VND',
  updateFrequency: 'weekly',
  createdAt: '12 Jan 2026',
}

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

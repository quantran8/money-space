import type { GoalItem } from '@/features/goals/model/goals.types'

export const financialGoals: GoalItem[] = [
  { id: 'g1', name: 'Quỹ dự phòng', current: '86M', target: '120M', progress: 72, priority: 'high', note: 'Ưu tiên cao' },
  { id: 'g2', name: 'Du lịch cuối năm', current: '19M', target: '50M', progress: 38, priority: 'medium', note: 'Đang tích lũy dần' },
  { id: 'g3', name: 'Học cho con', current: '12M', target: '40M', progress: 30, priority: 'medium', note: 'Bắt đầu sớm để nhẹ áp lực' },
]

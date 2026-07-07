import type { MoneyEventItem } from '@/features/events/model/events.types'

export type { MoneyEventItem } from '@/features/events/model/events.types'

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

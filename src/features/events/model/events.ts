import type { MoneyEventItem } from '@/features/events/model/events.types'

export type { MoneyEventItem } from '@/features/events/model/events.types'

export const eventTypeLabels: Record<MoneyEventItem['type'], string> = {
  expense: 'Chi ra',
  income: 'Tiền vào',
  transfer: 'Chuyển khoản',
  goal_contribution: 'Góp mục tiêu',
  debt_update: 'Khoản nợ',
}

export const eventCategoryLabels: Record<string, string> = {
  education: 'Giáo dục',
  repair: 'Sửa chữa',
  saving: 'Tiết kiệm',
  debt: 'Nợ',
  income: 'Thu nhập',
  household: 'Sinh hoạt',
  other: 'Khác',
}

import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'

export const upcomingPaymentList: UpcomingPaymentItem[] = [
  { id: 'p1', name: 'Học phí tháng 7', amount: '12M', due: '10 Jul', status: 'important' },
  { id: 'p2', name: 'Tiền nhà', amount: '8M', due: '15 Jul', status: 'normal' },
  { id: 'p3', name: 'Bảo hiểm xe', amount: '1,8M', due: '22 Jul', status: 'pending' },
]

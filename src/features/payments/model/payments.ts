import type { PaymentStatus } from '@/features/payments/model/payments.types'

export type { PaymentStatus, UpcomingPaymentItem } from '@/features/payments/model/payments.types'

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  important: 'Quan trọng',
  normal: 'Bình thường',
  pending: 'Chờ xác nhận',
}

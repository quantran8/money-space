export type PaymentStatus = 'important' | 'normal' | 'pending'

export type UpcomingPaymentItem = {
  id: string
  name: string
  amount: string
  due: string
  status: PaymentStatus
}

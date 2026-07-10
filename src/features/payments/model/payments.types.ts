export type PaymentStatus = 'important' | 'normal' | 'pending'

export type UpcomingPaymentItem = {
  id: string
  name: string
  amount: string
  amountValue?: number
  due: string
  dueDate?: string
  status: PaymentStatus
  debtId?: string
  owner?: string
}

export type MoneyEventItem = {
  title: string
  amount: string
  note: string
  date: string
  type: 'expense' | 'income' | 'transfer' | 'goal_contribution'
  category: string
  direction: 'inflow' | 'outflow' | 'neutral'
}

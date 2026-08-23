/**
 * The cashflow sheets, for any screen that needs one.
 *
 * Every action on a forecast row is a cashflow dialog, and the forecast is not
 * the only place they open from — Home confirms an overdue occurrence from its
 * own list. So these are exported as self-contained components: each reads what
 * it needs from core (assets, goal usage) and takes only the event it is acting
 * on plus a callback. Nothing in here assumes the Upcoming screen is mounted.
 *
 * The mutations themselves stay with the caller — `useCashflowEvents` owns the
 * invalidation set, and a sheet firing its own write would leave whichever
 * screen opened it deciding what to do about a failure it never saw.
 */

export { CashflowEventFormSheet } from '@/features/cashflow/ui/cashflow-event-form-sheet'
export { CompleteCashflowSheet } from '@/features/cashflow/ui/complete-cashflow-sheet'
export { GoalImpactNotice } from '@/features/cashflow/ui/goal-impact-notice'
export { PostponeCashflowSheet } from '@/features/cashflow/ui/postpone-cashflow-sheet'
export { SpendImpactBar } from '@/features/cashflow/ui/spend-impact-bar'

export { settlementWalletOptions } from '@/features/cashflow/lib/wallet-options'

export type { CashflowEventFormSheetProps } from '@/features/cashflow/ui/cashflow-event-form-sheet'
export type { CompleteCashflowSheetProps } from '@/features/cashflow/ui/complete-cashflow-sheet'
export type { PostponeCashflowSheetProps } from '@/features/cashflow/ui/postpone-cashflow-sheet'

import { z } from 'zod'

import type { MoneyEventItem } from '@/features/events/model/events'
import { parseRawMoney } from '@/shared/lib/number-format'

export type AttentionLevel = 'normal' | 'important' | 'urgent'
export type RecordStatus =
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'recorded'
  | 'pending_confirmation'
  | 'postponed'
export type RecordTab = 'all' | 'upcoming' | 'actual' | 'inflow' | 'outflow'
export type RecordDirection = 'inflow' | 'outflow' | 'neutral'
export type QuickAction =
  | 'upcoming'
  | 'expense'
  | 'income'
  | 'transfer'
  | 'goal_contribution'
  | 'payment_paid'
  | 'debt_borrow'
export type RecordType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'asset_purchase'
  | 'asset_sale'
  | 'payment_paid'
  | 'goal_contribution'
  | 'debt_update'
  | 'adjustment'
  | 'other'

export type LocalUpcomingPayment = {
  id: string
  name: string
  amount: number
  currency: string
  dueDate: string
  status: RecordStatus
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  expectedFromAssetId?: string
  expectedFromAssetName?: string
  ownerMemberId?: string
  ownerName?: string
  frequency?: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  note?: string
  autoCreateNext?: boolean
  debtId?: string
}

export type LocalMoneyEvent = {
  id: string
  amount: number
  currency: string
  date: string
  displayDate: string
  status: RecordStatus
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  eventType: RecordType
  direction: RecordDirection
  category: string
  fromAssetId?: string
  fromAssetName?: string
  toAssetId?: string
  toAssetName?: string
  upcomingPaymentId?: string
  financialGoalId?: string
  note?: string
  // Type-specific fields carried through so an edit can preserve them instead of
  // silently dropping them. `asset_sale` needs fee + sold qty/value; a debt
  // repayment needs its `debtId` so the backend still reduces the right debt.
  feeAmount?: number
  soldQuantity?: number
  soldValue?: number
  debtId?: string
}

export type FinancialRecordItem = {
  id: string
  sourceType: 'upcoming_payment' | 'money_event'
  /** Whether this record can be edited in-place (false for system / dedicated-
   *  flow money events — see {@link isEditableEventType}). Upcoming payments are
   *  always editable. */
  canEdit?: boolean
  /** Display label for the timeline row. For an upcoming payment it's the
   *  payment name; for a money event it's the note (title was dropped), falling
   *  back to a translated category label when the note is empty. Derived — not a
   *  stored field on the event. */
  title: string
  amount: number
  currency: string
  date: string
  displayDate: string
  status: RecordStatus
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  eventType?: RecordType
  direction?: RecordDirection
  category?: string
  fromAssetId?: string
  fromAssetName?: string
  toAssetId?: string
  toAssetName?: string
  upcomingPaymentId?: string
  financialGoalId?: string
  ownerMemberId?: string
  ownerName?: string
  frequency?: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  note?: string
}

export type TimelineGroupKey = 'upcoming' | 'today' | 'week' | 'month' | 'older'

export type UpcomingRecordForm = {
  name: string
  amount: string
  dueDate: string
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  ownerMemberId: string
  expectedFromAssetId: string
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  note: string
  autoCreateNext: boolean
}

export type ActualRecordForm = {
  amount: string
  eventDate: string
  eventType: RecordType
  category: string
  direction: RecordDirection
  fromAssetId: string
  toAssetId: string
  upcomingPaymentId: string
  financialGoalId: string
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  note: string
  // Only used when editing an `asset_update` revaluation: the field edits the
  // *diff* the record represents, and `amount` holds its magnitude — this carries
  // whether that diff raised (`increase`) or lowered (`decrease`) the asset. The
  // signed diff sent to the backend is `amount × (increase ? +1 : −1)`.
  revaluationDirection: 'increase' | 'decrease'
}

// The real current date (local time) as an ISO `YYYY-MM-DD` string. Used both to
// anchor the timeline grouping (today / this week / this month / older) and as the
// default date for new records. Previously this was frozen to a hardcoded seed date,
// which made records land in the wrong buckets (e.g. an 08 Jul record shown under
// "today" long after the real today had moved on).
function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const TODAY = todayIsoDate()

export const upcomingDefaults: UpcomingRecordForm = {
  name: '',
  amount: '',
  dueDate: TODAY,
  frequency: 'once',
  ownerMemberId: '',
  expectedFromAssetId: '',
  attentionLevel: 'normal',
  isAttentionNeeded: false,
  note: '',
  autoCreateNext: false,
}

export const actualDefaults: ActualRecordForm = {
  amount: '',
  eventDate: TODAY,
  eventType: 'expense',
  // Empty by default so the required category picker starts unselected and the
  // user must choose one (validated by `buildActualSchema`).
  category: '',
  direction: 'outflow',
  fromAssetId: '',
  toAssetId: '',
  upcomingPaymentId: '',
  financialGoalId: '',
  attentionLevel: 'normal',
  isAttentionNeeded: false,
  note: '',
  revaluationDirection: 'increase',
}

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function createId() {
  return crypto.randomUUID()
}

/** Parse a raw (separator-free) money string like "8000000" into VND. */
export function parseAmountInput(raw: string): number {
  const value = parseRawMoney(raw)
  return Number.isFinite(value) ? value : 0
}

/** Convert a stored VND amount into the raw digit string the form holds. */
export function formatAmountInput(value: number) {
  if (!Number.isFinite(value)) return ''
  return String(Math.abs(Math.round(value)))
}

export function formatShortDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${shortMonthNames[date.getMonth()]}`
}

export function startOfDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`)
}

export function differenceInDays(fromIsoDate: string, toIsoDate: string) {
  const from = startOfDay(fromIsoDate).getTime()
  const to = startOfDay(toIsoDate).getTime()
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

export function getWeekStart(isoDate: string) {
  const date = startOfDay(isoDate)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

export function isInCurrentWeek(isoDate: string) {
  const current = startOfDay(TODAY)
  const weekStart = getWeekStart(TODAY)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const candidate = startOfDay(isoDate)
  return candidate >= weekStart && candidate <= current && candidate <= weekEnd
}

export function isSameMonthAsToday(isoDate: string) {
  return isoDate.slice(0, 7) === TODAY.slice(0, 7)
}

export function isAttentionRecord(record: FinancialRecordItem) {
  return (
    record.isAttentionNeeded ||
    record.attentionLevel === 'important' ||
    record.attentionLevel === 'urgent' ||
    record.status === 'overdue' ||
    record.status === 'pending_confirmation' ||
    record.status === 'postponed'
  )
}

export function getDirectionFromEventType(eventType: RecordType): RecordDirection {
  if (eventType === 'income') return 'inflow'
  if (eventType === 'expense' || eventType === 'payment_paid' || eventType === 'debt_update') {
    return 'outflow'
  }
  return 'neutral'
}

export function toMoneyEventSeed(event: MoneyEventItem): LocalMoneyEvent {
  // `event.amount` is now a raw signed number from the API (no longer a
  // formatted string), so it feeds the local model directly.
  return {
    // Keep the API event id so edit/delete + type-routing (which look the event
    // up in the raw list by id) match. Only fall back to a fresh id for a
    // seed without one. Previously this ALWAYS minted a new id, so
    // `seedEvents.find(id)` never matched → asset_sale / asset_update edits fell
    // through to the generic form.
    id: event.id ?? createId(),
    amount: event.amount,
    currency: 'VND',
    date: event.isoDate,
    displayDate: event.date,
    status: 'recorded',
    attentionLevel: event.direction === 'outflow' ? 'important' : 'normal',
    isAttentionNeeded: event.direction === 'outflow' && event.amount <= -5_000_000,
    // `asset_update` (a system-generated revaluation) isn't a form-creatable
    // type; if such an event is ever opened in the form, represent it as the
    // neutral `adjustment` bookkeeping type.
    eventType: event.type === 'asset_update' ? 'adjustment' : event.type,
    direction: event.direction,
    category: event.category,
    // Prefer the explicit from/to on the event (a transfer sets both); fall back
    // to the direction-derived single `assetId` for legacy single-sided events.
    fromAssetId: event.fromAssetId ?? (event.direction !== 'inflow' ? event.assetId : undefined),
    fromAssetName: event.fromAssetId ? undefined : (event.direction !== 'inflow' ? event.assetName : undefined),
    toAssetId: event.toAssetId ?? (event.direction === 'inflow' ? event.assetId : undefined),
    toAssetName: event.toAssetId ? undefined : (event.direction === 'inflow' ? event.assetName : undefined),
    note: event.note,
    // Carry type-specific fields through so an edit preserves them.
    feeAmount: event.feeAmount,
    soldQuantity: event.soldQuantity,
    soldValue: event.soldValue,
    debtId: event.debtId,
  }
}

export function getPaymentAttentionLevel(status: 'important' | 'normal' | 'pending'): AttentionLevel {
  if (status === 'important') return 'important'
  if (status === 'pending') return 'urgent'
  return 'normal'
}

export function getPaymentRecordStatus(dueDate: string, status: 'important' | 'normal' | 'pending'): RecordStatus {
  if (differenceInDays(dueDate, TODAY) < 0) return 'overdue'
  if (status === 'pending') return 'pending_confirmation'
  return 'unpaid'
}

export function toUpcomingPaymentSeed(
  payment: {
    id: string
    name: string
    amount: string
    amountValue?: number
    due: string
    status: 'important' | 'normal' | 'pending'
    owner?: string
    debtId?: string
  },
  index: number,
  assets: Array<{ id: string; name: string }>,
  members: Array<{ id: string; name: string }>,
): LocalUpcomingPayment {
  const asset = assets[index % Math.max(assets.length, 1)]
  const owner = members[index % Math.max(members.length, 1)]
  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(payment.due)
  const dueMonth = shortMonthNames.indexOf(payment.due.split(' ')[1] ?? 'Jul') + 1
  const legacyDueDate = `2026-${String(dueMonth > 0 ? dueMonth : 7).padStart(2, '0')}-${String(
    Number(payment.due.split(' ')[0] ?? '10'),
  ).padStart(2, '0')}`
  const dueDate = isIsoDate ? payment.due : legacyDueDate
  return {
    id: payment.id,
    name: payment.name,
    amount: payment.amountValue ?? 0,
    currency: 'VND',
    dueDate,
    status: getPaymentRecordStatus(dueDate, payment.status),
    attentionLevel: getPaymentAttentionLevel(payment.status),
    isAttentionNeeded: payment.status !== 'normal',
    expectedFromAssetId: asset?.id,
    expectedFromAssetName: asset?.name,
    ownerMemberId: owner?.id,
    ownerName: payment.owner || owner?.name,
    frequency: index === 1 ? 'monthly' : 'once',
    note:
      payment.status === 'pending'
        ? 'Cần cả hai cùng chốt lại số tiền trước khi xử lý.'
        : 'Khoản đã lên kế hoạch để chủ động chuẩn bị tiền.',
    autoCreateNext: index === 1,
    debtId: payment.debtId,
  }
}

export function areEventsEqual(left: LocalMoneyEvent[], right: LocalMoneyEvent[]) {
  if (left.length !== right.length) return false
  return left.every((item, index) => {
    const other = right[index]
    return (
      item.id === other.id &&
      item.amount === other.amount &&
      item.date === other.date &&
      item.note === other.note &&
      item.eventType === other.eventType &&
      item.direction === other.direction
    )
  })
}

export function arePaymentsEqual(left: LocalUpcomingPayment[], right: LocalUpcomingPayment[]) {
  if (left.length !== right.length) return false
  return left.every((item, index) => {
    const other = right[index]
    return (
      item.id === other.id &&
      item.name === other.name &&
      item.amount === other.amount &&
      item.dueDate === other.dueDate &&
      item.status === other.status &&
      item.ownerName === other.ownerName &&
      item.expectedFromAssetId === other.expectedFromAssetId
    )
  })
}

export function getTimelineGroupKey(record: FinancialRecordItem): TimelineGroupKey {
  if (record.sourceType === 'upcoming_payment') return 'upcoming'
  if (record.date === TODAY) return 'today'
  if (isInCurrentWeek(record.date)) return 'week'
  if (isSameMonthAsToday(record.date)) return 'month'
  return 'older'
}

export function getTimelineGroupOrder(key: TimelineGroupKey) {
  return ['upcoming', 'today', 'week', 'month', 'older'].indexOf(key)
}

export function getTimelineTypeLabel(record: FinancialRecordItem) {
  if (record.sourceType === 'upcoming_payment') return 'Payment'
  switch (record.eventType) {
    case 'income':
      return 'Income'
    case 'expense':
      return 'Expense'
    case 'transfer':
      return 'Transfer'
    case 'payment_paid':
      return 'Payment'
    case 'goal_contribution':
      return 'Goal'
    case 'debt_update':
      return 'Debt'
    case 'asset_purchase':
      return 'Asset purchase'
    case 'asset_sale':
      return 'Asset sale'
    case 'adjustment':
      return 'Adjustment'
    default:
      return 'Other'
  }
}

/**
 * Compact type label for the minimal timeline row (mockup style): "Money in" /
 * "Money out" for the common inflow/outflow events, and the raw record type
 * (e.g. `asset_sale`, `Revaluation`) for the rest. Upcoming payments read as
 * "Planned".
 */
export function getTimelineRowTypeLabel(record: FinancialRecordItem) {
  if (record.sourceType === 'upcoming_payment') return 'Planned'
  switch (record.eventType) {
    case 'income':
      return 'Money in'
    case 'expense':
    case 'payment_paid':
      return 'Money out'
    case 'transfer':
      return 'Transfer'
    case 'goal_contribution':
      return 'Goal'
    case 'debt_update':
      return 'Debt'
    case 'asset_purchase':
      return 'asset_purchase'
    case 'asset_sale':
      return 'asset_sale'
    case 'adjustment':
      return 'Revaluation'
    default:
      return 'Other'
  }
}

/** Render an ISO date (`2026-07-10`) as the mockup's `D/M/YYYY` (`10/7/2026`). */
export function formatTimelineRowDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

export function getStatusLabel(status: RecordStatus) {
  switch (status) {
    case 'unpaid':
      return 'Chưa xử lý'
    case 'paid':
      return 'Đã trả'
    case 'overdue':
      return 'Quá hạn'
    case 'recorded':
      return 'Đã ghi nhận'
    case 'pending_confirmation':
      return 'Chờ xác nhận'
    case 'postponed':
      return 'Đã dời lại'
  }
}

export function getStatusTone(status: RecordStatus) {
  if (status === 'overdue') {
    return 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))] border-none'
  }
  if (status === 'pending_confirmation' || status === 'postponed') {
    return 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] border-none'
  }
  if (status === 'recorded' || status === 'paid') {
    return 'bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))] border-none'
  }
  return 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))] border-none'
}

export function getAttentionTone(level: AttentionLevel) {
  if (level === 'urgent') {
    return 'bg-[hsla(var(--status-red),0.08)] text-[hsl(var(--status-red))] border-none'
  }
  if (level === 'important') {
    return 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] border-none'
  }
  return 'bg-secondary text-muted-foreground border-none'
}

export function formatRecordAmount(record: FinancialRecordItem, formatVndShort: (value: number) => string) {
  const amount = Math.abs(record.amount)
  const value = formatVndShort(amount)
  if (record.direction === 'inflow') return `+${value}`
  if (record.direction === 'outflow') return `-${value}`
  return value
}

export function getRecordAmountTone(record: FinancialRecordItem) {
  // Inflow / neutral records (income, asset sale, revaluation) read green;
  // money out reads orange — matching the timeline row's arrow colors.
  if (record.direction === 'outflow') return 'text-[hsl(var(--status-orange))]'
  if (record.sourceType === 'upcoming_payment') return 'text-foreground'
  return 'text-[hsl(var(--status-green))]'
}

export function getTimelineGroupLabel(key: TimelineGroupKey) {
  switch (key) {
    case 'upcoming':
      return 'Sắp tới'
    case 'today':
      return 'Hôm nay'
    case 'week':
      return 'Tuần này'
    case 'month':
      return 'Tháng này'
    case 'older':
      return 'Cũ hơn'
  }
}

export function getUpcomingDescription(record: FinancialRecordItem) {
  const days = differenceInDays(TODAY, record.date)
  if (record.status === 'overdue') {
    return `Đến hạn ${record.displayDate} · đang cần xem lại`
  }
  if (days === 0) return `Đến hạn hôm nay · ${record.displayDate}`
  return `Đến hạn ${record.displayDate} · còn ${days} ngày`
}

export function isQuickActualAction(
  action: QuickAction | null,
): action is Exclude<QuickAction, 'upcoming' | 'debt_borrow'> {
  return action !== null && action !== 'upcoming' && action !== 'debt_borrow'
}

export function getQuickActionFromEventType(eventType: RecordType): Exclude<QuickAction, 'upcoming'> {
  if (eventType === 'income') return 'income'
  if (eventType === 'transfer') return 'transfer'
  if (eventType === 'goal_contribution') return 'goal_contribution'
  if (eventType === 'payment_paid') return 'payment_paid'
  if (eventType === 'debt_update') return 'expense'
  return 'expense'
}

/**
 * Money-event types that can be edited through the generic events form.
 * Excluded types are system-generated or driven by a dedicated flow that also
 * mutates other state (an `asset_sale` reduces an asset's position; an
 * `asset_update` is a revaluation side-effect of re-pricing an asset; a
 * `debt_update` / `asset_purchase` ties into a debt or purchase flow). Editing
 * those through the plain form would desync that state or rewrite their type, so
 * the UI offers Delete (+ redo via the proper flow) instead of Edit.
 * Takes the RAW event type (`MoneyEventItem['type']`, which includes
 * `asset_update`).
 */
const EDITABLE_EVENT_TYPES: ReadonlySet<string> = new Set([
  'expense',
  'income',
  'transfer',
  'goal_contribution',
  'payment_paid',
  'adjustment',
  'other',
])

export function isEditableEventType(type: string): boolean {
  return EDITABLE_EVENT_TYPES.has(type)
}

export function eventRequiresFromAsset(eventType: RecordType) {
  return ['expense', 'transfer', 'payment_paid', 'goal_contribution', 'asset_purchase', 'asset_sale'].includes(eventType)
}

export function eventRequiresToAsset(eventType: RecordType) {
  return ['income', 'transfer', 'asset_purchase', 'asset_sale'].includes(eventType)
}

export function buildUpcomingSchema() {
  return z
    .object({
      name: z.string().trim().min(1, 'Vui lòng nhập tên khoản.'),
      amount: z.string().trim().min(1, 'Vui lòng nhập số tiền dự kiến.'),
      dueDate: z.string().min(1, 'Vui lòng chọn hạn xử lý.'),
      frequency: z.enum(['once', 'weekly', 'monthly', 'quarterly', 'yearly']),
      ownerMemberId: z.string(),
      expectedFromAssetId: z.string(),
      attentionLevel: z.enum(['normal', 'important', 'urgent']),
      isAttentionNeeded: z.boolean(),
      note: z.string(),
      autoCreateNext: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (parseAmountInput(value.amount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'Số tiền cần lớn hơn 0.',
        })
      }
      if (!value.expectedFromAssetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expectedFromAssetId'],
          message: 'Vui lòng chọn ví nguồn.',
        })
      }
      if (value.autoCreateNext && value.frequency === 'once') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['autoCreateNext'],
          message: 'Chỉ bật tự tạo kỳ tiếp theo khi khoản này lặp lại.',
        })
      }
    })
}

export function buildActualSchema() {
  return z
    .object({
      amount: z.string().trim().min(1, 'Vui lòng nhập số tiền.'),
      eventDate: z.string().min(1, 'Vui lòng chọn ngày diễn ra.'),
      eventType: z.enum([
        'expense',
        'income',
        'transfer',
        'asset_purchase',
        'asset_sale',
        'payment_paid',
        'goal_contribution',
        'debt_update',
        'adjustment',
        'other',
      ]),
      category: z.string().trim(),
      direction: z.enum(['inflow', 'outflow', 'neutral']),
      fromAssetId: z.string(),
      toAssetId: z.string(),
      upcomingPaymentId: z.string(),
      financialGoalId: z.string(),
      attentionLevel: z.enum(['normal', 'important', 'urgent']),
      isAttentionNeeded: z.boolean(),
      note: z.string(),
      // Only meaningful for an `asset_update` revaluation edit (the tăng/giảm
      // sign of the diff); ignored by every other quick action.
      revaluationDirection: z.enum(['increase', 'decrease']),
    })
    .superRefine((value, ctx) => {
      if (parseAmountInput(value.amount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'Số tiền cần lớn hơn 0.',
        })
      }
      // Category is required for the types that expose a category picker
      // (expense / income). Transfer / goal_contribution / payment_paid derive
      // their classification and don't show the field, so they're exempt.
      if (
        (value.eventType === 'expense' || value.eventType === 'income') &&
        value.category.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category'],
          message: 'Vui lòng chọn danh mục.',
        })
      }
      if (eventRequiresFromAsset(value.eventType) && !value.fromAssetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromAssetId'],
          message: 'Record này cần chọn asset nguồn.',
        })
      }
      if (eventRequiresToAsset(value.eventType) && !value.toAssetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAssetId'],
          message: 'Record này cần chọn asset đích.',
        })
      }
      if (
        ['transfer', 'asset_purchase', 'asset_sale'].includes(value.eventType) &&
        value.fromAssetId &&
        value.toAssetId &&
        value.fromAssetId === value.toAssetId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAssetId'],
          message: 'Asset nguồn và đích cần khác nhau.',
        })
      }
      if (value.eventType === 'payment_paid' && !value.upcomingPaymentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['upcomingPaymentId'],
          message: 'Cần liên kết với một khoản sắp tới.',
        })
      }
      if (value.eventType === 'goal_contribution' && !value.financialGoalId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['financialGoalId'],
          message: 'Vui lòng nhập mục tiêu.',
        })
      }
    })
}

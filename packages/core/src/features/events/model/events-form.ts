import { z } from 'zod'

import type { MoneyEventItem } from '#/features/events/model/events'
import { createId } from '#/shared/lib/create-id'
import { parseRawMoney } from '#/shared/lib/number-format'

export type AttentionLevel = 'normal' | 'important' | 'urgent'
export type RecordStatus =
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'recorded'
  | 'pending_confirmation'
  | 'postponed'
/**
 * `goal` is gone: money events no longer link to goals at all. A goal is a set
 * of shares of real assets, so its history is the assets' own — there is no
 * class of event that would ever land in such a tab.
 */
/**
 * What the timeline's "Loại" filter can narrow to.
 *
 * `source` / `debt` split the ledger by WHICH BOOK a change touched; the rest
 * split it by what the change WAS. Both live here because the two surfaces ask
 * different questions of the same list — the mobile timeline groups by book,
 * the web timeline by kind — and a record can legitimately match one of each.
 */
export type RecordTab =
  | 'all'
  | 'source'
  | 'debt'
  | 'income'
  | 'expense'
  | 'adjustment'
  | 'asset'
  | 'payment'
export type RecordDirection = 'inflow' | 'outflow' | 'neutral'
export type QuickAction =
  | 'upcoming'
  | 'expense'
  | 'income'
  | 'transfer'
  | 'payment_paid'
  | 'debt_borrow'
export type RecordType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'asset_purchase'
  | 'asset_sale'
  | 'payment_paid'
  | 'debt_update'
  | 'adjustment'
  | 'other'

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
  categoryId: string
  fromAssetId?: string
  fromAssetName?: string
  toAssetId?: string
  toAssetName?: string
  cashflowEventId?: string
  financialGoalId?: string
  note?: string
  // Type-specific fields carried through so an edit can preserve them instead of
  // silently dropping them. `asset_sale` needs fee + sold qty/value; a debt
  // repayment needs its `debtId` so the backend still reduces the right debt.
  feeAmount?: number
  soldQuantity?: number
  soldValue?: number
  debtId?: string
  /** Profile id of whoever recorded it, carried from the API for the timeline to
   *  resolve against the household's members. See `MoneyEventItem.createdById`. */
  createdById?: string
}

/**
 * One row on the `/events` ledger. Every row is a RECORDED money event —
 * expected movements are cashflow events and belong to `/upcoming`.
 */
export type FinancialRecordItem = {
  id: string
  /** Whether this record can be edited in-place (false for system / dedicated-
   *  flow money events — see {@link isEditableEventType}). */
  canEdit?: boolean
  /** Display label for the timeline row. For an upcoming payment it's the
   *  payment name; for a money event it's the note (title was dropped), falling
   *  back to a translated category label when the note is empty. Derived — not a
   *  stored field on the event. */
  title: string
  /** True when `title` fell back to the category label because the record has no
   *  note. A row that draws the category as a subtitle must skip it then — the
   *  same name twice, stacked, reads as a rendering fault, not as detail. */
  titleIsCategory?: boolean
  amount: number
  currency: string
  date: string
  displayDate: string
  status: RecordStatus
  attentionLevel: AttentionLevel
  isAttentionNeeded: boolean
  eventType?: RecordType
  direction?: RecordDirection
  categoryId?: string
  fromAssetId?: string
  fromAssetName?: string
  toAssetId?: string
  toAssetName?: string
  cashflowEventId?: string
  financialGoalId?: string
  debtId?: string
  ownerMemberId?: string
  ownerName?: string
  frequency?: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  note?: string
}

export type TimelineGroupKey = 'upcoming' | 'today' | 'week' | 'month' | 'older'

export type ActualRecordForm = {
  amount: string
  eventDate: string
  eventType: RecordType
  /** Holds the category's ID (`money_event_categories.id`), not its code —
   *  the picker's option values are ids. */
  category: string
  direction: RecordDirection
  fromAssetId: string
  toAssetId: string
  cashflowEventId: string
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
  cashflowEventId: '',
  attentionLevel: 'normal',
  isAttentionNeeded: false,
  note: '',
  revaluationDirection: 'increase',
}

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Re-exported so existing callers keep working. The implementation is shared:
 * `crypto.randomUUID()` throws on Hermes, and this used to call it directly.
 */
export { createId }

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

/**
 * Statuses that mean the money actually moved. Everything else — unpaid,
 * overdue, waiting on a confirmation, postponed — is still only expected, and
 * counting it as thu/chi would report a month that has not happened yet.
 */
const SETTLED_STATUSES: RecordStatus[] = ['recorded', 'paid']

export function hasHappened(record: FinancialRecordItem) {
  return SETTLED_STATUSES.includes(record.status)
}

export type PeriodSummary = {
  totalIncome: number
  totalOutcome: number
  netChange: number
  recordedCount: number
}

/**
 * Thu / chi / ròng for a set of records the user is looking at.
 *
 * The backend `/money-events/summary` endpoint stays the source of truth for a
 * whole month and is used whenever the view is a plain month. This exists for
 * the case that endpoint cannot answer — a person filter narrows the list to
 * one member — where the headline must agree with the rows on screen rather
 * than report a different population.
 *
 * `amount` is signed, so a transfer between two of the household's own assets
 * nets to zero and belongs in neither thu nor chi; `direction` decides the
 * bucket, not the sign.
 */
export function summarizeRecords(records: FinancialRecordItem[]): PeriodSummary {
  let totalIncome = 0
  let totalOutcome = 0
  let recordedCount = 0

  for (const record of records) {
    if (!hasHappened(record)) continue
    recordedCount += 1
    const value = Math.abs(record.amount)
    if (record.direction === 'inflow') totalIncome += value
    else if (record.direction === 'outflow') totalOutcome += value
  }

  return {
    totalIncome,
    totalOutcome,
    netChange: totalIncome - totalOutcome,
    recordedCount,
  }
}

/** One category's share of a month's spending (or income). */
export type CategoryBreakdownSlice = {
  categoryId: string
  /** Translated category label, resolved by the caller from its id. */
  label: string
  /** The household's chosen fill for the category, or null for the default. */
  color: string | null
  /** Glyph key the view resolves to an icon, or null for the fallback. */
  iconKey: string | null
  /** Absolute total in VND — always positive; `direction` carries the sense. */
  total: number
  /** Share of the direction's total, 0–1. Not rounded — the view formats it. */
  share: number
  recordCount: number
}

export type CategoryBreakdown = {
  direction: 'inflow' | 'outflow'
  /** Sum of every slice — the denominator behind each share. */
  total: number
  /** Slices, largest first. */
  slices: CategoryBreakdownSlice[]
}

/**
 * What a month's money was made of, grouped by category.
 *
 * Composition, never a verdict: this says a month's spending was 42% sinh hoạt,
 * and it never says that is too much, compares it to a budget, or names who
 * recorded it (§0.2, §16.4 — the product is not a budgeting or monitoring tool).
 *
 * Only settled records count, for the same reason `summarizeRecords` skips the
 * rest: money that has not moved cannot be part of what a month was made of.
 * `direction` picks the bucket rather than the sign, so a transfer between the
 * household's own wallets — neutral, netting to zero — lands in neither.
 *
 * A record whose category the client cannot resolve is kept under its own id
 * with a null label; the caller decides what to call it. Dropping it would make
 * the slices sum to less than the total the summary strip above already states.
 */
export function summarizeByCategory(
  records: FinancialRecordItem[],
  direction: 'inflow' | 'outflow',
  labelFor: (
    categoryId: string,
  ) => { label: string; color: string | null; iconKey: string | null } | undefined,
): CategoryBreakdown {
  const totals = new Map<string, { total: number; recordCount: number }>()
  let total = 0

  for (const record of records) {
    if (!hasHappened(record)) continue
    if (record.direction !== direction) continue
    const categoryId = record.categoryId
    if (!categoryId) continue
    const value = Math.abs(record.amount)
    if (value === 0) continue
    const current = totals.get(categoryId) ?? { total: 0, recordCount: 0 }
    current.total += value
    current.recordCount += 1
    totals.set(categoryId, current)
    total += value
  }

  const slices = [...totals.entries()]
    .map(([categoryId, entry]) => {
      const visual = labelFor(categoryId)
      return {
        categoryId,
        label: visual?.label ?? '',
        color: visual?.color ?? null,
        iconKey: visual?.iconKey ?? null,
        total: entry.total,
        // Guarded rather than assumed: every slice is > 0 so a zero total means
        // there are no slices at all, but a 0/0 here would print "NaN%".
        share: total > 0 ? entry.total / total : 0,
        recordCount: entry.recordCount,
      }
    })
    // Largest first, then by label so two equal categories keep a stable order
    // instead of swapping places between renders.
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label))

  return { direction, total, slices }
}

/** One member's totals for a month. */
export type MemberBreakdownRow = {
  /** Member id, or null for records nobody in the household is named on. */
  memberId: string | null
  /** The member's name; empty for the unassigned row, which the view names. */
  name: string
  totalIncome: number
  totalOutcome: number
  recordCount: number
}

/**
 * A month's money in and out, per person responsible.
 *
 * This names WHO IS RESPONSIBLE for a record, never who spent it (§0.2, §16.4,
 * and the spec's §2/§3 vocabulary: "người phụ trách", never "ai tiêu"). The
 * distinction is the product's, not a wording preference — a household ledger
 * that reports what each partner spent is the monitoring tool this explicitly
 * is not.
 *
 * So: no net figure, no ranking by who spent more, no share-of-total. Two
 * plain totals per person, in the household's own member order.
 *
 * Records nobody is named on — a system-generated accrual, or one whose creator
 * has left the household — collect under a single `null` row rather than being
 * dropped, so the rows still add up to the month the summary strip states.
 */
export function summarizeByMember(records: FinancialRecordItem[]): MemberBreakdownRow[] {
  const rows = new Map<string | null, MemberBreakdownRow>()

  for (const record of records) {
    if (!hasHappened(record)) continue
    // Only money that actually moved in or out. A transfer between the
    // household's own wallets is neutral and belongs to neither total.
    if (record.direction !== 'inflow' && record.direction !== 'outflow') continue

    const memberId = record.ownerMemberId ?? null
    const current = rows.get(memberId) ?? {
      memberId,
      name: record.ownerName ?? '',
      totalIncome: 0,
      totalOutcome: 0,
      recordCount: 0,
    }
    const value = Math.abs(record.amount)
    if (record.direction === 'inflow') current.totalIncome += value
    else current.totalOutcome += value
    current.recordCount += 1
    rows.set(memberId, current)
  }

  // Named members first, alphabetically; the unassigned row always last — it is
  // the remainder, not a person, so it never sorts among them.
  return [...rows.values()].sort((left, right) => {
    if (left.memberId === null) return 1
    if (right.memberId === null) return -1
    return left.name.localeCompare(right.name)
  })
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

/**
 * Whether a record belongs in the given tab.
 *
 * The `asset` bucket covers a SALE as well as a purchase: a sale is an asset
 * row, and a filter named after assets that silently hides half of them is a
 * trap rather than a narrowing.
 */
export function matchesRecordTab(record: FinancialRecordItem, tab: RecordTab): boolean {
  if (tab === 'all') return true

  const isDebt = Boolean(record.debtId) || record.eventType === 'debt_update'
  switch (tab) {
    case 'source':
      return !isDebt && Boolean(record.fromAssetId || record.toAssetId)
    case 'debt':
      return isDebt
    case 'income':
      return record.eventType === 'income'
    case 'expense':
      return record.eventType === 'expense'
    case 'adjustment':
      return record.eventType === 'adjustment'
    case 'asset':
      return record.eventType === 'asset_purchase' || record.eventType === 'asset_sale'
    case 'payment':
      return record.eventType === 'payment_paid'
    default:
      return true
  }
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
    // `asset_update` (a system-generated revaluation) and
    // `asset_quantity_adjustment` (a corrected holding) aren't form-creatable
    // types; if such an event is ever opened in the form, represent it as the
    // neutral `adjustment` bookkeeping type.
    eventType:
      event.type === 'asset_update' || event.type === 'asset_quantity_adjustment'
        ? 'adjustment'
        : event.type,
    direction: event.direction,
    categoryId: event.categoryId,
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
    // Who recorded it. Carried as the raw profile id — naming the person is the
    // timeline's job, against the member list it already holds.
    createdById: event.createdById,
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


export function getTimelineGroupKey(record: FinancialRecordItem): TimelineGroupKey {
  if (record.date === TODAY) return 'today'
  if (isInCurrentWeek(record.date)) return 'week'
  if (isSameMonthAsToday(record.date)) return 'month'
  return 'older'
}

export function getTimelineGroupOrder(key: TimelineGroupKey) {
  return ['upcoming', 'today', 'week', 'month', 'older'].indexOf(key)
}

export function getTimelineTypeLabel(record: FinancialRecordItem) {
  switch (record.eventType) {
    case 'income':
      return 'Income'
    case 'expense':
      return 'Expense'
    case 'transfer':
      return 'Transfer'
    case 'payment_paid':
      return 'Payment'
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
  switch (record.eventType) {
    case 'income':
      return 'Money in'
    case 'expense':
    case 'payment_paid':
      return 'Money out'
    case 'transfer':
      return 'Transfer'
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
    return 'bg-alert-tint text-alert border-none'
  }
  if (status === 'pending_confirmation' || status === 'postponed') {
    return 'bg-attention-tint text-attention border-none'
  }
  if (status === 'recorded' || status === 'paid') {
    return 'bg-accent-tint text-accent border-none'
  }
  return 'bg-accent-tint text-accent border-none'
}

export function getAttentionTone(level: AttentionLevel) {
  if (level === 'urgent') {
    return 'bg-alert-tint text-alert border-none'
  }
  if (level === 'important') {
    return 'bg-attention-tint text-attention border-none'
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
  if (record.direction === 'outflow') return 'text-attention'
  return 'text-accent'
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


export function isQuickActualAction(
  action: QuickAction | null,
): action is Exclude<QuickAction, 'upcoming' | 'debt_borrow'> {
  return action !== null && action !== 'upcoming' && action !== 'debt_borrow'
}

export function getQuickActionFromEventType(eventType: RecordType): Exclude<QuickAction, 'upcoming'> {
  if (eventType === 'income') return 'income'
  if (eventType === 'transfer') return 'transfer'
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
  'payment_paid',
  'adjustment',
  'other',
])

export function isEditableEventType(type: string): boolean {
  return EDITABLE_EVENT_TYPES.has(type)
}

export function eventRequiresFromAsset(eventType: RecordType) {
  return ['expense', 'transfer', 'payment_paid', 'asset_purchase', 'asset_sale'].includes(eventType)
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
        'debt_update',
        'adjustment',
        'other',
      ]),
      category: z.string().trim(),
      direction: z.enum(['inflow', 'outflow', 'neutral']),
      fromAssetId: z.string(),
      toAssetId: z.string(),
      cashflowEventId: z.string(),
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
      // (expense / income). Transfer / payment_paid derive
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
    })
}

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  Goal,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEvents } from '@/features/events/hooks/use-events'
import type { MoneyEventItem } from '@/features/events/model/events'
import { useMembers } from '@/features/members/hooks/use-members'
import { usePayments } from '@/features/payments/hooks/use-payments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type AttentionLevel = 'normal' | 'important' | 'urgent'
type RecordStatus =
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'recorded'
  | 'pending_confirmation'
  | 'postponed'
type RecordTab = 'all' | 'upcoming' | 'actual' | 'attention'
type RecordDirection = 'inflow' | 'outflow' | 'neutral'
type QuickAction =
  | 'upcoming'
  | 'expense'
  | 'income'
  | 'transfer'
  | 'goal_contribution'
  | 'payment_paid'
  | 'debt_borrow'
type RecordType =
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

type LocalUpcomingPayment = {
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
}

type LocalMoneyEvent = {
  id: string
  title: string
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
}

type FinancialRecordItem = {
  id: string
  sourceType: 'upcoming_payment' | 'money_event'
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

type TimelineGroupKey = 'upcoming' | 'today' | 'week' | 'month' | 'older'

type UpcomingRecordForm = {
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

type ActualRecordForm = {
  title: string
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
}

const TODAY = '2026-07-08'

const upcomingDefaults: UpcomingRecordForm = {
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

const actualDefaults: ActualRecordForm = {
  title: '',
  amount: '',
  eventDate: TODAY,
  eventType: 'expense',
  category: 'other',
  direction: 'outflow',
  fromAssetId: '',
  toAssetId: '',
  upcomingPaymentId: '',
  financialGoalId: '',
  attentionLevel: 'normal',
  isAttentionNeeded: false,
  note: '',
}

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function createId() {
  return crypto.randomUUID()
}

function parseAmountInput(raw: string): number {
  const normalized = raw.trim().replace(/,/g, '.')
  const match = normalized.match(/^([+-]?)(\d+(?:\.\d+)?)\s*([kKmMbB]?)$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const base = Number(match[2])
  const suffix = match[3].toLowerCase()
  const factor =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1
  return sign * base * factor
}

function formatAmountInput(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${Math.round((abs / 1_000_000_000) * 10) / 10}B`
  if (abs >= 1_000_000) return `${Math.round((abs / 1_000_000) * 10) / 10}M`
  if (abs >= 1_000) return `${Math.round((abs / 1_000) * 10) / 10}K`
  return `${abs}`
}

function formatShortDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${shortMonthNames[date.getMonth()]}`
}

function startOfDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`)
}

function differenceInDays(fromIsoDate: string, toIsoDate: string) {
  const from = startOfDay(fromIsoDate).getTime()
  const to = startOfDay(toIsoDate).getTime()
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

function getWeekStart(isoDate: string) {
  const date = startOfDay(isoDate)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function isInCurrentWeek(isoDate: string) {
  const current = startOfDay(TODAY)
  const weekStart = getWeekStart(TODAY)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const candidate = startOfDay(isoDate)
  return candidate >= weekStart && candidate <= current && candidate <= weekEnd
}

function isSameMonthAsToday(isoDate: string) {
  return isoDate.slice(0, 7) === TODAY.slice(0, 7)
}

function isAttentionRecord(record: FinancialRecordItem) {
  return (
    record.isAttentionNeeded ||
    record.attentionLevel === 'important' ||
    record.attentionLevel === 'urgent' ||
    record.status === 'overdue' ||
    record.status === 'pending_confirmation' ||
    record.status === 'postponed'
  )
}

function getDirectionFromEventType(eventType: RecordType): RecordDirection {
  if (eventType === 'income') return 'inflow'
  if (eventType === 'expense' || eventType === 'payment_paid' || eventType === 'debt_update') {
    return 'outflow'
  }
  return 'neutral'
}

function toMoneyEventSeed(event: MoneyEventItem): LocalMoneyEvent {
  return {
    id: createId(),
    title: event.title,
    amount: parseAmountInput(event.amount),
    currency: 'VND',
    date: event.isoDate,
    displayDate: event.date,
    status: 'recorded',
    attentionLevel: event.direction === 'outflow' ? 'important' : 'normal',
    isAttentionNeeded: event.direction === 'outflow' && parseAmountInput(event.amount) <= -5_000_000,
    eventType: event.type === 'goal_contribution' ? 'goal_contribution' : event.type,
    direction: event.direction,
    category: event.category,
    fromAssetId: event.direction !== 'inflow' ? event.assetId : undefined,
    fromAssetName: event.direction !== 'inflow' ? event.assetName : undefined,
    toAssetId: event.direction === 'inflow' ? event.assetId : undefined,
    toAssetName: event.direction === 'inflow' ? event.assetName : undefined,
    note: event.note,
  }
}

function getPaymentAttentionLevel(status: 'important' | 'normal' | 'pending'): AttentionLevel {
  if (status === 'important') return 'important'
  if (status === 'pending') return 'urgent'
  return 'normal'
}

function getPaymentRecordStatus(dueDate: string, status: 'important' | 'normal' | 'pending'): RecordStatus {
  if (differenceInDays(dueDate, TODAY) < 0) return 'overdue'
  if (status === 'pending') return 'pending_confirmation'
  return 'unpaid'
}

function getTimelineGroupKey(record: FinancialRecordItem): TimelineGroupKey {
  if (record.sourceType === 'upcoming_payment') return 'upcoming'
  if (record.date === TODAY) return 'today'
  if (isInCurrentWeek(record.date)) return 'week'
  if (isSameMonthAsToday(record.date)) return 'month'
  return 'older'
}

function getTimelineGroupOrder(key: TimelineGroupKey) {
  return ['upcoming', 'today', 'week', 'month', 'older'].indexOf(key)
}

function getTimelineTypeLabel(record: FinancialRecordItem) {
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

function getStatusLabel(status: RecordStatus) {
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

function getStatusTone(status: RecordStatus) {
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

function getAttentionTone(level: AttentionLevel) {
  if (level === 'urgent') {
    return 'bg-[hsla(var(--status-red),0.08)] text-[hsl(var(--status-red))] border-none'
  }
  if (level === 'important') {
    return 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))] border-none'
  }
  return 'bg-secondary text-muted-foreground border-none'
}

function formatRecordAmount(record: FinancialRecordItem) {
  const amount = Math.abs(record.amount)
  const value = formatVndShort(amount)
  if (record.direction === 'inflow') return `+${value}`
  if (record.direction === 'outflow') return `-${value}`
  return value
}

function getRecordAmountTone(record: FinancialRecordItem) {
  if (record.direction === 'inflow') return 'text-[hsl(var(--status-green))]'
  if (record.direction === 'outflow') return 'text-[hsl(var(--status-red))]'
  if (record.sourceType === 'upcoming_payment') return 'text-foreground'
  return 'text-[hsl(var(--accent))]'
}

function getTimelineGroupLabel(key: TimelineGroupKey) {
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

function getUpcomingDescription(record: FinancialRecordItem) {
  const days = differenceInDays(TODAY, record.date)
  if (record.status === 'overdue') {
    return `Đến hạn ${record.displayDate} · đang cần xem lại`
  }
  if (days === 0) return `Đến hạn hôm nay · ${record.displayDate}`
  return `Đến hạn ${record.displayDate} · còn ${days} ngày`
}

function isQuickActualAction(
  action: QuickAction | null,
): action is Exclude<QuickAction, 'upcoming' | 'debt_borrow'> {
  return action !== null && action !== 'upcoming' && action !== 'debt_borrow'
}

function getQuickActionFromEventType(eventType: RecordType): Exclude<QuickAction, 'upcoming'> {
  if (eventType === 'income') return 'income'
  if (eventType === 'transfer') return 'transfer'
  if (eventType === 'goal_contribution') return 'goal_contribution'
  if (eventType === 'payment_paid') return 'payment_paid'
  if (eventType === 'debt_update') return 'expense'
  return 'expense'
}

function eventRequiresFromAsset(eventType: RecordType) {
  return ['expense', 'transfer', 'payment_paid', 'goal_contribution', 'asset_purchase', 'asset_sale'].includes(eventType)
}

function eventRequiresToAsset(eventType: RecordType) {
  return ['income', 'transfer', 'asset_purchase', 'asset_sale'].includes(eventType)
}

export function EventsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { events: seedEvents } = useEvents()
  const { payments: seedPayments } = usePayments()
  const { assets } = useAssets()
  const { members } = useMembers()

  const [events, setEvents] = useState<LocalMoneyEvent[]>(() => seedEvents.map(toMoneyEventSeed))
  const [payments, setPayments] = useState<LocalUpcomingPayment[]>(() =>
    seedPayments.map((payment, index) => {
      const asset = assets[index % Math.max(assets.length, 1)]
      const owner = members[index % Math.max(members.length, 1)]
      const dueMonth = shortMonthNames.indexOf(payment.due.split(' ')[1] ?? 'Jul') + 1
      const dueDate = `2026-${String(dueMonth > 0 ? dueMonth : 7).padStart(2, '0')}-${String(
        Number(payment.due.split(' ')[0] ?? '10'),
      ).padStart(2, '0')}`
      return {
        id: payment.id,
        name: payment.name,
        amount: parseAmountInput(payment.amount),
        currency: 'VND',
        dueDate,
        status: getPaymentRecordStatus(dueDate, payment.status),
        attentionLevel: getPaymentAttentionLevel(payment.status),
        isAttentionNeeded: payment.status !== 'normal',
        expectedFromAssetId: asset?.id,
        expectedFromAssetName: asset?.name,
        ownerMemberId: owner?.id,
        ownerName: owner?.name,
        frequency: index === 1 ? 'monthly' : 'once',
        note:
          payment.status === 'pending'
            ? 'Cần cả hai cùng chốt lại số tiền trước khi xử lý.'
            : 'Khoản đã lên kế hoạch để chủ động chuẩn bị tiền.',
        autoCreateNext: index === 1,
      }
    }),
  )
  const [tab, setTab] = useState<RecordTab>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [markPaidPaymentId, setMarkPaidPaymentId] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const assetOptions = useMemo(
    () => assets.map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  const memberOptions = useMemo(
    () => members.filter((member) => member.status === 'active').map((member) => ({
      value: member.id,
      label: member.name,
    })),
    [members],
  )

  const upcomingSchema = z
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
      if (value.autoCreateNext && value.frequency === 'once') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['autoCreateNext'],
          message: 'Chỉ bật tự tạo kỳ tiếp theo khi khoản này lặp lại.',
        })
      }
    })

  const actualSchema = z
    .object({
      title: z.string().trim().min(1, 'Vui lòng nhập tên sự kiện.'),
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
    })
    .superRefine((value, ctx) => {
      if (parseAmountInput(value.amount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'Số tiền cần lớn hơn 0.',
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

  const {
    control: upcomingControl,
    register: registerUpcoming,
    reset: resetUpcoming,
    handleSubmit: handleUpcomingSubmit,
    formState: { errors: upcomingErrors, isValid: isUpcomingValid },
  } = useForm<UpcomingRecordForm>({
    resolver: zodResolver(upcomingSchema),
    defaultValues: upcomingDefaults,
    mode: 'onChange',
  })

  const {
    control: actualControl,
    register: registerActual,
    reset: resetActual,
    handleSubmit: handleActualSubmit,
    formState: { errors: actualErrors, isValid: isActualValid },
  } = useForm<ActualRecordForm>({
    resolver: zodResolver(actualSchema),
    defaultValues: actualDefaults,
    mode: 'onChange',
  })

  const timelineRecords = useMemo<FinancialRecordItem[]>(() => {
    const activeUpcoming = payments
      .filter((payment) => payment.status !== 'paid')
      .map((payment) => ({
        id: payment.id,
        sourceType: 'upcoming_payment' as const,
        title: payment.name,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.dueDate,
        displayDate: formatShortDate(payment.dueDate),
        status: payment.status,
        attentionLevel: payment.attentionLevel,
        isAttentionNeeded: payment.isAttentionNeeded,
        ownerMemberId: payment.ownerMemberId,
        ownerName: payment.ownerName,
        fromAssetId: payment.expectedFromAssetId,
        fromAssetName: payment.expectedFromAssetName,
        frequency: payment.frequency,
        note: payment.note,
      }))

    const actualRecords = events.map((event) => ({
      id: event.id,
      sourceType: 'money_event' as const,
      title: event.title,
      amount: Math.abs(event.amount),
      currency: event.currency,
      date: event.date,
      displayDate: event.displayDate,
      status: event.status,
      attentionLevel: event.attentionLevel,
      isAttentionNeeded: event.isAttentionNeeded,
      eventType: event.eventType,
      direction: event.direction,
      category: event.category,
      fromAssetId: event.fromAssetId,
      fromAssetName: event.fromAssetName,
      toAssetId: event.toAssetId,
      toAssetName: event.toAssetName,
      upcomingPaymentId: event.upcomingPaymentId,
      financialGoalId: event.financialGoalId,
      note: event.note,
    }))

    const records = [...activeUpcoming, ...actualRecords]
    return records.sort((left, right) => {
      const leftGroup = getTimelineGroupKey(left)
      const rightGroup = getTimelineGroupKey(right)
      if (leftGroup !== rightGroup) {
        return getTimelineGroupOrder(leftGroup) - getTimelineGroupOrder(rightGroup)
      }
      if (left.sourceType === 'upcoming_payment' && right.sourceType === 'upcoming_payment') {
        return left.date.localeCompare(right.date)
      }
      return right.date.localeCompare(left.date)
    })
  }, [events, payments])

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return timelineRecords.filter((record) => {
      if (tab === 'upcoming' && record.sourceType !== 'upcoming_payment') return false
      if (tab === 'actual' && record.sourceType !== 'money_event') return false
      if (tab === 'attention' && !isAttentionRecord(record)) return false
      if (!needle) return true
      return (
        record.title.toLowerCase().includes(needle) ||
        record.note?.toLowerCase().includes(needle) ||
        record.ownerName?.toLowerCase().includes(needle) ||
        record.fromAssetName?.toLowerCase().includes(needle) ||
        record.toAssetName?.toLowerCase().includes(needle)
      )
    })
  }, [query, tab, timelineRecords])

  const groupedRecords = useMemo(() => {
    const groups = new Map<TimelineGroupKey, FinancialRecordItem[]>()
    for (const record of filteredRecords) {
      const key = getTimelineGroupKey(record)
      const current = groups.get(key) ?? []
      current.push(record)
      groups.set(key, current)
    }
    return (Array.from(groups.entries()) as [TimelineGroupKey, FinancialRecordItem[]][])
      .sort((a, b) => getTimelineGroupOrder(a[0]) - getTimelineGroupOrder(b[0]))
  }, [filteredRecords])

  const summary = useMemo(() => {
    const upcomingIn7Days = payments.filter((payment) => {
      if (payment.status === 'paid') return false
      const days = differenceInDays(TODAY, payment.dueDate)
      return days >= 0 && days <= 7
    })
    const recordedThisMonth = events.filter((event) => isSameMonthAsToday(event.date))
    const attentionCount = timelineRecords.filter(isAttentionRecord).length
    const totalIncome = recordedThisMonth.reduce((total, event) => {
      if (event.direction !== 'inflow') return total
      return total + Math.abs(event.amount)
    }, 0)
    const totalOutcome = recordedThisMonth.reduce((total, event) => {
      if (event.direction !== 'outflow') return total
      return total + Math.abs(event.amount)
    }, 0)
    const netChange = recordedThisMonth.reduce((total, event) => {
      if (event.direction === 'inflow') return total + Math.abs(event.amount)
      if (event.direction === 'outflow') return total - Math.abs(event.amount)
      return total
    }, 0)
    return {
      upcomingIn7DaysCount: upcomingIn7Days.length,
      upcomingIn7DaysAmount: upcomingIn7Days.reduce((sum, payment) => sum + payment.amount, 0),
      recordedThisMonth: recordedThisMonth.length,
      attentionCount,
      totalIncome,
      totalOutcome,
      netChange,
    }
  }, [events, payments, timelineRecords])

  useEffect(() => {
    if (!formOpen) return

    if (quickAction === 'upcoming') {
      if (editingPaymentId) {
        const payment = payments.find((item) => item.id === editingPaymentId)
        if (!payment) return
        resetUpcoming({
          name: payment.name,
          amount: formatAmountInput(payment.amount),
          dueDate: payment.dueDate,
          frequency: payment.frequency ?? 'once',
          ownerMemberId: payment.ownerMemberId ?? '',
          expectedFromAssetId: payment.expectedFromAssetId ?? '',
          attentionLevel: payment.attentionLevel,
          isAttentionNeeded: payment.isAttentionNeeded,
          note: payment.note ?? '',
          autoCreateNext: payment.autoCreateNext ?? false,
        })
        return
      }

      resetUpcoming({
        ...upcomingDefaults,
        ownerMemberId: memberOptions[0]?.value ?? '',
        expectedFromAssetId: assetOptions[0]?.value ?? '',
      })
      return
    }

    if (!isQuickActualAction(quickAction)) return

    if (editingEventId) {
      const event = events.find((item) => item.id === editingEventId)
      if (!event) return
      resetActual({
        title: event.title,
        amount: formatAmountInput(Math.abs(event.amount)),
        eventDate: event.date,
        eventType: event.eventType,
        category: event.category,
        direction: event.direction,
        fromAssetId: event.fromAssetId ?? '',
        toAssetId: event.toAssetId ?? '',
        upcomingPaymentId: event.upcomingPaymentId ?? '',
        financialGoalId: event.financialGoalId ?? '',
        attentionLevel: event.attentionLevel,
        isAttentionNeeded: event.isAttentionNeeded,
        note: event.note ?? '',
      })
      return
    }

    if (markPaidPaymentId) {
      const payment = payments.find((item) => item.id === markPaidPaymentId)
      if (!payment) return
      resetActual({
        ...actualDefaults,
        title: `Đã trả ${payment.name}`,
        amount: formatAmountInput(payment.amount),
        eventDate: TODAY,
        eventType: 'payment_paid',
        direction: 'outflow',
        fromAssetId: payment.expectedFromAssetId ?? '',
        upcomingPaymentId: payment.id,
        attentionLevel: payment.attentionLevel,
        isAttentionNeeded: payment.isAttentionNeeded,
        note: payment.note ?? '',
      })
      return
    }

    resetActual({
      ...actualDefaults,
      fromAssetId: assetOptions[0]?.value ?? '',
    })
  }, [
    assetOptions,
    editingEventId,
    editingPaymentId,
    events,
    formOpen,
    markPaidPaymentId,
    memberOptions,
    payments,
    quickAction,
    resetActual,
    resetUpcoming,
  ])

  function openCreate() {
    setEditingPaymentId(null)
    setEditingEventId(null)
    setMarkPaidPaymentId(null)
    setQuickAction(null)
    setShowMoreDetails(false)
    setFormOpen(true)
  }

  function openBorrowMoney() {
    handleFormOpenChange(false)
    navigate('/debts', { state: { openCreate: true } })
  }

  function openEditPayment(paymentId: string) {
    setEditingPaymentId(paymentId)
    setEditingEventId(null)
    setMarkPaidPaymentId(null)
    setQuickAction('upcoming')
    setShowMoreDetails(true)
    setFormOpen(true)
  }

  function openEditEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId)
    setEditingEventId(eventId)
    setEditingPaymentId(null)
    setMarkPaidPaymentId(null)
    setQuickAction(event ? getQuickActionFromEventType(event.eventType) : 'expense')
    setShowMoreDetails(true)
    setFormOpen(true)
  }

  function openMarkPaid(paymentId: string) {
    setMarkPaidPaymentId(paymentId)
    setEditingPaymentId(null)
    setEditingEventId(null)
    setQuickAction('payment_paid')
    setShowMoreDetails(false)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setQuickAction(null)
      setShowMoreDetails(false)
      setEditingPaymentId(null)
      setEditingEventId(null)
      setMarkPaidPaymentId(null)
    }
  }

  function onSubmitUpcoming(values: UpcomingRecordForm) {
    const asset = assets.find((item) => item.id === values.expectedFromAssetId)
    const member = members.find((item) => item.id === values.ownerMemberId)
    const nextPayment: LocalUpcomingPayment = {
      id: editingPaymentId ?? createId(),
      name: values.name.trim(),
      amount: Math.abs(parseAmountInput(values.amount)),
      currency: 'VND',
      dueDate: values.dueDate,
      status: differenceInDays(values.dueDate, TODAY) < 0 ? 'overdue' : 'unpaid',
      attentionLevel: values.attentionLevel,
      isAttentionNeeded: values.isAttentionNeeded,
      expectedFromAssetId: values.expectedFromAssetId || undefined,
      expectedFromAssetName: asset?.name,
      ownerMemberId: values.ownerMemberId || undefined,
      ownerName: member?.name,
      frequency: values.frequency,
      note: values.note.trim() || 'Khoản sắp tới chưa làm thay đổi số dư.',
      autoCreateNext: values.frequency === 'once' ? false : values.autoCreateNext,
    }

    if (editingPaymentId) {
      setPayments((current) =>
        current.map((payment) => (payment.id === editingPaymentId ? nextPayment : payment)),
      )
    } else {
      setPayments((current) => [nextPayment, ...current])
    }
    handleFormOpenChange(false)
  }

  function onSubmitActual(values: ActualRecordForm) {
    const resolvedAction: Exclude<QuickAction, 'upcoming'> =
      quickAction && quickAction !== 'upcoming' ? quickAction : 'expense'
    const resolvedEventType: RecordType =
      resolvedAction === 'expense'
        ? 'expense'
        : resolvedAction === 'income'
          ? 'income'
          : resolvedAction === 'transfer'
            ? 'transfer'
            : resolvedAction === 'goal_contribution'
              ? 'goal_contribution'
              : 'payment_paid'
    const amount = Math.abs(parseAmountInput(values.amount))
    const fromAsset = assets.find((item) => item.id === values.fromAssetId)
    const toAsset = assets.find((item) => item.id === values.toAssetId)
    const relatedPayment = markPaidPaymentId
      ? payments.find((item) => item.id === markPaidPaymentId)
      : undefined
    const autoTitle =
      resolvedAction === 'transfer' && fromAsset && toAsset
        ? `Chuyển từ ${fromAsset.name} sang ${toAsset.name}`
        : resolvedAction === 'goal_contribution'
          ? `Góp vào ${values.financialGoalId.trim() || 'mục tiêu chung'}`
          : resolvedAction === 'payment_paid'
            ? `Đã trả ${relatedPayment?.name ?? ''}`.trim()
            : values.title.trim()
    const nextEvent: LocalMoneyEvent = {
      id: editingEventId ?? createId(),
      title: autoTitle,
      amount,
      currency: 'VND',
      date: values.eventDate,
      displayDate: formatShortDate(values.eventDate),
      status: 'recorded',
      attentionLevel: values.attentionLevel,
      isAttentionNeeded: values.isAttentionNeeded,
      eventType: resolvedEventType,
      direction: getDirectionFromEventType(resolvedEventType),
      category: values.category.trim() || 'other',
      fromAssetId: values.fromAssetId || undefined,
      fromAssetName: fromAsset?.name,
      toAssetId: values.toAssetId || undefined,
      toAssetName: toAsset?.name,
      upcomingPaymentId: values.upcomingPaymentId || undefined,
      financialGoalId: values.financialGoalId || undefined,
      note: values.note.trim() || t('common.noAdditionalNote'),
    }

    if (markPaidPaymentId) {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === markPaidPaymentId ? { ...payment, status: 'paid' } : payment,
        ),
      )
      setEvents((current) => [nextEvent, ...current])
      handleFormOpenChange(false)
      return
    }

    if (editingEventId) {
      setEvents((current) =>
        current.map((event) => (event.id === editingEventId ? nextEvent : event)),
      )
    } else {
      setEvents((current) => [nextEvent, ...current])
    }
    handleFormOpenChange(false)
  }

  function togglePaymentAttention(paymentId: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              isAttentionNeeded: !payment.isAttentionNeeded,
              attentionLevel:
                payment.isAttentionNeeded && payment.attentionLevel !== 'urgent'
                  ? 'normal'
                  : 'important',
            }
          : payment,
      ),
    )
  }

  function toggleEventAttention(eventId: string) {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              isAttentionNeeded: !event.isAttentionNeeded,
              attentionLevel:
                event.isAttentionNeeded && event.attentionLevel !== 'urgent'
                  ? 'normal'
                  : 'important',
            }
          : event,
      ),
    )
  }

  function postponePayment(paymentId: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              dueDate: new Date(startOfDay(payment.dueDate).setDate(startOfDay(payment.dueDate).getDate() + 7))
                .toISOString()
                .slice(0, 10),
              status: 'postponed',
              attentionLevel: payment.attentionLevel === 'normal' ? 'important' : payment.attentionLevel,
            }
          : payment,
      ),
    )
  }

  function duplicateEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId)
    if (!event) return
    setEvents((current) => [
      {
        ...event,
        id: createId(),
        title: `${event.title} (copy)`,
      },
      ...current,
    ])
  }

  function deleteEvent(eventId: string) {
    setEvents((current) => current.filter((event) => event.id !== eventId))
  }

  const deletingEvent = deleteEventId ? events.find((event) => event.id === deleteEventId) : undefined
  const selectedUpcomingForMarkPaid = markPaidPaymentId
    ? payments.find((payment) => payment.id === markPaidPaymentId)
    : undefined

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Money Timeline"
        title="Financial Records"
        description="Theo dõi khoản sắp tới và các sự kiện tài chính đáng ghi nhận của nhà mình."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Tạo record
          </Button>
        }
      />

      <SummaryStrip>
        <SummaryTile
          label="Sắp tới 7 ngày"
          value={`${summary.upcomingIn7DaysCount} khoản · ${formatVndShort(summary.upcomingIn7DaysAmount)}`}
          dotColor="hsl(var(--status-blue))"
        />
        <SummaryTile
          label="Đã ghi nhận tháng này"
          value={`${summary.recordedThisMonth} record`}
          dotColor="hsl(var(--status-green))"
        />
        <SummaryTile
          label="Tổng thu tháng này"
          value={`+${formatVndShort(summary.totalIncome)}`}
          dotColor="hsl(var(--status-green))"
        />
        <SummaryTile
          label="Tổng chi tháng này"
          value={`-${formatVndShort(summary.totalOutcome)}`}
          dotColor="hsl(var(--status-red))"
        />
        <SummaryTile
          label="Cần chú ý"
          value={`${summary.attentionCount} mục`}
          dotColor="hsl(var(--status-orange))"
        />
        <SummaryTile
          label="Net change tháng này"
          value={`${summary.netChange >= 0 ? '+' : '-'}${formatVndShort(Math.abs(summary.netChange))}`}
          inverted
        />
      </SummaryStrip>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Timeline chung cho planned và actual records</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">Financial records</h2>
          </div>
          <div className="relative w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, ghi chú hoặc asset..."
              className="pl-11"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            ['all', 'Tất cả'],
            ['upcoming', 'Sắp tới'],
            ['actual', 'Đã diễn ra'],
            ['attention', 'Cần chú ý'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                tab === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-7">
          {groupedRecords.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-[hsl(var(--muted))]/40 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có record phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            groupedRecords.map(([groupKey, records]) => (
              <section key={groupKey}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[hsl(var(--accent))]" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {getTimelineGroupLabel(groupKey)}
                  </h3>
                </div>

                <div className="space-y-3">
                  {records.map((record) => (
                    <article
                      key={`${record.sourceType}-${record.id}`}
                      className="rounded-[28px] border border-border/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-foreground">{record.title}</p>
                            <Badge className={record.sourceType === 'upcoming_payment' ? 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))] border-none' : 'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))] border-none'}>
                              {record.sourceType === 'upcoming_payment' ? 'Planned' : 'Actual'}
                            </Badge>
                            <Badge variant="outline">{getTimelineTypeLabel(record)}</Badge>
                            <Badge className={getStatusTone(record.status)}>{getStatusLabel(record.status)}</Badge>
                            <Badge className={getAttentionTone(record.attentionLevel)}>
                              {record.attentionLevel === 'normal' ? 'Bình thường' : record.attentionLevel === 'important' ? 'Cần chú ý' : 'Ưu tiên cao'}
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {record.sourceType === 'upcoming_payment'
                              ? getUpcomingDescription(record)
                              : `${record.displayDate} · ${
                                  record.direction === 'inflow'
                                    ? 'Ghi nhận tiền vào'
                                    : record.direction === 'outflow'
                                      ? 'Ghi nhận tiền ra'
                                      : 'Record trung tính, dùng để giải thích snapshot'
                                }`}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {record.ownerName ? <Badge variant="secondary">Phụ trách: {record.ownerName}</Badge> : null}
                            {record.frequency ? <Badge variant="secondary">Lặp: {record.frequency}</Badge> : null}
                            {record.fromAssetName ? <Badge variant="secondary">Từ {record.fromAssetName}</Badge> : null}
                            {record.toAssetName ? <Badge variant="secondary">Đến {record.toAssetName}</Badge> : null}
                            {record.category ? <Badge variant="secondary">#{record.category}</Badge> : null}
                          </div>

                          {record.note ? (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{record.note}</p>
                          ) : null}
                        </div>

                        <div className="lg:ml-6 lg:w-[220px]">
                          <p className={cn('money-number text-2xl font-semibold lg:text-right', getRecordAmountTone(record))}>
                            {formatRecordAmount(record)}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                            {record.sourceType === 'upcoming_payment' ? (
                              <>
                                <Button size="sm" onClick={() => openMarkPaid(record.id)}>
                                  Đã trả
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="secondary">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => postponePayment(record.id)}>
                                      Dời ngày
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openEditPayment(record.id)}>
                                      Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => togglePaymentAttention(record.id)}>
                                      Cần chú ý
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => openEditEvent(record.id)}>
                                  <Pencil className="mr-2 size-4" />
                                  Sửa
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => duplicateEvent(record.id)}>
                                      Nhân bản
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => toggleEventAttention(record.id)}>
                                      Cần chú ý
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                                      onSelect={() => setDeleteEventId(record.id)}
                                    >
                                      Xóa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </Card>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent className="sm:max-w-3xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {quickAction === 'payment_paid' ? 'Đánh dấu đã trả' : 'Cập nhật nhanh'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {quickAction === 'payment_paid'
                ? 'Ghi nhận khoản đã trả để timeline của nhà mình rõ hơn.'
                : 'Thêm khoản sắp tới hoặc ghi nhận một thay đổi đáng chú ý của nhà mình.'}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-5">
            {!quickAction ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['upcoming', 'Khoản sắp tới', 'Có khoản cần chuẩn bị', CalendarClock],
                  ['expense', 'Đã chi / đã trả', 'Ghi nhận một khoản tiền ra', BanknoteArrowDown],
                  ['income', 'Nhận tiền', 'Lương, thưởng hoặc khoản tiền vào', BanknoteArrowUp],
                  ['transfer', 'Chuyển tiền', 'Chuyển giữa tài khoản/quỹ', ArrowLeftRight],
                  ['debt_borrow', 'Vay tiền', 'Tạo khoản vay và theo dõi trong mục đang nợ', Landmark],
                  ['goal_contribution', 'Góp mục tiêu', 'Thêm tiền vào mục tiêu chung', Goal],
                ] as const).map(([action, title, subtitle, Icon]) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      if (action === 'debt_borrow') {
                        openBorrowMoney()
                        return
                      }
                      setQuickAction(action)
                      setShowMoreDetails(false)
                    }}
                    className="rounded-3xl border border-border bg-card p-4 text-left transition hover:bg-[hsl(var(--muted))]/40"
                  >
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </div>
                    <p className="mt-4 text-base font-semibold tracking-[-0.02em]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
                  </button>
                ))}
              </div>
            ) : quickAction === 'upcoming' ? (
              <form className="space-y-4" onSubmit={handleUpcomingSubmit(onSubmitUpcoming)} noValidate>
                <div className="rounded-3xl bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-muted-foreground">
                  Khoản sắp tới chưa làm thay đổi số dư. Số dư chỉ thay đổi khi bạn đánh dấu đã trả.
                </div>

                <p className="text-lg font-semibold tracking-[-0.02em]">Có khoản gì sắp tới?</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tên khoản" error={upcomingErrors.name?.message}>
                    <Input placeholder="Ví dụ: Tiền nhà tháng 8" {...registerUpcoming('name')} />
                  </FormField>
                  <FormField label="Số tiền dự kiến" error={upcomingErrors.amount?.message}>
                    <Input placeholder="Ví dụ: 8M" {...registerUpcoming('amount')} />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Hạn trả" error={upcomingErrors.dueDate?.message}>
                    <Controller
                      control={upcomingControl}
                      name="dueDate"
                      render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </FormField>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMoreDetails((current) => !current)}
                  className="text-sm font-semibold text-[hsl(var(--accent))]"
                >
                  {showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}
                </button>

                {showMoreDetails ? (
                  <div className="grid gap-4 rounded-3xl border border-border/70 bg-[hsl(var(--muted))]/40 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Lặp lại" error={upcomingErrors.frequency?.message}>
                        <Controller
                          control={upcomingControl}
                          name="frequency"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn tần suất" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="once">Một lần</SelectItem>
                                <SelectItem value="weekly">Hàng tuần</SelectItem>
                                <SelectItem value="monthly">Hàng tháng</SelectItem>
                                <SelectItem value="quarterly">Hàng quý</SelectItem>
                                <SelectItem value="yearly">Hàng năm</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="Người phụ trách">
                        <Controller
                          control={upcomingControl}
                          name="ownerMemberId"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Không bắt buộc" />
                              </SelectTrigger>
                              <SelectContent>
                                {memberOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Nguồn tiền dự kiến">
                        <Controller
                          control={upcomingControl}
                          name="expectedFromAssetId"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Không bắt buộc" />
                              </SelectTrigger>
                              <SelectContent>
                                {assetOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="Cần chú ý">
                        <div className="flex h-11 items-center justify-between rounded-2xl border border-border bg-card px-4">
                          <span className="text-sm text-muted-foreground">Đánh dấu để cùng xem lại</span>
                          <Controller
                            control={upcomingControl}
                            name="isAttentionNeeded"
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                      </FormField>
                    </div>
                    <FormField label="Ghi chú">
                      <Textarea rows={4} placeholder="Ví dụ: Nên chuẩn bị tiền từ đầu tuần." {...registerUpcoming('note')} />
                    </FormField>
                  </div>
                ) : null}

                <ResponsiveDialogFooter className="border-t border-border/70 pt-4">
                  <Button type="button" variant="secondary" onClick={() => handleFormOpenChange(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={!isUpcomingValid}>
                    Lưu khoản sắp tới
                  </Button>
                </ResponsiveDialogFooter>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleActualSubmit(onSubmitActual)} noValidate>
                <p className="text-lg font-semibold tracking-[-0.02em]">
                  {quickAction === 'expense'
                    ? 'Bạn vừa chi khoản gì?'
                    : quickAction === 'income'
                      ? 'Bạn nhận khoản gì?'
                      : quickAction === 'transfer'
                        ? 'Chuyển tiền giữa các nơi'
                        : quickAction === 'goal_contribution'
                          ? 'Góp thêm vào mục tiêu nào?'
                          : 'Đánh dấu đã trả'}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Số tiền" error={actualErrors.amount?.message}>
                    <Input placeholder="Ví dụ: 8M" {...registerActual('amount')} />
                  </FormField>
                  <FormField label={quickAction === 'payment_paid' ? 'Ngày trả' : 'Ngày'} error={actualErrors.eventDate?.message}>
                    <Controller
                      control={actualControl}
                      name="eventDate"
                      render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </FormField>
                </div>

                {quickAction !== 'transfer' && quickAction !== 'goal_contribution' && quickAction !== 'payment_paid' ? (
                  <FormField label="Tên khoản" error={actualErrors.title?.message}>
                    <Input
                      placeholder={quickAction === 'income' ? 'Ví dụ: Lương tháng 7' : 'Ví dụ: Tiền nhà tháng 7'}
                      {...registerActual('title')}
                    />
                  </FormField>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  {(quickAction === 'expense' || quickAction === 'payment_paid' || quickAction === 'transfer' || quickAction === 'goal_contribution') ? (
                    <FormField
                      label={
                        quickAction === 'transfer'
                          ? 'Từ đâu?'
                          : quickAction === 'goal_contribution'
                            ? 'Lấy từ đâu?'
                            : 'Trả từ đâu?'
                      }
                      error={actualErrors.fromAssetId?.message}
                    >
                      <Controller
                        control={actualControl}
                        name="fromAssetId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nơi tiền đi ra" />
                            </SelectTrigger>
                            <SelectContent>
                              {assetOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                  ) : null}

                  {(quickAction === 'income' || quickAction === 'transfer') ? (
                    <FormField
                      label={quickAction === 'income' ? 'Nhận vào đâu?' : 'Đến đâu?'}
                      error={actualErrors.toAssetId?.message}
                    >
                      <Controller
                        control={actualControl}
                        name="toAssetId"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nơi tiền đi vào" />
                            </SelectTrigger>
                            <SelectContent>
                              {assetOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                  ) : null}

                  {quickAction === 'goal_contribution' ? (
                    <FormField label="Mục tiêu" error={actualErrors.financialGoalId?.message}>
                      <Input placeholder="Ví dụ: Quỹ dự phòng" {...registerActual('financialGoalId')} />
                    </FormField>
                  ) : null}
                </div>

                {quickAction === 'payment_paid' && selectedUpcomingForMarkPaid ? (
                  <div className="rounded-3xl bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-muted-foreground">
                    Đang ghi nhận khoản đã trả cho "{selectedUpcomingForMarkPaid.name}".
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowMoreDetails((current) => !current)}
                  className="text-sm font-semibold text-[hsl(var(--accent))]"
                >
                  {showMoreDetails ? 'Ẩn bớt chi tiết' : 'Thêm chi tiết'}
                </button>

                {showMoreDetails ? (
                  <div className="grid gap-4 rounded-3xl border border-border/70 bg-[hsl(var(--muted))]/40 p-4">
                    {(quickAction === 'expense' || quickAction === 'income') ? (
                      <FormField label="Danh mục">
                        <Input placeholder="Ví dụ: housing, salary, saving" {...registerActual('category')} />
                      </FormField>
                    ) : null}

                    {(quickAction === 'expense' && !markPaidPaymentId) ? (
                      <FormField label="Khoản này có liên quan đến payment sắp tới không?">
                        <Controller
                          control={actualControl}
                          name="upcomingPaymentId"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Không bắt buộc" />
                              </SelectTrigger>
                              <SelectContent>
                                {payments
                                  .filter((payment) => payment.status !== 'paid')
                                  .map((payment) => (
                                    <SelectItem key={payment.id} value={payment.id}>
                                      {payment.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                    ) : null}

                    {quickAction === 'goal_contribution' ? (
                      <FormField label="Đến asset nào">
                        <Controller
                          control={actualControl}
                          name="toAssetId"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Không bắt buộc" />
                              </SelectTrigger>
                              <SelectContent>
                                {assetOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                    ) : null}

                    <FormField label="Cần chú ý">
                      <div className="flex h-11 items-center justify-between rounded-2xl border border-border bg-card px-4">
                        <span className="text-sm text-muted-foreground">Đánh dấu để cùng xem lại</span>
                        <Controller
                          control={actualControl}
                          name="isAttentionNeeded"
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      </div>
                    </FormField>

                    <FormField label="Ghi chú">
                      <Textarea rows={4} placeholder="Thêm bối cảnh để cả hai cùng hiểu record này." {...registerActual('note')} />
                    </FormField>
                  </div>
                ) : null}

                <ResponsiveDialogFooter className="border-t border-border/70 pt-4">
                  <Button type="button" variant="secondary" onClick={() => handleFormOpenChange(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={!isActualValid}>
                    {quickAction === 'expense' || quickAction === 'payment_paid'
                      ? 'Lưu khoản đã chi'
                      : quickAction === 'income'
                        ? 'Lưu khoản tiền vào'
                        : quickAction === 'transfer'
                          ? 'Lưu chuyển tiền'
                          : 'Lưu đóng góp'}
                  </Button>
                </ResponsiveDialogFooter>
              </form>
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
        title="Xóa record này?"
        description={`Bạn có chắc muốn xóa “${deletingEvent?.title ?? ''}”? Hành động này không thể hoàn tác.`}
        onConfirm={() => deleteEventId && deleteEvent(deleteEventId)}
      />
    </div>
  )
}

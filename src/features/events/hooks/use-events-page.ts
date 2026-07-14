import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useAssetSale } from '@/features/assets/hooks/use-asset-sale'
import { useEventCategories } from '@/features/events/hooks/use-event-categories'
import { useEvents } from '@/features/events/hooks/use-events'
import { useEventsSummary } from '@/features/events/hooks/use-events-summary'
import {
  actualDefaults,
  areEventsEqual,
  arePaymentsEqual,
  buildActualSchema,
  buildUpcomingSchema,
  differenceInDays,
  formatAmountInput,
  formatShortDate,
  getDirectionFromEventType,
  getQuickActionFromEventType,
  getTimelineGroupKey,
  getTimelineGroupOrder,
  isAttentionRecord,
  isEditableEventType,
  isQuickActualAction,
  parseAmountInput,
  startOfDay,
  toMoneyEventSeed,
  toUpcomingPaymentSeed,
  TODAY,
  upcomingDefaults,
  type ActualRecordForm,
  type FinancialRecordItem,
  type LocalMoneyEvent,
  type LocalUpcomingPayment,
  type QuickAction,
  type RecordTab,
  type RecordType,
  type TimelineGroupKey,
  type UpcomingRecordForm,
} from '@/features/events/model/events-form'
import { useMembers } from '@/features/members/hooks/use-members'
import { usePayments } from '@/features/payments/hooks/use-payments'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useEventsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { events: seedEvents, isLoading: isEventsLoading, createEvent, updateEvent, deleteEvent: deleteEventMutation } = useEvents()
  const { payments: seedPayments, createPayment, updatePayment, deletePayment } = usePayments()
  const { assets } = useAssets()
  const { members } = useMembers()
  // Thu/chi/net for the current month are the BACKEND's source of truth — read
  // them from the summary endpoint, never re-derive from the event list.
  const { data: eventsSummary, isLoading: isSummaryLoading } = useEventsSummary()
  // Show the timeline skeleton while EITHER the events list or the backend
  // thu/chi/net summary is still loading — both feed the page's main content.
  const isLoading = isEventsLoading || isSummaryLoading
  const { categories } = useEventCategories()
  // Reused for editing an existing asset_sale event through its dedicated dialog
  // (the generic form can't express quantity / fee / receiving wallet).
  const sale = useAssetSale()

  const sourceEvents = useMemo(() => seedEvents.map(toMoneyEventSeed), [seedEvents])
  const sourcePayments = useMemo(
    () => seedPayments.map((payment, index) => toUpcomingPaymentSeed(payment, index, assets, members)),
    [assets, members, seedPayments],
  )

  const [events, setEvents] = useState<LocalMoneyEvent[]>(sourceEvents)
  const [payments, setPayments] = useState<LocalUpcomingPayment[]>([])
  const [tab, setTab] = useState<RecordTab>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [markPaidPaymentId, setMarkPaidPaymentId] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const isSavingUpcoming = createPayment.isPending || updatePayment.isPending
  const isSavingActual = createEvent.isPending || updateEvent.isPending || deletePayment.isPending

  // Money events move money in/out of a WALLET (cash or bank account), never a
  // non-liquid holding like stock/real-estate. Every asset picker on the events
  // form is a wallet source/destination, so restrict the options to those types.
  const assetOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  // Source ("nguồn tiền") of an event can only be a spendable wallet — money
  // leaves the household from cash or a bank account, never from a valued asset
  // (gold, stock, savings…). Those non-wallet assets change hands through their
  // own dedicated flows (sell / revalue), not a generic income/expense record.
  const sourceAssetOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  const memberOptions = useMemo(
    () => members.filter((member) => member.status === 'active').map((member) => ({
      value: member.id,
      label: member.name,
    })),
    [members],
  )
  // Category options come from the money_event_categories table (system +
  // household rows). The value is the stable CODE; the label follows the user's
  // language via i18n keyed by that code, falling back to the row's DB label for
  // custom categories that have no translation key.
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.code,
        label: t(`options.eventCategory.${category.code}`, {
          defaultValue: category.label,
        }),
      })),
    [categories, t],
  )

  // The household's default category code (at most one is flagged). Auto-selected
  // in the create form so a new expense/income starts with a category filled in.
  const defaultCategoryCode = useMemo(
    () => categories.find((category) => category.isDefault)?.code ?? '',
    [categories],
  )

  const upcomingSchema = useMemo(() => buildUpcomingSchema(), [])
  const actualSchema = useMemo(() => buildActualSchema(), [])

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
        canEdit: true,
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
      // Display label: the note now stands in for the dropped title; when a
      // record has no note, fall back to its translated category label so the
      // row is never blank.
      title:
        event.note?.trim() ||
        t(`options.eventCategory.${event.category}`, { defaultValue: event.category }),
      // Editability is decided on the RAW event type (the local model downgrades
      // asset_update → adjustment). asset_sale edits via its dedicated dialog;
      // asset_update edits via a simplified generic form (value/date/name/note);
      // everything else editable goes through the generic form.
      canEdit: (() => {
        const rawType = seedEvents.find((raw) => raw.id === event.id)?.type ?? event.eventType
        return rawType === 'asset_sale' || rawType === 'asset_update' || isEditableEventType(rawType)
      })(),
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
  }, [events, payments, seedEvents, t])

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
    const attentionCount = timelineRecords.filter(isAttentionRecord).length
    // thu/chi/net + recorded count come from the backend summary (source of
    // truth); default to 0 while it loads. Upcoming-in-7-days and attention are
    // payment/attention concerns the backend summary doesn't cover, so they stay
    // derived from the loaded lists here.
    return {
      upcomingIn7DaysCount: upcomingIn7Days.length,
      upcomingIn7DaysAmount: upcomingIn7Days.reduce((sum, payment) => sum + payment.amount, 0),
      recordedThisMonth: eventsSummary?.recordedCount ?? 0,
      attentionCount,
      totalIncome: eventsSummary?.totalIncome ?? 0,
      totalOutcome: eventsSummary?.totalOutcome ?? 0,
      netChange: eventsSummary?.netChange ?? 0,
    }
  }, [eventsSummary, payments, timelineRecords])

  useEffect(() => {
    setEvents((current) => (areEventsEqual(current, sourceEvents) ? current : sourceEvents))
  }, [sourceEvents])

  useEffect(() => {
    setPayments((current) => (arePaymentsEqual(current, sourcePayments) ? current : sourcePayments))
  }, [sourcePayments])

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
        expectedFromAssetId: sourceAssetOptions[0]?.value ?? '',
      })
      return
    }

    if (!isQuickActualAction(quickAction)) return

    if (editingEventId) {
      const event = events.find((item) => item.id === editingEventId)
      if (!event) return
      const raw = seedEvents.find((item) => item.id === editingEventId)
      // A revaluation (`asset_update`) stores the DIFF it represents in `amount`
      // (signed: +raised the asset, −lowered it). The form now edits that diff
      // directly, so prefill it from the record's own stored diff — NOT the
      // asset's current balance (a later inflow/outflow could have moved that far
      // past this record's point in time). The magnitude fills the money field
      // and the sign drives the tăng/giảm toggle.
      const isRevaluationEdit = raw?.type === 'asset_update'
      const revaluationDiff = isRevaluationEdit ? (raw?.amount ?? 0) : 0
      const prefillAmount = isRevaluationEdit
        ? Math.abs(revaluationDiff)
        : Math.abs(event.amount)
      resetActual({
        amount: formatAmountInput(prefillAmount),
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
        revaluationDirection: revaluationDiff < 0 ? 'decrease' : 'increase',
      })
      return
    }

    if (markPaidPaymentId) {
      const payment = payments.find((item) => item.id === markPaidPaymentId)
      if (!payment) return
      resetActual({
        ...actualDefaults,
        amount: formatAmountInput(payment.amount),
        eventDate: TODAY,
        eventType: 'payment_paid',
        direction: 'outflow',
        fromAssetId: payment.expectedFromAssetId ?? '',
        upcomingPaymentId: payment.id,
        attentionLevel: payment.attentionLevel,
        isAttentionNeeded: payment.isAttentionNeeded,
        // The label that used to live in `title` ("Đã trả …") now goes into the
        // note (title was dropped), preserving the payment's own note after it.
        note: payment.note ? `Đã trả ${payment.name} — ${payment.note}` : `Đã trả ${payment.name}`,
      })
      return
    }

    resetActual({
      ...actualDefaults,
      // Prefill the household's default category (if any) on create.
      category: defaultCategoryCode,
      fromAssetId: sourceAssetOptions[0]?.value ?? '',
    })
  }, [
    assetOptions,
    assets,
    defaultCategoryCode,
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
    seedEvents,
    sourceAssetOptions,
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

  function openSellAsset() {
    handleFormOpenChange(false)
    navigate('/assets')
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
    const raw = seedEvents.find((item) => item.id === eventId)

    // An asset_sale edits through its dedicated dialog (quantity / fee /
    // receiving wallet can't be expressed in the generic form). The backend
    // reverses the old sale's position and re-applies the edited one.
    if (raw?.type === 'asset_sale') {
      const soldAsset = assets.find((item) => item.id === raw.fromAssetId)
      if (!soldAsset) {
        toast.error('Không tìm thấy tài sản của giao dịch bán này.')
        return
      }
      sale.openSaleForEdit(soldAsset, raw)
      return
    }

    // Other system / dedicated-flow events aren't editable through this form —
    // they'd desync asset positions / debt balances or lose their type. Guard on
    // the RAW type. `asset_update` (revaluation) is the exception: it edits via a
    // SIMPLIFIED form (value/date/name/note only — no wallet/details), and the
    // backend syncs the new value back to the asset + its value-history point.
    const isRevaluation = raw?.type === 'asset_update'
    if (raw && !isRevaluation && !isEditableEventType(raw.type)) {
      toast.error('Loại record này không sửa trực tiếp được. Hãy xóa và tạo lại qua đúng luồng.')
      return
    }
    const event = events.find((item) => item.id === eventId)
    setEditingEventId(eventId)
    setEditingPaymentId(null)
    setMarkPaidPaymentId(null)
    // A revaluation edits as a neutral "expense-like" form but simplified; the
    // form hides wallet + details when editingEventType is asset_update.
    setQuickAction(event ? getQuickActionFromEventType(event.eventType) : 'expense')
    setShowMoreDetails(false)
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

  async function onSubmitUpcoming(values: UpcomingRecordForm) {
    const asset = assets.find((item) => item.id === values.expectedFromAssetId)
    const member = members.find((item) => item.id === values.ownerMemberId)
    const paymentStatus: 'important' | 'normal' | 'pending' =
      values.attentionLevel === 'urgent'
        ? 'pending'
        : values.isAttentionNeeded || values.attentionLevel === 'important'
          ? 'important'
          : 'normal'
    const payload = {
      name: values.name.trim(),
      amount: Math.abs(parseAmountInput(values.amount)),
      dueDate: values.dueDate,
      owner: member?.name ?? asset?.name,
      status: paymentStatus,
    }

    try {
      if (editingPaymentId) {
        await updatePayment.mutateAsync({ paymentId: editingPaymentId, payload })
        toast.success('Cap nhat record sap toi thanh cong.')
      } else {
        await createPayment.mutateAsync(payload)
        toast.success('Tao record sap toi thanh cong.')
      }
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, editingPaymentId ? 'Khong the cap nhat record sap toi.' : 'Khong the tao record sap toi.'))
    }
  }

  async function onSubmitActual(values: ActualRecordForm) {
    // On EDIT, preserve the event's original type + type-specific fields rather
    // than collapsing to a generic quick-action type (which used to rewrite an
    // asset_sale / debt repayment into a plain expense and drop its fee / sold
    // qty / debtId). On CREATE, derive the type from the chosen quick-action.
    const editingEvent = editingEventId
      ? events.find((item) => item.id === editingEventId)
      : undefined
    // Raw event keeps the true type (the local model downgrades asset_update →
    // adjustment). A revaluation edit must send `asset_update` back.
    const editingRaw = editingEventId
      ? seedEvents.find((item) => item.id === editingEventId)
      : undefined
    const isRevaluationEdit = editingRaw?.type === 'asset_update'
    const resolvedAction: Exclude<QuickAction, 'upcoming'> =
      quickAction && quickAction !== 'upcoming' ? quickAction : 'expense'
    // Revaluation edit: send `asset_update` with amount = the new **signed diff**
    // (magnitude × tăng/giảm sign) and the linked asset on `toAssetId`. The
    // backend shifts the asset's running balance by (newDiff − oldDiff) and
    // re-stamps its value-history point — it does NOT overwrite the balance with
    // an absolute value. Short-circuit the generic payload build below.
    if (isRevaluationEdit && editingEventId && editingRaw) {
      const diffMagnitude = Math.abs(parseAmountInput(values.amount))
      const signedDiff =
        values.revaluationDirection === 'decrease' ? -diffMagnitude : diffMagnitude
      const revaluationPayload = {
        amount: signedDiff,
        isoDate: values.eventDate,
        type: 'asset_update' as const,
        direction: 'neutral' as const,
        category: editingRaw.category || 'other',
        toAssetId: editingRaw.toAssetId || undefined,
        note: values.note.trim() || t('common.noAdditionalNote'),
      }
      try {
        await updateEvent.mutateAsync({ eventId: editingEventId, payload: revaluationPayload })
        toast.success('Cap nhat dinh gia lai thanh cong.')
        handleFormOpenChange(false)
      } catch (error) {
        toast.error(getErrorMessage(error, 'Khong the cap nhat dinh gia lai.'))
      }
      return
    }
    const resolvedEventType: RecordType = editingEvent
      ? editingEvent.eventType
      : resolvedAction === 'expense'
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
    // `title` was dropped; the note now carries the event's description. When the
    // user leaves the note blank, auto-generate a descriptive one for the types
    // that used to get an auto-title (transfer / goal_contribution /
    // payment_paid). Expense/income keep the user's note (or the empty-note
    // placeholder). On edit, the user's note wins; only create auto-generates.
    const userNote = values.note.trim()
    const autoNote = editingEvent
      ? userNote || editingEvent.note || t('common.noAdditionalNote')
      : userNote ||
        (resolvedAction === 'transfer' && fromAsset && toAsset
          ? `Chuyển từ ${fromAsset.name} sang ${toAsset.name}`
          : resolvedAction === 'goal_contribution'
            ? `Góp vào ${values.financialGoalId.trim() || 'mục tiêu chung'}`
            : resolvedAction === 'payment_paid'
              ? `Đã trả ${relatedPayment?.name ?? ''}`.trim()
              : t('common.noAdditionalNote'))
    const payload = {
      amount,
      isoDate: values.eventDate,
      type: resolvedEventType,
      direction: getDirectionFromEventType(resolvedEventType),
      category: values.category.trim() || 'other',
      fromAssetId: values.fromAssetId || undefined,
      toAssetId: values.toAssetId || undefined,
      upcomingPaymentId: values.upcomingPaymentId || undefined,
      // Carry the linked debt through so the backend still reduces the right
      // debt's balance: from the marked-paid payment on create, or from the
      // event being edited (a debt repayment keeps its debtId).
      debtId: relatedPayment?.debtId || editingEvent?.debtId || undefined,
      // Preserve sale specifics on edit so an edited asset_sale keeps its fee and
      // sold qty/value (the position reversal on the backend needs them).
      feeAmount: editingEvent?.feeAmount,
      soldQuantity: editingEvent?.soldQuantity,
      soldValue: editingEvent?.soldValue,
      financialGoalId: values.financialGoalId || undefined,
      note: autoNote,
    }

    try {
      if (markPaidPaymentId) {
        await createEvent.mutateAsync(payload)
        await deletePayment.mutateAsync(markPaidPaymentId)
        toast.success('Da ghi nhan khoan da tra.')
        handleFormOpenChange(false)
        return
      }

      if (editingEventId) {
        await updateEvent.mutateAsync({ eventId: editingEventId, payload })
        toast.success('Cap nhat record thanh cong.')
      } else {
        await createEvent.mutateAsync(payload)
        toast.success('Tao record thanh cong.')
      }
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, editingEventId ? 'Khong the cap nhat record.' : 'Khong the tao record.'))
    }
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
    const payment = payments.find((item) => item.id === paymentId)
    if (!payment) return
    const nextDueDate = new Date(
      startOfDay(payment.dueDate).setDate(startOfDay(payment.dueDate).getDate() + 7),
    )
      .toISOString()
      .slice(0, 10)
    void updatePayment
      .mutateAsync({
        paymentId,
        payload: {
          dueDate: nextDueDate,
          status: payment.attentionLevel === 'normal' ? 'important' : 'pending',
        },
      })
      .then(() => toast.success('Da doi ngay xu ly.'))
      .catch((error) => toast.error(getErrorMessage(error, 'Khong the doi ngay xu ly.')))
  }

  function duplicateEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId)
    if (!event) return
    void createEvent
      .mutateAsync({
        amount: Math.abs(event.amount),
        isoDate: event.date,
        type: event.eventType,
        direction: event.direction,
        category: event.category,
        fromAssetId: event.fromAssetId,
        toAssetId: event.toAssetId,
        upcomingPaymentId: event.upcomingPaymentId,
        financialGoalId: event.financialGoalId,
        note: event.note ? `${event.note} (copy)` : '(copy)',
      })
      .then(() => toast.success('Da nhan ban record.'))
      .catch((error) => toast.error(getErrorMessage(error, 'Khong the nhan ban record.')))
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEventMutation.mutateAsync(eventId)
      toast.success('Da xoa record.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa record.'))
      throw error
    }
  }

  const deletingEvent = deleteEventId ? events.find((event) => event.id === deleteEventId) : undefined
  const selectedUpcomingForMarkPaid = markPaidPaymentId
    ? payments.find((payment) => payment.id === markPaidPaymentId)
    : undefined
  // Raw type of the event currently being edited — drives the edit-specific
  // dialog title (undefined when creating).
  const editingEventType = editingEventId
    ? seedEvents.find((event) => event.id === editingEventId)?.type
    : undefined

  return {
    // asset-sale edit dialog (reused for editing an asset_sale event)
    sale,
    // derived data
    summary,
    groupedRecords,
    isLoading,
    payments,
    // toolbar state
    tab,
    setTab,
    query,
    setQuery,
    // dialog state
    formOpen,
    quickAction,
    setQuickAction,
    editingEventType,
    showMoreDetails,
    setShowMoreDetails,
    markPaidPaymentId,
    deleteEventId,
    setDeleteEventId,
    deletingEvent,
    selectedUpcomingForMarkPaid,
    isSavingUpcoming,
    isSavingActual,
    isDeleting: deleteEventMutation.isPending,
    // options
    assetOptions,
    sourceAssetOptions,
    memberOptions,
    categoryOptions,
    // forms
    upcomingControl,
    registerUpcoming,
    handleUpcomingSubmit,
    upcomingErrors,
    isUpcomingValid,
    actualControl,
    registerActual,
    handleActualSubmit,
    actualErrors,
    isActualValid,
    // handlers
    openCreate,
    openBorrowMoney,
    openSellAsset,
    openEditPayment,
    openEditEvent,
    openMarkPaid,
    handleFormOpenChange,
    onSubmitUpcoming,
    onSubmitActual,
    togglePaymentAttention,
    toggleEventAttention,
    postponePayment,
    duplicateEvent,
    handleDeleteEvent,
  }
}

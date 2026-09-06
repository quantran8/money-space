import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import { useAssets } from '#/features/assets/hooks/use-assets'
import { useAssetSale } from '#/features/assets/hooks/use-asset-sale'
import { isWalletAssetType } from '#/features/assets/model/assets'
import { useCategoryVisuals } from '#/features/events/hooks/use-category-visuals'
import { useEventCategories } from '#/features/events/hooks/use-event-categories'
import { useEvents } from '#/features/events/hooks/use-events'
import { useEventsSummary } from '#/features/events/hooks/use-events-summary'
import {
  actualDefaults,
  areEventsEqual,
  buildActualSchema,
  formatAmountInput,
  getDirectionFromEventType,
  getQuickActionFromEventType,
  getTimelineGroupKey,
  getTimelineGroupOrder,
  isAttentionRecord,
  isEditableEventType,
  matchesRecordTab,
  isQuickActualAction,
  parseAmountInput,
  summarizeByCategory,
  summarizeByMember,
  summarizeRecords,
  toMoneyEventSeed,
  type ActualRecordForm,
  type CategoryBreakdown,
  type FinancialRecordItem,
  type MemberBreakdownRow,
  type LocalMoneyEvent,
  type QuickAction,
  type RecordTab,
  type RecordType,
  type TimelineGroupKey,
} from '#/features/events/model/events-form'
import { useMembers } from '#/features/members/hooks/use-members'
import { currentMemberId } from '#/features/members/model/members.types'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { useAuthStore } from '#/shared/stores/auth-store'

/** `YYYY-MM` for the month the user is in now — the timeline's starting view. */
function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useEventsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { events: seedEvents, isLoading: isEventsLoading, createEvent, updateEvent, deleteEvent: deleteEventMutation } = useEvents()
  const { assets } = useAssets()
  const { members } = useMembers()
  const userId = useAuthStore((state) => state.user?.id)
  const creatorMemberId = currentMemberId(members, userId)
  const { categories } = useEventCategories()
  // Reused for editing an existing asset_sale event through its dedicated dialog
  // (the generic form can't express quantity / fee / receiving wallet).
  const sale = useAssetSale()

  const sourceEvents = useMemo(() => seedEvents.map(toMoneyEventSeed), [seedEvents])

  const [events, setEvents] = useState<LocalMoneyEvent[]>(sourceEvents)
  const [tab, setTab] = useState<RecordTab>('all')
  const [query, setQuery] = useState('')
  // Month + person live here, not in the timeline card: the summary strip above
  // the list has to describe exactly the rows the list is showing, and it
  // cannot do that while the filters are private to the card.
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [selectedMember, setSelectedMember] = useState('all')
  // Thu/chi/net for the BROWSED month are the backend's source of truth — read
  // them from the summary endpoint, never re-derive from the event list. The
  // one case it cannot answer is a person filter, handled at `periodSummary`.
  const { data: eventsSummary, isLoading: isSummaryLoading } = useEventsSummary(selectedMonth)
  // Show the timeline skeleton while EITHER the events list or the backend
  // thu/chi/net summary is still loading — both feed the page's main content.
  const isLoading = isEventsLoading || isSummaryLoading
  const [formOpen, setFormOpen] = useState(false)
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const isSavingActual = createEvent.isPending || updateEvent.isPending

  // Money events move money in/out of a WALLET (cash or bank account), never a
  // non-liquid holding like stock/real-estate. Every asset picker on the events
  // form is a wallet source/destination, so restrict the options to those types.
  //
  // Source ("nguồn tiền") and destination are the same set: money leaves and
  // arrives through a spendable wallet, never through a valued asset (gold,
  // stock, savings…), which changes hands via its own sell / revalue flow.
  // `assetOptions` and `sourceAssetOptions` were two byte-identical memos;
  // they are one list with two names kept for the call sites' readability.
  const assetOptions = useMemo(
    () =>
      assets
        .filter((asset) => isWalletAssetType(asset.type))
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )
  const sourceAssetOptions = assetOptions
  const memberOptions = useMemo(
    () => members.filter((member) => member.status === 'active').map((member) => ({
      value: member.id,
      label: member.name,
    })),
    [members],
  )
  // Category options come from the money_event_categories table (system +
  // household rows). The value is the row's ID (what an event stores); the
  // label follows the user's language via i18n keyed by its CODE, falling back
  // to the row's DB label for custom categories with no translation key.
  // The household's default leads the picker — it is the one the form
  // pre-selects, so it should not sit mid-list where the reader has to scroll
  // past it to confirm what is already chosen. Everything after keeps the
  // server's sortOrder.
  const categoryOptions = useMemo(
    () =>
      [...categories]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map((category) => ({
          // The ID is the value now — events carry a real FK, not a code. The
          // code survives only as the i18n key for the label.
          value: category.id,
          label: t(`options.eventCategory.${category.code}`, {
            defaultValue: category.label,
          }),
          // Carried through so any category picker can draw the same disc the
          // timeline row does — resolving the key to a component stays a UI
          // concern (web app's `category-icon.tsx`).
          iconKey: category.iconKey,
          iconColor: category.iconColor,
        })),
    [categories, t],
  )

  // The household's default category id (at most one is flagged). Auto-selected
  // in the create form so a new expense/income starts with a category filled in.
  const defaultCategoryId = useMemo(
    () => categories.find((category) => category.isDefault)?.id ?? '',
    [categories],
  )

  // Category id → its label and disc. Shared with every other surface that
  // renders a category (the dashboard's spending rows, the upcoming list).
  const categoryVisualById = useCategoryVisuals()

  // Auth profile id → the household member, so a row can name whoever recorded
  // it. The event carries only `createdById` (a PROFILE id) — the member id the
  // person filter works in is a different id, so both are resolved here. A
  // creator who has since left the household resolves to nothing and the row
  // falls back to the household, rather than being reported under a stale name.
  const memberByProfileId = useMemo(
    () => new Map(members.map((member) => [member.profileId, member])),
    [members],
  )

  const actualSchema = useMemo(() => buildActualSchema(), [])

  const {
    control: actualControl,
    register: registerActual,
    reset: resetActual,
    handleSubmit: handleActualSubmit,
    formState: { errors: actualErrors, isDirty: isActualDirty },
  } = useForm<ActualRecordForm>({
    resolver: zodResolver(actualSchema),
    defaultValues: actualDefaults,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  /**
   * This page is the LEDGER — money that has already moved. Expected movements
   * are cashflow events and live on `/upcoming`, which owns their timeline and
   * their complete/postpone/cancel lifecycle. Never merge the two here: a
   * forecast row and a recorded row are different kinds of fact.
   */
  const timelineRecords = useMemo<FinancialRecordItem[]>(() => {
    const actualRecords = events.map((event) => ({
      id: event.id,
      // Display label: the note stands in for the dropped title; when a record
      // has no note, fall back to its translated category label so the row is
      // never blank. The label is resolved through the id map — an event carries
      // only the FK, not the code the i18n key is built from.
      //
      // A row that falls back here shows the category as its TITLE, so the row
      // must not also print it as the subtitle underneath — see `titleIsCategory`.
      title:
        event.note?.trim() ||
        categoryVisualById[event.categoryId]?.label ||
        '',
      /** True when `title` is the category label standing in for a missing note.
       *  The row reads it to drop the now-duplicate category subtitle. */
      titleIsCategory: !event.note?.trim(),
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
      categoryId: event.categoryId,
      fromAssetId: event.fromAssetId,
      fromAssetName: event.fromAssetName,
      toAssetId: event.toAssetId,
      toAssetName: event.toAssetName,
      cashflowEventId: event.cashflowEventId,
      debtId: event.debtId,
      note: event.note,
      // Who recorded it. Left unset when the creator is not a current member —
      // the row then reads as the household's, which is also what a
      // system-generated event (saving interest) correctly shows.
      ownerMemberId: event.createdById ? memberByProfileId.get(event.createdById)?.id : undefined,
      ownerName: event.createdById ? memberByProfileId.get(event.createdById)?.name : undefined,
    }))

    return actualRecords.sort((left, right) => {
      const leftGroup = getTimelineGroupKey(left)
      const rightGroup = getTimelineGroupKey(right)
      if (leftGroup !== rightGroup) {
        return getTimelineGroupOrder(leftGroup) - getTimelineGroupOrder(rightGroup)
      }
      // Newest first — a ledger reads backwards from now.
      return right.date.localeCompare(left.date)
    })
  }, [categoryVisualById, events, memberByProfileId, seedEvents])

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return timelineRecords.filter((record) => {
      if (record.date.slice(0, 7) !== selectedMonth) return false
      if (selectedMember !== 'all' && record.ownerMemberId !== selectedMember) return false
      if (!matchesRecordTab(record, tab)) return false
      if (!needle) return true
      return (
        record.title.toLowerCase().includes(needle) ||
        record.note?.toLowerCase().includes(needle) ||
        record.ownerName?.toLowerCase().includes(needle) ||
        record.fromAssetName?.toLowerCase().includes(needle) ||
        record.toAssetName?.toLowerCase().includes(needle)
      )
    })
  }, [query, selectedMember, selectedMonth, tab, timelineRecords])

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

  const recordCounts = useMemo(
    () => ({
      source: timelineRecords.filter((record) =>
        !record.debtId &&
        record.eventType !== 'debt_update' &&
        Boolean(record.fromAssetId || record.toAssetId),
      ).length,
      debt: timelineRecords.filter(
        (record) => Boolean(record.debtId) || record.eventType === 'debt_update',
      ).length,
    }),
    [timelineRecords],
  )

  /**
   * The strip above the timeline: thu / chi / ròng plus how many records
   * actually happened, for the month and person currently on screen.
   *
   * The backend endpoint owns these figures for a whole month, so a plain month
   * view reads them straight through. It has no person parameter, though, and a
   * headline that reported the whole household while the list below showed one
   * member would be describing a different set of rows than the one on screen —
   * so a narrowed view derives the same four figures from those very rows.
   */
  const periodSummary = useMemo(() => {
    const isWholeMonth = selectedMember === 'all' && tab === 'all' && !query.trim()
    if (isWholeMonth && eventsSummary) {
      return {
        totalIncome: eventsSummary.totalIncome,
        totalOutcome: eventsSummary.totalOutcome,
        netChange: eventsSummary.netChange,
        recordedCount: eventsSummary.recordedCount,
      }
    }
    return summarizeRecords(filteredRecords)
  }, [eventsSummary, filteredRecords, query, selectedMember, tab])

  /**
   * What the browsed month's money was made of, by category — both directions.
   *
   * Deliberately reads the MONTH, not `filteredRecords`: unlike the summary
   * strip this is not a headline over the list, it is a separate reading of the
   * month, and narrowing it to one person would turn a composition into a
   * report on what one member spent (§0.2, §16.4). The card says which month it
   * covers so it can never be mistaken for a description of the rows below.
   */
  const monthRecords = useMemo(
    () => timelineRecords.filter((record) => record.date.slice(0, 7) === selectedMonth),
    [selectedMonth, timelineRecords],
  )

  const categoryLabelFor = useMemo(
    () => (categoryId: string) => {
      const visual = categoryVisualById[categoryId]
      return visual
        ? { label: visual.label, color: visual.iconColor, iconKey: visual.iconKey }
        : undefined
    },
    [categoryVisualById],
  )

  const spendingByCategory = useMemo<CategoryBreakdown>(
    () => summarizeByCategory(monthRecords, 'outflow', categoryLabelFor),
    [categoryLabelFor, monthRecords],
  )

  const incomeByCategory = useMemo<CategoryBreakdown>(
    () => summarizeByCategory(monthRecords, 'inflow', categoryLabelFor),
    [categoryLabelFor, monthRecords],
  )

  /**
   * The same month, split by who is responsible rather than by category.
   *
   * Reads the month for the same reason the category breakdown does — and here
   * it matters more: narrowing this to one person would turn it into a report on
   * that person, which is the one thing this product does not do (§0.2, §16.4).
   */
  const byMember = useMemo<MemberBreakdownRow[]>(
    () => summarizeByMember(monthRecords),
    [monthRecords],
  )

  const summary = useMemo(() => {
    const attentionCount = timelineRecords.filter(isAttentionRecord).length
    // thu/chi/net + recorded count come from the backend summary (source of
    // truth); default to 0 while it loads. Attention is a concern the backend
    // summary doesn't cover, so it stays derived from the loaded list here.
    // What is still EXPECTED to move belongs to the forecast, not this ledger —
    // `/upcoming` owns those figures.
    return {
      recordedThisMonth: eventsSummary?.recordedCount ?? 0,
      attentionCount,
      totalIncome: eventsSummary?.totalIncome ?? 0,
      totalOutcome: eventsSummary?.totalOutcome ?? 0,
      netChange: eventsSummary?.netChange ?? 0,
    }
  }, [eventsSummary, timelineRecords])

  useEffect(() => {
    setEvents((current) => (areEventsEqual(current, sourceEvents) ? current : sourceEvents))
  }, [sourceEvents])

  useEffect(() => {
    if (!formOpen) return
    // This effect depends on `events` / `assets`, so a background refetch while
    // the dialog is open would re-run it and overwrite whatever the user has
    // typed. Once the form is dirty, their input wins (§23: a form must never
    // silently discard what the user entered).
    if (isActualDirty) return

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
        // The form field is named `category` but holds the category's ID.
        category: event.categoryId,
        direction: event.direction,
        fromAssetId: event.fromAssetId ?? '',
        toAssetId: event.toAssetId ?? '',
        cashflowEventId: event.cashflowEventId ?? '',
        attentionLevel: event.attentionLevel,
        isAttentionNeeded: event.isAttentionNeeded,
        note: event.note ?? '',
        revaluationDirection: revaluationDiff < 0 ? 'decrease' : 'increase',
      })
      return
    }

    const createEventType: RecordType = quickAction === 'income'
      ? 'income'
      : quickAction === 'transfer'
        ? 'transfer'
          : quickAction === 'payment_paid'
            ? 'payment_paid'
            : 'expense'

    resetActual({
      ...actualDefaults,
      eventType: createEventType,
      direction: getDirectionFromEventType(createEventType),
      category: defaultCategoryId,
      fromAssetId: createEventType === 'income' ? '' : sourceAssetOptions[0]?.value ?? '',
      toAssetId: createEventType === 'income' ? sourceAssetOptions[0]?.value ?? '' : '',
    })
  }, [
    assetOptions,
    assets,
    creatorMemberId,
    defaultCategoryId,
    editingEventId,
    events,
    formOpen,
    isActualDirty,
    memberOptions,
    quickAction,
    resetActual,
    seedEvents,
    sourceAssetOptions,
  ])

  function openCreate() {
    setEditingEventId(null)
    setQuickAction(null)
    setShowMoreDetails(false)
    setFormOpen(true)
  }

  function openBorrowMoney() {
    handleFormOpenChange(false)
    navigate('/networth', { state: { openCreate: true } })
  }

  function openSellAsset() {
    handleFormOpenChange(false)
    navigate('/networth')
  }

  /**
   * Buying an asset is not a plain ledger row — it creates (or grows) a holding
   * and debits the wallet that paid. That lives in the asset form, so hand the
   * user over with the acquisition already answered.
   */
  function openBuyAsset() {
    handleFormOpenChange(false)
    navigate('/networth', { state: { buyAsset: true } })
  }

  /**
   * Planning money that has NOT moved yet is a cashflow event, which lives on
   * `/upcoming` together with its complete/postpone/cancel lifecycle. Hand the
   * user over rather than writing an expected movement from the ledger page.
   */
  function openPlanUpcoming() {
    handleFormOpenChange(false)
    navigate('/upcoming')
  }

  function openEditEvent(eventId: string) {
    const raw = seedEvents.find((item) => item.id === eventId)

    // An asset_sale edits through its dedicated dialog (quantity / fee /
    // receiving wallet can't be expressed in the generic form). The backend
    // reverses the old sale's position and re-applies the edited one.
    if (raw?.type === 'asset_sale') {
      const soldAsset = assets.find((item) => item.id === raw.fromAssetId)
      if (!soldAsset) {
        notify.error(t('events.toast.saleAssetMissing'))
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
      notify.error(t('events.toast.notDirectlyEditable'))
      return
    }
    const event = events.find((item) => item.id === eventId)
    setEditingEventId(eventId)
    // A revaluation edits as a neutral "expense-like" form but simplified; the
    // form hides wallet + details when editingEventType is asset_update.
    setQuickAction(event ? getQuickActionFromEventType(event.eventType) : 'expense')
    setShowMoreDetails(false)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setQuickAction(null)
      setShowMoreDetails(false)
      setEditingEventId(null)
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
    const resolvedAction: QuickAction = quickAction ?? 'expense'
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
        categoryId: editingRaw.categoryId,
        toAssetId: editingRaw.toAssetId || undefined,
        // Empty stays empty — the timeline falls back to the category label
        // when there is no note, so there is nothing here to placeholder.
        note: values.note.trim(),
      }
      try {
        await updateEvent.mutateAsync({ eventId: editingEventId, payload: revaluationPayload })
        notify.success(t('events.toast.revaluationUpdated'))
        handleFormOpenChange(false)
      } catch (error) {
        notify.error(getErrorMessage(error, t('events.toast.revaluationFailed')))
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
              : 'payment_paid'
    const amount = Math.abs(parseAmountInput(values.amount))
    // `title` was dropped; the note now carries the event's description, and an
    // empty one is a real, displayable state — the timeline falls back to the
    // category label when there is no note (see `timelineRecords` above), so
    // this must NOT synthesize placeholder text (transfer's auto-generated
    // "Chuyen tu X sang Y" note, or the noAdditionalNote filler).
    const resolvedNote = values.note.trim()
    const payload = {
      amount,
      isoDate: values.eventDate,
      type: resolvedEventType,
      direction: getDirectionFromEventType(resolvedEventType),
      categoryId: values.category.trim(),
      fromAssetId: values.fromAssetId || undefined,
      toAssetId: values.toAssetId || undefined,
      // Carry the linked debt through so the backend still reduces the right
      // debt's balance (a debt repayment keeps its debtId across an edit).
      debtId: editingEvent?.debtId || undefined,
      // Preserve sale specifics on edit so an edited asset_sale keeps its fee and
      // sold qty/value (the position reversal on the backend needs them).
      feeAmount: editingEvent?.feeAmount,
      soldQuantity: editingEvent?.soldQuantity,
      soldValue: editingEvent?.soldValue,
      // `null`, not `undefined`, when the household clears the picker: the
      // payload goes through JSON.stringify, which DROPS undefined keys — so an
      // undefined here reached the API as "field absent" and the old link
      note: resolvedNote,
    }

    try {
      if (editingEventId) {
        await updateEvent.mutateAsync({ eventId: editingEventId, payload })
        notify.success(t('events.toast.updated'))
      } else {
        await createEvent.mutateAsync(payload)
        notify.success(t('events.toast.created'))
      }
      handleFormOpenChange(false)
    } catch (error) {
      notify.error(
        getErrorMessage(
          error,
          editingEventId ? t('events.toast.updateFailed') : t('events.toast.createFailed'),
        ),
      )
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEventMutation.mutateAsync(eventId)
      notify.success(t('events.toast.deleted'))
    } catch (error) {
      notify.error(getErrorMessage(error, t('events.toast.deleteFailed')))
      throw error
    }
  }

  const deletingEvent = deleteEventId ? events.find((event) => event.id === deleteEventId) : undefined
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
    recordCounts,
    isLoading,
    periodSummary,
    // Composition of the browsed MONTH, unaffected by the toolbar filters.
    spendingByCategory,
    incomeByCategory,
    byMember,
    // toolbar state
    tab,
    setTab,
    query,
    setQuery,
    selectedMonth,
    setSelectedMonth,
    selectedMember,
    setSelectedMember,
    // dialog state
    formOpen,
    quickAction,
    setQuickAction,
    editingEventType,
    showMoreDetails,
    setShowMoreDetails,
    deleteEventId,
    setDeleteEventId,
    deletingEvent,
    isSavingActual,
    isDeleting: deleteEventMutation.isPending,
    // options
    assetOptions,
    sourceAssetOptions,
    memberOptions,
    categoryOptions,
    categoryVisualById,
    // forms
    actualControl,
    registerActual,
    handleActualSubmit,
    actualErrors,
    // handlers
    openCreate,
    openBorrowMoney,
    openBuyAsset,
    openSellAsset,
    openPlanUpcoming,
    openEditEvent,
    handleFormOpenChange,
    onSubmitActual,
    handleDeleteEvent,
  }
}

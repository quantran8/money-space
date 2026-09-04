import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { notify } from '#/shared/notify'

import type { CashflowEventPayload } from '#/features/cashflow/api/cashflow-events.repository'
import { useCashflowEvents } from '#/features/cashflow/hooks/use-cashflow-events'
import { useEventCategories } from '#/features/events/hooks/use-event-categories'
import {
  buildCashflowSchema,
  cashflowAmountToRaw,
  cashflowAmountToVnd,
  defaultCashflowFormValues,
  type CashflowEventForm,
} from '#/features/cashflow/model/cashflow-form'
import type { CashflowEvent } from '#/features/cashflow/model/cashflow.types'
import { getErrorMessage } from '#/shared/lib/get-error-message'

/**
 * Create/edit state for a cashflow event. Used by `/upcoming` — the screen the
 * events feed — so a household can add what it expects without leaving the
 * forecast.
 */
export function useCashflowForm() {
  const { t } = useTranslation()
  const { cashflowEvents, createCashflowEvent, updateCashflowEvent, deleteCashflowEvent } =
    useCashflowEvents()
  const { categories } = useEventCategories()
  // Mirrors the money-event form's own default-category prefill: the
  // household's default category leads the picker and seeds a new event.
  const defaultCategoryId = useMemo(
    () => categories.find((category) => category.isDefault)?.id ?? '',
    [categories],
  )
  // Same shape as the money-event form's `categoryOptions` (value/label plus
  // the disc's glyph+fill) — the code → i18n label resolution stays here
  // rather than in the UI so both forms translate a category the same way.
  const categoryOptions = useMemo(
    () =>
      [...categories]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map((category) => ({
          // The ID is the value — an event carries a real FK, not a code.
          value: category.id,
          label: t(`options.eventCategory.${category.code}`, { defaultValue: category.label }),
          iconKey: category.iconKey,
          iconColor: category.iconColor,
        })),
    [categories, t],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isEditing = editingId !== null
  const isSubmitting = createCashflowEvent.isPending || updateCashflowEvent.isPending

  const schema = useMemo(() => buildCashflowSchema(t), [t])

  const form = useForm<CashflowEventForm>({
    resolver: zodResolver(schema),
    defaultValues: defaultCashflowFormValues(),
    mode: 'onChange',
  })

  const { reset, handleSubmit } = form

  const editingEvent: CashflowEvent | undefined = editingId
    ? cashflowEvents.find((event) => event.id === editingId)
    : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingEvent) {
      reset({
        name: editingEvent.name,
        category: editingEvent.categoryId,
        amount: cashflowAmountToRaw(editingEvent.amount),
        direction: editingEvent.direction,
        expectedDate: editingEvent.expectedDate,
        recurrence: editingEvent.recurrence,
        // Incoming carries `null`; the form needs a concrete value to render.
        requirement: editingEvent.requirement ?? 'required',
        certainty: editingEvent.certainty,
        settlementAssetId: editingEvent.settlementAssetId ?? '',
        note: editingEvent.note ?? '',
      })
      return
    }
    reset({ ...defaultCashflowFormValues(), category: defaultCategoryId })
  }, [defaultCategoryId, editingEvent, formOpen, reset])

  function openCreate(direction: 'incoming' | 'outgoing' = 'outgoing') {
    setEditingId(null)
    reset({ ...defaultCashflowFormValues(direction), category: defaultCategoryId })
    setFormOpen(true)
  }

  function openEdit(eventId: string) {
    setEditingId(eventId)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingId(null)
  }

  async function onSubmit(values: CashflowEventForm) {
    try {
      const payload: CashflowEventPayload = {
        name: values.name.trim(),
        categoryId: values.category,
        amount: cashflowAmountToVnd(values.amount),
        direction: values.direction,
        expectedDate: values.expectedDate,
        recurrence: values.recurrence,
        certainty: values.certainty,
        // `null` clears it on edit; `''` from the Select means "not chosen".
        settlementAssetId: values.settlementAssetId || null,
        note: values.note.trim() || undefined,
        // Omitted entirely for incoming — the backend forces it to null and
        // sending a value would be a lie about what was asked.
        ...(values.direction === 'outgoing' ? { requirement: values.requirement } : {}),
      }

      if (editingId) {
        await updateCashflowEvent.mutateAsync({ eventId: editingId, payload })
        notify.success(t('upcoming.form.updated'))
      } else {
        await createCashflowEvent.mutateAsync(payload)
        notify.success(t('upcoming.form.created'))
      }

      handleFormOpenChange(false)
    } catch (error) {
      notify.error(
        getErrorMessage(error, editingId ? t('upcoming.form.updateFailed') : t('upcoming.form.createFailed')),
      )
    }
  }

  async function handleDelete(eventId: string) {
    try {
      await deleteCashflowEvent.mutateAsync(eventId)
      notify.success(t('upcoming.form.deleted'))
      if (editingId === eventId) handleFormOpenChange(false)
    } catch (error) {
      notify.error(getErrorMessage(error, t('upcoming.form.deleteFailed')))
    }
  }

  return {
    form,
    formOpen,
    categoryOptions,
    /**
     * The event being edited, or null when creating.
     *
     * The goal-impact preview needs it: it measures against the wallet net of
     * scheduled outflows, and the event under edit is one of them. Without this
     * an edit would be costed against a wallet already reduced by its own
     * amount, counting it twice.
     */
    editingId,
    isEditing,
    isSubmitting,
    openCreate,
    openEdit,
    handleFormOpenChange,
    submit: handleSubmit(onSubmit),
    handleDelete,
    isDeleting: deleteCashflowEvent.isPending,
  }
}

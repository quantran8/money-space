import { View } from 'react-native'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type {
  ActualRecordForm as ActualRecordFormValues,
  QuickAction,
} from '@money-space/core/features/events/model/events-form'

import {
  BottomSheet,
  Button,
  DateField,
  Disclosure,
  Field,
  MoneyInput,
  Segmented,
  Select,
  Sunk,
  Switch,
} from '@/components/ui'
import { EventEffectNote } from '@/features/events/ui/event-effect-note'
import { QuickActionList } from '@/features/events/ui/quick-action-list'

import type { Control, FieldErrors, UseFormHandleSubmit } from 'react-hook-form'

type Option = { value: string; label: string }

export type EventFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quickAction: QuickAction | null
  /** Raw type of the event being edited; undefined when creating. */
  editingEventType?: string
  onSelectQuickAction: (action: QuickAction) => void
  /** Back to the picker without closing the sheet. */
  onBack: () => void
  onBorrowMoney: () => void
  onBuyAsset: () => void
  onSellAsset: () => void
  onPlanUpcoming: () => void
  showMoreDetails: boolean
  onToggleMoreDetails: () => void
  /** Wallets only (cash / bank account) — core decides, never re-derived here. */
  sourceAssetOptions: Option[]
  categoryOptions: Option[]
  control: Control<ActualRecordFormValues>
  errors: FieldErrors<ActualRecordFormValues>
  handleSubmit: UseFormHandleSubmit<ActualRecordFormValues>
  onSubmit: (values: ActualRecordFormValues) => void
  isSaving: boolean
}

/** Which title key a quick action reads under. */
function titleKeyFor(quickAction: QuickAction, isRevaluation: boolean) {
  if (isRevaluation) return 'revaluation'
  return quickAction === 'debt_borrow' ? 'expense' : quickAction
}

/**
 * Record a money event — pick what happened, then say how much.
 *
 * Two steps in one sheet, which is what the web dialog does: the picker answers
 * "what kind of thing is this" and the form asks only the fields that kind
 * needs. Splitting them into two sheets would put a scrim over a scrim.
 *
 * Every schema rule, default and derivation comes from core's `useEventsPage`
 * and `buildActualSchema`; this file decides what is asked first and what folds
 * away. In particular the source select is bound to `sourceAssetOptions`, which
 * core has already restricted to wallets — money only enters and leaves through
 * a spendable balance, and a valued holding changes hands through its own sell
 * or revalue flow.
 *
 * The primary button is NEVER disabled (§22.10): pressing it runs the schema
 * and says what is missing, rather than dimming into a dead end.
 */
export function EventFormSheet({
  open,
  onOpenChange,
  quickAction,
  editingEventType,
  onSelectQuickAction,
  onBack,
  onBorrowMoney,
  onBuyAsset,
  onSellAsset,
  onPlanUpcoming,
  showMoreDetails,
  onToggleMoreDetails,
  sourceAssetOptions,
  categoryOptions,
  control,
  errors,
  handleSubmit,
  onSubmit,
  isSaving,
}: EventFormSheetProps) {
  const { t } = useTranslation()

  const isEditing = Boolean(editingEventType)
  // A revaluation edits through a SIMPLIFIED form — the diff, its sign, the
  // date and a note. No wallet: re-pricing an asset moves no money.
  const isRevaluation = editingEventType === 'asset_update'

  const title = quickAction
    ? t(
        `events.form.${isEditing ? 'updateTitle' : 'createTitle'}.${titleKeyFor(
          quickAction,
          isRevaluation,
        )}`,
      )
    : t('events.form.pickTitle')

  const isIncome = quickAction === 'income'
  const isExpense = quickAction === 'expense' || quickAction === 'payment_paid'
  const showsCategory = !isRevaluation && (isIncome || quickAction === 'expense')
  const showsFrom = !isRevaluation && (isExpense || quickAction === 'transfer')
  const showsTo = !isRevaluation && (isIncome || quickAction === 'transfer')

  const footer = quickAction ? (
    <View className="gap-2">
      <Button onPress={handleSubmit(onSubmit)} loading={isSaving}>
        {isEditing ? t('events.form.saveChanges') : t('events.form.save')}
      </Button>
      {/* Returning to the picker is only meaningful while creating — an edit
          never had a picker to go back to. */}
      {isEditing ? (
        <Button variant="secondary" onPress={() => onOpenChange(false)}>
          {t('common.cancel')}
        </Button>
      ) : (
        <Button variant="secondary" onPress={onBack}>
          {t('events.form.back')}
        </Button>
      )}
    </View>
  ) : undefined

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      footer={footer}
    >
      {!quickAction ? (
        <QuickActionList
          onSelect={onSelectQuickAction}
          onBorrowMoney={onBorrowMoney}
          onBuyAsset={onBuyAsset}
          onSellAsset={onSellAsset}
          onPlanUpcoming={onPlanUpcoming}
        />
      ) : (
        <View className="gap-4">
          {/* A revaluation stores the signed DIFF it represents; the money
              field holds the magnitude and this carries the sign. */}
          {isRevaluation ? (
            <Controller
              control={control}
              name="revaluationDirection"
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'increase' as const, label: t('events.form.revaluationIncrease') },
                    { value: 'decrease' as const, label: t('events.form.revaluationDecrease') },
                  ]}
                />
              )}
            />
          ) : null}

          {/* §22.5 — normal control size. A hero-size input says the number is
              an output; here it is the thing being entered. */}
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                label={t('events.form.amount')}
                placeholder="0"
                value={field.value}
                onChange={field.onChange}
                error={errors.amount?.message}
              />
            )}
          />

          {showsCategory ? (
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  label={t('events.form.whatFor')}
                  placeholder={t('events.form.categoryPlaceholder')}
                  value={field.value || null}
                  options={categoryOptions}
                  onChange={field.onChange}
                  error={errors.category?.message}
                />
              )}
            />
          ) : null}

          {showsFrom ? (
            <Controller
              control={control}
              name="fromAssetId"
              render={({ field }) => (
                <Select
                  label={t(
                    quickAction === 'transfer'
                      ? 'events.form.transferFrom'
                      : 'events.form.payFrom',
                  )}
                  placeholder={t('events.form.selectPlaceholder')}
                  value={field.value || null}
                  options={sourceAssetOptions}
                  onChange={field.onChange}
                  error={errors.fromAssetId?.message}
                />
              )}
            />
          ) : null}

          {showsTo ? (
            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Select
                  label={t(
                    quickAction === 'transfer'
                      ? 'events.form.transferTo'
                      : 'events.form.receiveInto',
                  )}
                  placeholder={t('events.form.selectPlaceholder')}
                  value={field.value || null}
                  options={sourceAssetOptions}
                  onChange={field.onChange}
                  error={errors.toAssetId?.message}
                />
              )}
            />
          ) : null}

          {/* §22.7 — the consequence, one sentence, per keystroke. Renders
              nothing for a transfer: money moving between the household's own
              wallets does not shift the low point. */}
          {!isRevaluation ? (
            <EventEffectNote
              control={control}
              quickAction={quickAction}
              isEditing={isEditing}
            />
          ) : null}

          {/* §22.2 — exactly ONE disclosure, never a second level. The date
              lives here because it defaults to today, and §22.1 says do not ask
              what the app already knows. */}
          <Disclosure
            open={showMoreDetails}
            onToggle={onToggleMoreDetails}
            label={t(showMoreDetails ? 'events.form.less' : 'events.form.more')}
          >
            <Controller
              control={control}
              name="eventDate"
              render={({ field }) => (
                <DateField
                  label={t('events.form.shortDate')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.eventDate?.message}
                />
              )}
            />

            {!isRevaluation ? (
              <Sunk>
                <Controller
                  control={control}
                  name="isAttentionNeeded"
                  render={({ field }) => (
                    <Switch
                      label={t('events.form.attention')}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Sunk>
            ) : null}

            {/* Controlled, not `register`d: RN's TextInput speaks
                `onChangeText`, and core exposes the same field either way. */}
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Field
                  label={t('events.form.note')}
                  placeholder={t('events.form.shortNotePlaceholder')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.note?.message}
                  multiline
                  numberOfLines={3}
                  // `Field` is a 46pt single-line control; the style prop lands
                  // after its own, which is what gives the note room.
                  style={{ height: 92, paddingTop: 11, textAlignVertical: 'top' }}
                />
              )}
            />
          </Disclosure>
        </View>
      )}
    </BottomSheet>
  )
}

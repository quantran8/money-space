import { useState } from 'react'
import { Text, View } from 'react-native'
import { Controller, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import {
  RECURRENCE_OPTIONS,
  cashflowAmountToVnd,
  type CashflowEventForm,
} from '@money-space/core/features/cashflow/model/cashflow-form'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'

import {
  BottomSheet,
  Button,
  CaveatNote,
  DateField,
  Disclosure,
  Field,
  MoneyInput,
  Segmented,
  Select,
} from '@/components/ui'
import { settlementWalletOptions } from '@/features/cashflow/lib/wallet-options'
import { GoalImpactNotice } from '@/features/cashflow/ui/goal-impact-notice'

import type { UseFormReturn } from 'react-hook-form'

export type CashflowEventFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** From core's `useCashflowForm`. Never a form built here. */
  form: UseFormReturn<CashflowEventForm>
  isEditing: boolean
  /** The event being edited, so its own amount is not double-counted. */
  editingId?: string | null
  isSubmitting: boolean
  onSubmit: () => void
  /** Offered as a destructive action while editing. Omit to hide it. */
  onDelete?: () => void
  isDeleting?: boolean
}

/**
 * Create or edit a cashflow event — the only thing that feeds the forecast
 * (§18) — as a bottom sheet.
 *
 * Every field, every default and every rule comes from core's `useCashflowForm`
 * and `buildCashflowSchema`. This file decides what is asked first and what
 * folds away, nothing else.
 *
 * The default view asks the four facts needed to place an event on the
 * timeline: direction, amount, name, date. Recurrence, requirement, certainty
 * and the note sit behind ONE disclosure (§22.2, never a second level).
 *
 * The wallet is the exception that stays inline for an OUTGOING event. Both the
 * schema and this screen's own explanation need it: an outflow outranks the
 * goals sharing its wallet, so without one `GoalImpactNotice` cannot say what
 * the spend costs before it is saved. Hiding a blocking field behind a
 * disclosure leaves the household pressing save at an error they cannot see.
 * Incoming keeps it optional — money arriving backs no goal until it lands — so
 * it goes inside the disclosure there.
 *
 * The primary button is NEVER disabled (§22.10). Pressing it runs the schema
 * and says what is missing.
 */
export function CashflowEventFormSheet({
  open,
  onOpenChange,
  form,
  isEditing,
  editingId,
  isSubmitting,
  onSubmit,
  onDelete,
  isDeleting = false,
}: CashflowEventFormSheetProps) {
  const { t } = useTranslation()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { control, formState } = form
  const errors = formState.errors

  const direction = useWatch({ control, name: 'direction' })
  const certainty = useWatch({ control, name: 'certainty' })
  const settlementAssetId = useWatch({ control, name: 'settlementAssetId' })
  const amount = useWatch({ control, name: 'amount' })
  const expectedDate = useWatch({ control, name: 'expectedDate' })

  const { assets, asOf } = useAssets()
  const walletOptions = settlementWalletOptions(assets, asOf || AS_OF, (params) =>
    t('upcoming.complete.walletOption', params),
  )
  const isOutgoing = direction === 'outgoing'

  /**
   * The event names a wallet that is no longer among the household's assets —
   * it was deleted while the event kept pointing at it.
   *
   * Worth its own state because a `Select` holding a value with no matching
   * option renders BLANK, which reads exactly like "no wallet chosen". The
   * household would then re-pick without knowing anything was lost, or save and
   * silently rewrite the event's wallet. The event is still real; its wallet is
   * not, and saying so is the whole point.
   */
  const walletMissing =
    Boolean(settlementAssetId) && !walletOptions.some((option) => option.value === settlementAssetId)

  /**
   * Always rendered, even with no eligible wallet, so the requirement and its
   * error stay visible rather than the form silently refusing to submit.
   */
  const walletSection =
    walletOptions.length > 0 ? (
      <View className="gap-2">
        <Controller
          control={control}
          name="settlementAssetId"
          render={({ field }) => (
            <Select
              label={t(isOutgoing ? 'upcoming.form.walletOut' : 'upcoming.form.walletIn')}
              placeholder={t('upcoming.complete.walletPlaceholder')}
              value={field.value || null}
              options={walletOptions}
              onChange={field.onChange}
              error={errors.settlementAssetId?.message}
            />
          )}
        />
        {walletMissing ? <CaveatNote>{t('upcoming.form.walletDeleted')}</CaveatNote> : null}
        <Text className="text-[12px] leading-4 text-ink3">
          {t(isOutgoing ? 'upcoming.form.walletHintOut' : 'upcoming.form.walletHintIn')}
        </Text>
      </View>
    ) : (
      /* No eligible wallet exists. An outflow cannot be saved at all in this
         state, so say why instead of leaving the button pressing at nothing. */
      <CaveatNote>
        {t(isOutgoing ? 'upcoming.form.walletNoneOut' : 'upcoming.form.walletNoneIn')}
      </CaveatNote>
    )

  function handleClose() {
    setDetailsOpen(false)
    onOpenChange(false)
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={isEditing ? t('upcoming.form.editTitle') : t('upcoming.form.title')}
      footer={
        <View className="gap-2">
          <Button onPress={onSubmit} loading={isSubmitting}>
            {isEditing ? t('upcoming.form.saveEdit') : t('upcoming.form.submit')}
          </Button>
          {isEditing && onDelete ? (
            <Button variant="destructive" onPress={onDelete} loading={isDeleting}>
              {t('common.delete')}
            </Button>
          ) : null}
          <Button variant="secondary" onPress={handleClose}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        {/* Two short options that both fit — a picker would cost a tap and
            hide the alternative. */}
        <Controller
          control={control}
          name="direction"
          render={({ field }) => (
            <Segmented
              label={t('upcoming.form.eyebrow')}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'outgoing' as const, label: t('upcoming.form.direction.outgoing') },
                { value: 'incoming' as const, label: t('upcoming.form.direction.incoming') },
              ]}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              label={t('upcoming.form.amount')}
              placeholder="0"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label={t('upcoming.form.name')}
              placeholder={t(
                isOutgoing
                  ? 'upcoming.form.namePlaceholderOutgoing'
                  : 'upcoming.form.namePlaceholderIncoming',
              )}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="expectedDate"
          render={({ field }) => (
            <DateField
              label={t('upcoming.form.expectedDate')}
              value={field.value}
              onChange={field.onChange}
              error={errors.expectedDate?.message}
            />
          )}
        />

        {/* Outgoing asks for the wallet up front: it is required, and the goal
            impact below cannot be worked out without it. */}
        {isOutgoing ? walletSection : null}

        <Disclosure
          open={detailsOpen}
          onToggle={() => setDetailsOpen((value) => !value)}
          label={t('upcoming.form.moreDetails')}
        >
          <Controller
            control={control}
            name="recurrence"
            render={({ field }) => (
              <Select
                label={t('upcoming.form.recurrence')}
                value={field.value}
                options={RECURRENCE_OPTIONS.map((option) => ({
                  value: option,
                  label: t(`upcoming.form.recurrenceOption.${option}`),
                }))}
                onChange={field.onChange}
              />
            )}
          />

          {/* Outgoing only. The backend forces `null` for incoming — you do not
              "have to" receive money — so the field is hidden, not disabled. */}
          {isOutgoing ? (
            <Controller
              control={control}
              name="requirement"
              render={({ field }) => (
                <Segmented
                  label={t('upcoming.form.requirement')}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'required' as const, label: t('upcoming.markers.required') },
                    { value: 'planned' as const, label: t('upcoming.markers.planned') },
                  ]}
                />
              )}
            />
          ) : null}

          <View>
            <Controller
              control={control}
              name="certainty"
              render={({ field }) => (
                <Segmented
                  label={t('upcoming.form.certainty')}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'confirmed' as const, label: t('upcoming.markers.confirmed') },
                    { value: 'estimated' as const, label: t('upcoming.markers.estimated') },
                  ]}
                />
              )}
            />
            {/* `estimated` incoming is displayed but never banked. Say so where
                the choice is made, not only on the timeline afterwards. */}
            {!isOutgoing && certainty === 'estimated' ? (
              <Text className="mt-1.5 text-[12px] leading-4 text-ink3">
                {t('upcoming.form.estimatedIncomingHint')}
              </Text>
            ) : null}
          </View>

          {isOutgoing ? null : walletSection}

          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Field
                label={t('upcoming.form.note')}
                placeholder={t('upcoming.form.notePlaceholder')}
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

        {/* What this outflow costs the goals on that wallet, and what it leaves
            for the bills after it. Below the details fold: it is the only block
            here that REPORTS rather than asks, and it moves on every keystroke,
            so sitting among the inputs made it read as one more field. `Sunk`
            gives it its own surface. Renders nothing when no goal is affected. */}
        {isOutgoing ? (
          <GoalImpactNotice
            assetId={settlementAssetId || undefined}
            amount={cashflowAmountToVnd(amount)}
            excludeEventId={editingId ?? undefined}
            expectedDate={expectedDate}
          />
        ) : null}
      </View>
    </BottomSheet>
  )
}

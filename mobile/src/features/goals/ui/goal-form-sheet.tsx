import { Controller } from 'react-hook-form'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { parseAmount } from '@money-space/core/features/goals/model/goals'
import { formatAmount, type GoalForm } from '@money-space/core/features/goals/model/goals-form'

import {
  BottomSheet,
  Button,
  ConsequenceNote,
  DateField,
  Field,
  Label,
  MoneyInput,
  Segmented,
  Sunk,
} from '@/components/ui'
import { GoalAllocationsField } from '@/features/goals/ui/goal-allocations-field'

import type { AllocationAssetOption } from '@/features/goals/ui/types'
import type { UseFormReturn } from 'react-hook-form'

/**
 * Create or edit a goal, in a sheet.
 *
 * The web renders this as a three-step builder in a 782-line dialog. A phone
 * has neither the height for a step rail nor the reason for one: the sheet
 * scrolls, so "name, amount, when, which money" is one continuous read, and a
 * wizard would add two taps and a back button to a four-field form.
 *
 * What survives from the builder is the part that carries meaning — the
 * consequence line, and the split between what a wallet already holds and what
 * it puts in each month. What is dropped is the review step: on a sheet the
 * fields are still on screen when the button is pressed, so a screen that
 * repeats them back adds a page and no information.
 *
 * Two invariants from §22.10 hold here:
 *  - the primary button is **never disabled** — pressing it runs core's schema
 *    and says what is missing, rather than leaving the household guessing;
 *  - allocations are **create-only**. Once the goal exists each share is edited
 *    on its own, where the write can be checked against what the asset still
 *    has free — so the field is not rendered while editing, and the API ignores
 *    it anyway.
 */
export function GoalFormSheet({
  open,
  onClose,
  form,
  assetOptions,
  contestedWalletIds,
  walletGoalNames,
  isEditing,
  isSubmitting,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  form: UseFormReturn<GoalForm>
  assetOptions: AllocationAssetOption[]
  contestedWalletIds?: ReadonlySet<string>
  walletGoalNames?: ReadonlyMap<string, string[]>
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const { control, formState, watch } = form
  const errors = formState.errors

  const target = parseAmount(watch('target') || '')
  const current = parseAmount(watch('current') || '')
  const remaining = Math.max(target - current, 0)

  // The pace comes from the wallet shares below, never from a field on the
  // goal: a figure typed on the goal names no account the money comes out of.
  const monthlyFromWallets = watch('allocations').reduce(
    (sum, row) =>
      row.role === 'contribution' ? sum + parseAmount(row.monthlyContribution || '') : sum,
    0,
  )
  const months =
    monthlyFromWallets > 0 && remaining > 0
      ? Math.ceil(remaining / monthlyFromWallets)
      : null

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
      footer={
        <View className="gap-2">
          {/* Never disabled (§22.10). `loading` blocks the press without
              dimming the control into a dead end. */}
          <Button onPress={onSubmit} loading={isSubmitting}>
            {isEditing ? t('goals.form.save') : t('goals.form.submit')}
          </Button>
          <Button variant="secondary" onPress={onClose}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label={t('goals.form.name')}
              placeholder={t('goals.form.namePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="target"
          render={({ field }) => (
            <MoneyInput
              label={t('goals.form.target')}
              placeholder={t('goals.form.targetPlaceholder')}
              value={field.value}
              onChange={field.onChange}
              error={errors.target?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="targetDate"
          render={({ field }) => (
            <DateField
              label={t('goals.form.deadline')}
              value={field.value}
              onChange={field.onChange}
              error={errors.targetDate?.message}
            />
          )}
        />

        {/* Priority is what decides which goal a shared wallet pays first, so
            it is a real choice with a real consequence — hence the helper. */}
        <View>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Segmented
                label={t('goals.form.priority')}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'high', label: t('options.priority.high') },
                  { value: 'medium', label: t('options.priority.medium') },
                  { value: 'low', label: t('options.priority.low') },
                ]}
              />
            )}
          />
          <Text className="mt-1.5 t-caption-sm leading-4 text-ink3">
            {t('goals.builder.priorityHelp')}
          </Text>
        </View>

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <Field
              label={t('goals.form.note')}
              placeholder={t('goals.form.notePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.note?.message}
            />
          )}
        />

        {isEditing ? (
          // Editing changes the plan, not the money. The progress figure is
          // derived from the shares and the API refuses it on PATCH, so it is
          // shown as context and never as a field.
          <Sunk>
            <Label>{t('goals.form.currentLocked')}</Label>
            <Text
              className="mt-1.5 t-subtitle text-ink"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatAmount(current)}
            </Text>
            <Text className="mt-1.5 t-caption-sm leading-4 text-ink3">
              {t('goals.builder.sourcesManagedSeparately')}
            </Text>
          </Sunk>
        ) : (
          <View>
            <Text className="mb-1.5 t-body-sm text-ink2">{t('goals.form.allocations')}</Text>
            <Text className="mb-3 t-caption-sm leading-4 text-ink3">
              {t('goals.builder.sourceDescription')}
            </Text>
            <Controller
              control={control}
              name="allocations"
              render={({ field }) => (
                <GoalAllocationsField
                  value={field.value}
                  onChange={field.onChange}
                  assetOptions={assetOptions}
                  error={errors.allocations?.message ?? errors.allocations?.root?.message}
                  contestedWalletIds={contestedWalletIds}
                  walletGoalNames={walletGoalNames}
                />
              )}
            />
          </View>
        )}

        {/* §22.7 — one sentence, not a grid of labelled metrics. It says what
            the numbers above amount to, and it is the only place the form
            derives anything. */}
        {target > 0 ? (
          <ConsequenceNote>
            {t('goals.form.consequenceRemaining')} {formatAmount(remaining)}
            {months !== null ? `. ${t('goals.form.consequenceMonths', { count: months })}` : '.'}
          </ConsequenceNote>
        ) : null}

        {/* No wallet declares a monthly amount, so there is no honest projected
            date — progress only. Said here rather than discovered later on the
            detail screen, where the missing date has no explanation. */}
        {!isEditing && monthlyFromWallets <= 0 ? (
          <Text className="t-caption-sm leading-4 text-ink3">{t('goals.form.monthlyEmpty')}</Text>
        ) : null}
      </View>
    </BottomSheet>
  )
}

import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react-native'

import type {
  Control,
  FieldErrors,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form'

import type { DebtForm } from '@money-space/core/features/debts/model/debts-form'
import {
  toMonthStartIso,
  withDayOfMonth,
} from '@money-space/core/features/debts/model/debts-interest'
import {
  isFixedScheduleLender,
  type LenderType,
} from '@money-space/core/features/debts/model/debts.types'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'
import { cn } from '@money-space/core/shared/lib/utils'

import {
  BottomSheet,
  Button,
  CaveatNote,
  ConsequenceNote,
  DateField,
  DecimalInput,
  Field,
  MoneyInput,
  MonthField,
  Segmented,
  Select,
  Sunk,
  Switch,
} from '@/components/ui'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

type Option = { value: string; label: string }
type Step = 1 | 2 | 3 | 4 | 5 | 6

const LAST_STEP: Step = 6

const STEPS: Step[] = [1, 2, 3, 4, 5, 6]
const STEP_KEYS: Record<Step, string> = {
  1: 'debt',
  2: 'amount',
  3: 'received',
  4: 'schedule',
  5: 'interest',
  6: 'review',
}

/**
 * The fields each step may block on. Advancing validates only these, so a
 * later step's missing value never traps the user on an earlier one. The
 * conditionally-required ones (`expectedFinalDueDate` / `interestPeriods` for a
 * bank loan, `firstPaymentDate` once a frequency is set) are listed on the step
 * whose UI actually renders their error. The per-period amount sits on the
 * interest step, not the schedule one: its suggested value is only right once
 * we know whether the loan charges interest.
 */
const STEP_FIELDS: Record<Step, (keyof DebtForm)[]> = {
  1: ['name', 'lenderName'],
  2: ['originalAmount', 'outstandingAmount'],
  3: ['borrowedAt'],
  4: ['paymentFrequency', 'firstPaymentDate', 'expectedFinalDueDate'],
  5: ['interestPeriods', 'fixedPaymentAmount'],
  6: [],
}

type DebtFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  control: Control<DebtForm>
  errors: FieldErrors<DebtForm>
  isSavingDebt: boolean
  setValue: UseFormSetValue<DebtForm>
  trigger: UseFormTrigger<DebtForm>
  selectedLenderType: LenderType
  setShowMoreDetails: (updater: (value: boolean) => boolean) => void
  receiveAssetOptions: Option[]
  memberOptions: Option[]
  termMonths: number | null
  submit: () => void
}

/**
 * Create / edit a debt, as a bottom sheet.
 *
 * Four steps rather than one long scroll: a debt carries ~15 fields and only
 * five of them are ever required, so asking for all of them at once reads as a
 * much bigger job than it is. The steps are what the web wizard uses, kept
 * identical so the two clients ask the same questions in the same order.
 *
 * The primary button is NEVER disabled (§22.10). Pressing "Tiếp tục" on an
 * incomplete step validates it and says what is missing; pressing "Lưu" on an
 * invalid form does the same. A disabled button hides the reason it is
 * disabled, which on a four-step form is a dead end with no explanation.
 */
export function DebtFormSheet({
  open,
  onOpenChange,
  editingId,
  control,
  errors,
  isSavingDebt,
  setValue,
  trigger,
  selectedLenderType,
  setShowMoreDetails,
  receiveAssetOptions,
  memberOptions,
  termMonths,
  submit,
}: DebtFormSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  // Once the user types their own outstanding balance it stops following the
  // borrowed amount. An existing debt starts untouched too — its saved balance
  // has already drifted through repayments, so nothing may overwrite it.
  const [outstandingTouched, setOutstandingTouched] = useState(false)
  const mirrorOutstanding = !outstandingTouched && !editingId

  const {
    fields: interestFields,
    append: appendInterest,
    remove: removeInterest,
  } = useFieldArray({ control, name: 'interestPeriods' })

  const hasInterest = useWatch({ control, name: 'hasInterest' })
  const borrowedAt = useWatch({ control, name: 'borrowedAt' })
  const firstPaymentDate = useWatch({ control, name: 'firstPaymentDate' })
  const expectedFinalDueDate = useWatch({ control, name: 'expectedFinalDueDate' })
  const watchedPeriods = useWatch({ control, name: 'interestPeriods' })
  const name = useWatch({ control, name: 'name' })
  const lenderName = useWatch({ control, name: 'lenderName' })
  const originalAmount = useWatch({ control, name: 'originalAmount' })
  const outstandingAmount = useWatch({ control, name: 'outstandingAmount' })
  const paymentFrequency = useWatch({ control, name: 'paymentFrequency' })
  const fixedPaymentAmount = useWatch({ control, name: 'fixedPaymentAmount' })
  const receivedToAssetId = useWatch({ control, name: 'receivedToAssetId' })
  const ownerMemberId = useWatch({ control, name: 'ownerMemberId' })
  const interestCalc = useWatch({ control, name: 'interestCalc' })

  const earlierStagesMonths = (watchedPeriods ?? []).slice(0, -1).reduce((sum, period) => {
    const months = Number(String(period?.months ?? '').replace(',', '.'))
    return sum + (Number.isFinite(months) && months > 0 ? months : 0)
  }, 0)
  const lastStageMonths = termMonths != null ? Math.max(0, termMonths - earlierStagesMonths) : null
  const receivedAssetName = receiveAssetOptions.find(
    (option) => option.value === receivedToAssetId,
  )?.label
  const ownerName = memberOptions.find((option) => option.value === ownerMemberId)?.label

  /**
   * The day the final payment lands on. It follows the first repayment — the
   * payoff month is picked, its day is never asked for twice. Before a
   * first-payment date exists we anchor on the borrow date, the only other date
   * we have.
   */
  const interestIsOptional = !isFixedScheduleLender(selectedLenderType)

  const dueAnchor = firstPaymentDate || borrowedAt

  function goToStep(next: Step) {
    setStep(next)
    setShowMoreDetails(() => next > 1)
  }

  /**
   * Move forward only once every step between here and the target passes.
   * Going back is always allowed — the user is returning to fix something, and
   * re-validating there would flag fields they have not reached.
   */
  async function requestStep(next: Step) {
    if (next <= step) {
      goToStep(next)
      return
    }
    for (let current = step; current < next; current += 1) {
      const fields = STEP_FIELDS[current as Step]
      // Sequential on purpose: steps must fail in order, so the user lands on
      // the earliest one still missing input.
      const ok = fields.length === 0 || (await trigger(fields, { shouldFocus: true }))
      if (!ok) {
        goToStep(current as Step)
        return
      }
    }
    goToStep(next)
  }

  function handleClose() {
    goToStep(1)
    setOutstandingTouched(false)
    onOpenChange(false)
  }

  /**
   * A bank/institution loan is a fixed-schedule debt: a rate is required, so
   * interest is not a choice there. Switching the lender type to a bank after
   * turning interest off would otherwise leave the form in a state validation
   * rejects with the switch no longer on screen to fix it.
   */
  useEffect(() => {
    if (!interestIsOptional && !hasInterest) {
      setValue('hasInterest', true, { shouldDirty: true, shouldValidate: true })
    }
  }, [interestIsOptional, hasInterest, setValue])

  /**
   * The final due date is chosen as a month; the day it lands on is the day the
   * repayments land on. Re-anchor it whenever that day moves, so changing the
   * first payment date after picking a month does not leave the two out of step.
   */
  useEffect(() => {
    if (!expectedFinalDueDate || !dueAnchor) return
    const merged = withDayOfMonth(expectedFinalDueDate, dueAnchor)
    if (merged && merged !== expectedFinalDueDate) {
      setValue('expectedFinalDueDate', merged, { shouldValidate: true })
    }
  }, [expectedFinalDueDate, dueAnchor, setValue])

  /**
   * The borrowed amount is the one number the user must supply. While the
   * outstanding balance is untouched it tracks this, so a loan nobody has
   * repaid needs one figure instead of the same figure twice.
   */
  function updateOriginalAmount(value: string) {
    setValue('originalAmount', value, { shouldDirty: true, shouldValidate: true })
    if (mirrorOutstanding) {
      setValue('outstandingAmount', value, { shouldDirty: true, shouldValidate: true })
    }
  }

  const footer = (
    <View className="flex-row items-center gap-2">
      {step > 1 ? (
        <Button
          className="flex-1"
          variant="secondary"
          onPress={() => goToStep((step - 1) as Step)}
        >
          {t('debts.form.actions.back')}
        </Button>
      ) : null}

      {step < LAST_STEP ? (
        <Button className="flex-1" onPress={() => void requestStep((step + 1) as Step)}>
          {t(step === LAST_STEP - 1 ? 'debts.form.actions.review' : 'debts.form.actions.continue')}
        </Button>
      ) : (
        <Button className="flex-1" onPress={submit} loading={isSavingDebt}>
          {editingId ? t('debts.form.actions.save') : t('debts.form.actions.create')}
        </Button>
      )}
    </View>
  )

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={editingId ? t('debts.form.editTitle') : t('debts.form.createTitle')}
      footer={footer}
    >
      {/* The step rail. Six lanes leave no room for a label under each, so the
          bar carries position only and the current step is named beside the
          count — the web's sidebar does not fit a 375pt screen. */}
      <View className="mb-5 gap-2">
        <View className="flex-row items-baseline justify-between gap-3">
          <Text className="t-caption text-ink3">
            {t('debts.form.rail.stepOf', { step, total: LAST_STEP })}
          </Text>
          <Text className="t-body-sm font-medium text-ink" numberOfLines={1}>
            {t(`debts.form.steps.${STEP_KEYS[step]}`)}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          {STEPS.map((item) => (
            <Pressable
              key={item}
              onPress={() => void requestStep(item)}
              accessibilityRole="tab"
              accessibilityState={{ selected: step === item }}
              accessibilityLabel={t(`debts.form.steps.${STEP_KEYS[item]}`)}
              style={{ minHeight: TOUCH_TARGET - 28 }}
              className="flex-1 justify-center"
            >
              <View
                className={cn(
                  'h-[3px] rounded-full',
                  item <= step ? 'bg-action' : 'bg-committed',
                )}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {step === 1 ? (
        <View className="gap-4">
          <StepHeading title={t('debts.form.sections.debt')} />

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Field
                label={t('debts.form.fields.name')}
                placeholder={t('debts.form.fields.namePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="lenderName"
            render={({ field }) => (
              <Field
                label={t('debts.form.fields.lender')}
                placeholder={t('debts.form.fields.lenderPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.lenderName?.message}
              />
            )}
          />

          {/* Three short options that all fit — a sheet to reveal them would
              cost a tap and hide the alternatives (§Segmented). */}
          <Controller
            control={control}
            name="lenderType"
            render={({ field }) => (
              <Segmented
                label={t('debts.form.fields.lenderType')}
                value={field.value}
                options={[
                  { value: 'relative' as const, label: t('debts.form.lenderType.relative') },
                  {
                    value: 'bank_institution' as const,
                    label: t('debts.form.lenderType.bank_institution'),
                  },
                  { value: 'other' as const, label: t('debts.form.lenderType.other') },
                ]}
                onChange={field.onChange}
              />
            )}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-4">
          <StepHeading title={t('debts.form.sections.amount')} />

          <Controller
            control={control}
            name="originalAmount"
            render={({ field }) => (
              <MoneyInput
                label={t('debts.form.fields.originalAmount')}
                value={field.value}
                onChange={updateOriginalAmount}
                error={errors.originalAmount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="outstandingAmount"
            render={({ field }) => (
              <View>
                <MoneyInput
                  label={t('debts.form.fields.outstanding')}
                  value={field.value}
                  onChange={(value) => {
                    setOutstandingTouched(true)
                    setValue('outstandingAmount', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  error={errors.outstandingAmount?.message}
                />
                {!errors.outstandingAmount ? (
                  <Text className="mt-1.5 t-caption leading-4 text-ink3">
                    {t('debts.form.fields.outstandingHint')}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-4">
          <StepHeading title={t('debts.form.sections.received')} />

          <Controller
            control={control}
            name="ownerMemberId"
            render={({ field }) => (
              <Select
                label={t('debts.form.fields.owner')}
                placeholder={t('debts.form.fields.ownerPlaceholder')}
                value={field.value || null}
                options={memberOptions}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="borrowedAt"
            render={({ field }) => (
              <DateField
                label={t('debts.form.fields.borrowedAt')}
                value={field.value}
                onChange={field.onChange}
                error={errors.borrowedAt?.message}
              />
            )}
          />

          {/* Borrowed money lands in a spendable wallet, never a valued asset —
              `receiveAssetOptions` is already filtered to cash / bank account
              in core (see memory/debts.md). */}
          <Sunk>
            <Switch
              label={t('debts.form.fields.received')}
              value={Boolean(receivedToAssetId)}
              onChange={(enabled) =>
                setValue('receivedToAssetId', enabled ? (receiveAssetOptions[0]?.value ?? '') : '', {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            {receivedToAssetId ? (
              <Controller
                control={control}
                name="receivedToAssetId"
                render={({ field }) => (
                  <Select
                    className="mt-3"
                    label={t('debts.form.fields.receivedDestination')}
                    placeholder={t('debts.form.fields.receivedPlaceholder')}
                    value={field.value || null}
                    options={receiveAssetOptions}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : null}
          </Sunk>
        </View>
      ) : null}
      {step === 4 ? (
        <View className="gap-4">
          <StepHeading title={t('debts.form.sections.schedule')} />

          <Controller
            control={control}
            name="paymentFrequency"
            render={({ field }) => (
              <Segmented
                label={t('debts.form.fields.frequency')}
                value={field.value}
                options={[
                  { value: 'monthly' as const, label: t('debts.form.frequency.monthly') },
                  { value: 'quarterly' as const, label: t('debts.form.frequency.quarterly') },
                  { value: 'yearly' as const, label: t('debts.form.frequency.yearly') },
                  { value: 'none' as const, label: t('debts.form.frequency.none') },
                ]}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="firstPaymentDate"
            render={({ field }) => (
              <View>
                <DateField
                  label={t('debts.form.fields.firstPaymentDate')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.firstPaymentDate?.message}
                />
                {!errors.firstPaymentDate ? (
                  <Text className="mt-1.5 t-caption leading-4 text-ink3">
                    {t('debts.form.fields.firstPaymentDateHelp')}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="expectedFinalDueDate"
            render={({ field }) => (
              <MonthField
                label={t('debts.form.fields.finalDueDate')}
                value={toMonthStartIso(field.value)}
                onChange={(month) => field.onChange(withDayOfMonth(month, dueAnchor))}
                error={errors.expectedFinalDueDate?.message}
              />
            )}
          />


          {/* The repayment wallet is a DEFAULT, not a binding — the household
              repays from whichever wallet suits that month (memory/debts.md).
              Only meaningful once there is a schedule to pre-fill. */}
          {paymentFrequency !== 'none' ? (
            <Controller
              control={control}
              name="repaymentAssetId"
              render={({ field }) => (
                <View>
                  <Select
                    label={t('debts.form.fields.repaymentAsset')}
                    placeholder={t('debts.form.fields.repaymentAssetPlaceholder')}
                    value={field.value || null}
                    options={receiveAssetOptions}
                    onChange={field.onChange}
                  />
                  <Text className="mt-1.5 t-caption leading-4 text-ink3">
                    {t('debts.form.fields.repaymentAssetHint')}
                  </Text>
                </View>
              )}
            />
          ) : null}
        </View>
      ) : null}

      {step === 5 ? (
        <View className="gap-4">
          <StepHeading title={t('debts.form.sections.interest')} />

          {/* A bank/institution loan is a fixed-schedule debt: rate, term and a
              fixed payment are all required (memory/debts.md). */}
          {!interestIsOptional ? (
            <CaveatNote>{t('debts.form.bankRequirement')}</CaveatNote>
          ) : null}

          <Sunk>
            {/* No switch for a bank loan: the rules REQUIRE a rate, so offering a
                choice that validation then refuses is a question with one answer.
                The note above already says why, and the effect on
                `interestIsOptional` keeps the stored value honest. */}
            {interestIsOptional ? (
              <Controller
                control={control}
                name="hasInterest"
                render={({ field }) => (
                  <Switch
                    label={t('debts.form.fields.hasInterest')}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : null}

            {hasInterest ? (
              <View className="mt-4 gap-4">
                <View>
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="t-body-sm text-ink2">
                      {t('debts.form.fields.interestPeriods')}
                    </Text>
                    <Pressable
                      onPress={() => appendInterest({ ratePct: '', months: '' })}
                      accessibilityRole="button"
                      accessibilityLabel={t('debts.form.interestPeriods.add')}
                      style={{ minHeight: TOUCH_TARGET }}
                      className="flex-row items-center gap-1"
                    >
                      <Plus size={15} color={colors.interactive} strokeWidth={2} />
                      <Text className="t-body-sm font-medium text-action">
                        {t('debts.form.interestPeriods.add')}
                      </Text>
                    </Pressable>
                  </View>

                  <View className="gap-3">
                    {interestFields.map((item, index) => {
                      const isLast = index === interestFields.length - 1
                      return (
                        <View key={item.id} className="rounded-control bg-card p-3">
                          <View className="flex-row items-end gap-3">
                            {/* A rate is a decimal, not money — "8,2" must not
                                group into "8.2 nghìn". */}
                            <Controller
                              control={control}
                              name={`interestPeriods.${index}.ratePct` as const}
                              render={({ field }) => (
                                <DecimalInput
                                  className="flex-1"
                                  label={t('debts.form.fields.annualRate')}
                                  placeholder="8,2"
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              )}
                            />

                            {/* The last stage always absorbs the remaining
                                term, so it is shown computed, never typed. */}
                            {isLast ? (
                              <View className="flex-1">
                                <Text className="mb-1.5 t-body-sm text-ink2">
                                  {t('debts.form.fields.duration')}
                                </Text>
                                <View className="h-[46px] justify-center rounded-control bg-wash px-3.5">
                                  <Text className="t-body-sm text-ink2">
                                    {lastStageMonths != null
                                      ? t('debts.form.interestPeriods.months', {
                                          count: lastStageMonths,
                                        })
                                      : t('debts.form.interestPeriods.unknownMonths')}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <Controller
                                control={control}
                                name={`interestPeriods.${index}.months` as const}
                                render={({ field }) => (
                                  <Field
                                    className="flex-1"
                                    label={t('debts.form.fields.duration')}
                                    placeholder="12"
                                    value={field.value}
                                    onChangeText={(next) =>
                                      field.onChange(sanitizeIntegerInput(next))
                                    }
                                    onBlur={field.onBlur}
                                    keyboardType="number-pad"
                                  />
                                )}
                              />
                            )}

                            {interestFields.length > 1 ? (
                              <Pressable
                                onPress={() => removeInterest(index)}
                                accessibilityRole="button"
                                accessibilityLabel={t('debts.form.interestPeriods.remove')}
                                style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
                                className="items-center justify-center rounded-control"
                              >
                                <X size={16} color={colors.alert} strokeWidth={2} />
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      )
                    })}
                  </View>

                  {errors.interestPeriods?.message ? (
                    <Text className="mt-1.5 t-caption text-alert-ink">
                      {errors.interestPeriods.message}
                    </Text>
                  ) : null}
                  <Text className="mt-2 t-caption leading-4 text-ink3">
                    {t('debts.form.interestPeriods.remainingHint')}
                  </Text>
                </View>

                <Controller
                  control={control}
                  name="interestCalc"
                  render={({ field }) => (
                    <View>
                      <Segmented
                        label={t('debts.form.fields.interestCalc')}
                        value={field.value}
                        options={[
                          { value: 'reducing' as const, label: t('debts.form.calc.reducing') },
                          { value: 'fixed' as const, label: t('debts.form.calc.fixed') },
                        ]}
                        onChange={field.onChange}
                      />
                      <Text className="mt-1.5 t-caption leading-4 text-ink3">
                        {t(
                          field.value === 'reducing'
                            ? 'debts.form.calc.reducingHint'
                            : 'debts.form.calc.fixedHint',
                        )}
                      </Text>
                    </View>
                  )}
                />
              </View>
            ) : null}
          </Sunk>

          <Controller
            control={control}
            name="fixedPaymentAmount"
            render={({ field }) => (
              <MoneyInput
                label={t('debts.form.fields.paymentAmount')}
                placeholder={t('debts.form.fields.paymentPlaceholder')}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  setValue('fixedPaymentTouched', true, { shouldDirty: true })
                }}
                error={errors.fixedPaymentAmount?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Field
                label={t('debts.form.fields.note')}
                placeholder={t('debts.form.fields.notePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                numberOfLines={3}
                // `Field` is a 46pt single-line control; the style prop is
                // applied after its own, which is what gives the note room.
                style={{ height: 92, paddingTop: 11, textAlignVertical: 'top' }}
              />
            )}
          />
        </View>
      ) : null}

      {step === 6 ? (
        <View className="gap-4">
          <StepHeading title={t(editingId ? 'debts.form.sections.reviewEdit' : 'debts.form.sections.reviewCreate')} />

          <Sunk>
            <View className="gap-2.5">
              <ReviewRow label={t('debts.form.fields.name')} value={name || '—'} />
              <ReviewRow label={t('debts.form.fields.lender')} value={lenderName || '—'} />
              <ReviewRow
                label={t('debts.form.fields.outstanding')}
                value={reviewMoney(outstandingAmount)}
                numeric
              />
              <ReviewRow
                label={t('debts.form.fields.originalAmount')}
                value={reviewMoney(originalAmount)}
                numeric
              />
              <ReviewRow
                label={t('debts.form.fields.lenderType')}
                value={t(`debts.form.lenderType.${selectedLenderType}`)}
              />
              <ReviewRow
                label={t('debts.form.fields.firstPaymentDate')}
                value={displayIso(firstPaymentDate)}
                mono
              />
              <ReviewRow
                label={t('debts.form.fields.finalDueDate')}
                value={displayIso(expectedFinalDueDate)}
                mono
              />
              <ReviewRow
                label={t('debts.form.fields.frequency')}
                value={t(`debts.form.frequency.${paymentFrequency ?? 'none'}`)}
              />
              <ReviewRow
                label={t('debts.form.fields.paymentAmount')}
                value={reviewMoney(fixedPaymentAmount)}
                numeric
              />
              <ReviewRow
                label={t('debts.form.steps.interest')}
                value={
                  hasInterest
                    ? `${watchedPeriods?.[0]?.ratePct || '—'}% · ${t(
                        interestCalc === 'reducing'
                          ? 'debts.form.calc.reducing'
                          : 'debts.form.calc.fixed',
                      )}`
                    : t('debts.form.review.noInterest')
                }
              />
              <ReviewRow
                label={t('debts.form.fields.owner')}
                value={ownerName || t('debts.form.review.unassigned')}
              />
              <ReviewRow
                label={t('debts.form.fields.receivedDestination')}
                value={receivedAssetName || t('debts.form.review.notRecorded')}
              />
            </View>
          </Sunk>

          <ConsequenceNote>{t('debts.form.review.notice')}</ConsequenceNote>
        </View>
      ) : null}
    </BottomSheet>
  )
}

/** `—` when there is nothing yet: never `0đ` for "not entered" (§Invariant 2). */
function reviewMoney(raw: string) {
  const amount = Number(sanitizeIntegerInput(raw ?? ''))
  if (!amount || !Number.isFinite(amount)) return '—'
  return formatVndShort(amount)
}

/** ISO → `dd/mm/yyyy`. ASCII, so the mono face is safe on it. */
function displayIso(iso: string) {
  const [year, month, day] = (iso ?? '').split('-')
  return year && month && day ? `${day}/${month}/${year}` : '—'
}

/**
 * Each step asks one question, and the heading is the whole of it — a sub-line
 * restating the question in other words is copy the reader has to read twice to
 * learn nothing.
 */
function StepHeading({ title }: { title: string }) {
  return <Text className="t-title text-ink">{title}</Text>
}

function ReviewRow({
  label,
  value,
  numeric,
  mono,
}: {
  label: string
  value: string
  numeric?: boolean
  mono?: boolean
}) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="flex-shrink t-body-sm text-ink2">{label}</Text>
      <Text
        className={cn('flex-1 text-right t-body-sm font-medium text-ink', mono && 'font-mono')}
        // Money never truncates, so it wraps rather than ellipsing.
        style={numeric ? { fontVariant: ['tabular-nums'] } : undefined}
      >
        {value}
      </Text>
    </View>
  )
}

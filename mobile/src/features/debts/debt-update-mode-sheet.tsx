import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type {
  DebtBalanceIntent,
  DebtUpdateModeChoice,
  DebtUpdateSnapshot,
} from '@money-space/core/features/debts/model/debts.types'
import { TODAY } from '@money-space/core/features/events/model/events-form'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet, Button, CaveatNote, DateField, Sunk } from '@/components/ui'
import { TOUCH_TARGET } from '@/theme/tokens'

type ModeKind = 'correction' | 'effective'

type DebtUpdateModeSheetProps = {
  open: boolean
  onClose: () => void
  /** True when the user changed the loan amount — surfaces the 3-way intent. */
  originalAmountChanged: boolean
  before?: DebtUpdateSnapshot
  after?: DebtUpdateSnapshot
  /** Sum of recorded repayments — recomputes outstanding under a correction. */
  totalRepaid: number
  isSubmitting: boolean
  onConfirm: (choice: DebtUpdateModeChoice) => void
}

/**
 * "This debt already has transactions — what kind of change is this?"
 *
 * The backend REFUSES an edit to a debt with money-event history unless it is
 * told how to read it, and the two readings write different history:
 *
 *  - **correction** rewrites the record, as if the wrong number had never been
 *    entered. Outstanding becomes `max(0, corrected original − total repaid)`.
 *  - **effective** dates the new terms so past events keep their meaning. The
 *    backend APPENDS a period rather than rewriting, so the old instalments
 *    stay valid at the old rate.
 *
 * A changed loan amount is ambiguous in a third way, so it asks for an intent
 * instead: a typo (correction), new money borrowed (`additional_disbursement`),
 * or the statement disagreeing with the app (`reconcile_balance`). See
 * memory/debts.md for how outstanding is recomputed in each case.
 *
 * The preview is the point of the whole screen — it is the only place the
 * consequence of the three readings is visible before it is committed.
 */
export function DebtUpdateModeSheet({
  open,
  onClose,
  originalAmountChanged,
  before,
  after,
  totalRepaid,
  isSubmitting,
  onConfirm,
}: DebtUpdateModeSheetProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ModeKind>('correction')
  const [effectiveDate, setEffectiveDate] = useState<string>(TODAY)
  // Only relevant once the loan amount changed. The intent both classifies the
  // change and, for `fix_original`, forces correction mode.
  const [balanceIntent, setBalanceIntent] = useState<DebtBalanceIntent>('fix_original')

  function chooseIntent(intent: DebtBalanceIntent) {
    setBalanceIntent(intent)
    setMode(intent === 'fix_original' ? 'correction' : 'effective')
  }

  // Mirrors the backend. Reconcile / additional-disbursement carry their amount
  // in the same loan-amount field the form used.
  function computeAfterOutstanding(): number | undefined {
    if (!before || !after) return undefined
    const beforeOutstanding = before.outstandingAmount ?? 0
    if (mode === 'correction') {
      return Math.max(0, after.originalAmount - totalRepaid)
    }
    if (originalAmountChanged && balanceIntent === 'additional_disbursement') {
      return beforeOutstanding + (after.originalAmount - before.originalAmount)
    }
    if (originalAmountChanged && balanceIntent === 'reconcile_balance') {
      return after.originalAmount
    }
    // Effective with no balance change: outstanding is untouched.
    return beforeOutstanding
  }

  const afterOutstanding = computeAfterOutstanding()
  // In a reconcile the number typed into the loan-amount field is the new
  // OUTSTANDING, not a new original — so the original shows as unchanged.
  const isReconcile =
    mode === 'effective' && originalAmountChanged && balanceIntent === 'reconcile_balance'
  const afterOriginal = isReconcile ? before?.originalAmount : after?.originalAmount

  // Whether any preview row will actually render (rows self-hide unchanged).
  const hasVisibleChange =
    !!before &&
    !!after &&
    (before.name !== after.name ||
      before.lenderType !== after.lenderType ||
      before.originalAmount !== afterOriginal ||
      (before.outstandingAmount ?? 0) !== (afterOutstanding ?? 0) ||
      (mode === 'correction' &&
        (before.fixedPaymentAmount !== after.fixedPaymentAmount ||
          before.interestRate !== after.interestRate ||
          before.installments !== after.installments)))

  function handleConfirm() {
    if (mode === 'correction') {
      onConfirm({ kind: 'correction' })
      return
    }
    onConfirm({
      kind: 'effective',
      effectiveDate,
      balanceIntent: originalAmountChanged ? balanceIntent : undefined,
    })
  }

  const footer = (
    <View className="flex-row items-center gap-2">
      <Button className="flex-1" variant="secondary" onPress={onClose}>
        {t('debts.updateMode.actions.back')}
      </Button>
      <Button className="flex-1" onPress={handleConfirm} loading={isSubmitting}>
        {t('debts.updateMode.actions.confirm')}
      </Button>
    </View>
  )

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('debts.updateMode.title')}
      footer={footer}
    >
      <Text className="t-body-sm leading-5 text-ink2">
        {t('debts.updateMode.description')}
      </Text>

      <View className="mt-5 gap-2">
        {originalAmountChanged ? (
          <>
            <Text className="t-body-sm font-medium text-ink2">
              {t('debts.updateMode.amountQuestion')}
            </Text>
            <ModeOption
              active={balanceIntent === 'fix_original'}
              title={t('debts.updateMode.options.fixOriginal')}
              hint={t('debts.updateMode.options.fixOriginalHint')}
              onPress={() => chooseIntent('fix_original')}
            />
            <ModeOption
              active={balanceIntent === 'additional_disbursement'}
              title={t('debts.updateMode.options.additionalDisbursement')}
              hint={t('debts.updateMode.options.additionalDisbursementHint')}
              onPress={() => chooseIntent('additional_disbursement')}
            />
            <ModeOption
              active={balanceIntent === 'reconcile_balance'}
              title={t('debts.updateMode.options.reconcileBalance')}
              hint={t('debts.updateMode.options.reconcileBalanceHint')}
              onPress={() => chooseIntent('reconcile_balance')}
            />
          </>
        ) : (
          <>
            <ModeOption
              active={mode === 'correction'}
              title={t('debts.updateMode.options.correction')}
              hint={t('debts.updateMode.options.correctionHint')}
              onPress={() => setMode('correction')}
            />
            <ModeOption
              active={mode === 'effective'}
              title={t('debts.updateMode.options.effective')}
              hint={t('debts.updateMode.options.effectiveHint')}
              onPress={() => setMode('effective')}
            />
          </>
        )}
      </View>

      {/* Rewriting history is the consequence worth naming out loud. */}
      {mode === 'correction' ? (
        <CaveatNote className="mt-4">{t('debts.updateMode.correctionWarning')}</CaveatNote>
      ) : (
        <DateField
          className="mt-4"
          label={t('debts.updateMode.effectiveDateLabel')}
          value={effectiveDate}
          onChange={setEffectiveDate}
        />
      )}

      {before && after ? (
        <Sunk className="mt-4">
          <Text className="t-body-sm font-medium text-ink">
            {t('debts.updateMode.preview.title')}
          </Text>

          <View className="mt-2">
            <PreviewRow
              label={t('debts.updateMode.preview.name')}
              before={before.name}
              after={after.name}
            />
            <PreviewRow
              label={t('debts.updateMode.preview.lenderType')}
              before={t(`debts.form.lenderType.${before.lenderType}`, {
                defaultValue: before.lenderType,
              })}
              after={t(`debts.form.lenderType.${after.lenderType}`, {
                defaultValue: after.lenderType,
              })}
            />
            <PreviewRow
              label={t('debts.updateMode.preview.originalAmount')}
              before={money(before.originalAmount)}
              after={money(afterOriginal)}
            />
            <PreviewRow
              label={t('debts.updateMode.preview.outstanding')}
              before={money(before.outstandingAmount)}
              after={money(afterOutstanding)}
              emphasize
            />

            {/* Under correction the whole schedule is recomputed, so these
                reflect the new plan exactly. Under effective mode the backend
                appends a period instead of rewriting, so an exact preview is
                not possible — better to show nothing than an approximation. */}
            {mode === 'correction' ? (
              <>
                <PreviewRow
                  label={t('debts.updateMode.preview.perPayment')}
                  before={money(before.fixedPaymentAmount)}
                  after={money(after.fixedPaymentAmount)}
                />
                <PreviewRow
                  label={t('debts.updateMode.preview.interestRate')}
                  before={
                    before.interestRate === undefined
                      ? '—'
                      : t('debts.updateMode.preview.interestRateValue', {
                          rate: before.interestRate,
                        })
                  }
                  after={
                    after.interestRate === undefined
                      ? '—'
                      : t('debts.updateMode.preview.interestRateValue', {
                          rate: after.interestRate,
                        })
                  }
                />
                <PreviewRow
                  label={t('debts.updateMode.preview.installments')}
                  before={
                    before.installments === undefined
                      ? '—'
                      : t('debts.updateMode.preview.installmentsValue', {
                          count: before.installments,
                        })
                  }
                  after={
                    after.installments === undefined
                      ? '—'
                      : t('debts.updateMode.preview.installmentsValue', {
                          count: after.installments,
                        })
                  }
                />
              </>
            ) : null}
          </View>

          <Text className="mt-2 t-caption leading-4 text-ink3">
            {hasVisibleChange
              ? t('debts.updateMode.preview.footnote')
              : t('debts.updateMode.preview.noChange')}
          </Text>
        </Sunk>
      ) : null}
    </BottomSheet>
  )
}

function money(value?: number) {
  return value === undefined ? '—' : formatVndShort(value)
}

/**
 * One before → after row, hidden entirely when the value did not change.
 *
 * Stacked, not side by side: three columns of money across 375pt would
 * truncate, and money never truncates (§6).
 */
function PreviewRow({
  label,
  before,
  after,
  emphasize,
}: {
  label: string
  before: string
  after: string
  emphasize?: boolean
}) {
  if (before === after) return null

  return (
    <View className="flex-row items-baseline justify-between gap-3 py-1.5">
      <Text className="flex-shrink t-body-sm text-ink2">{label}</Text>
      <View className="flex-1 flex-row items-baseline justify-end gap-1.5">
        <Text
          className="t-body-sm text-ink3"
          style={{ textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] }}
        >
          {before}
        </Text>
        <Text className="t-body-sm text-ink3">→</Text>
        <Text
          className={cn('t-body-sm font-medium', emphasize ? 'text-action' : 'text-ink')}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {after}
        </Text>
      </View>
    </View>
  )
}

/** One of the readings of the edit. The selected one steps up a surface. */
function ModeOption({
  active,
  title,
  hint,
  onPress,
}: {
  active: boolean
  title: string
  hint: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      accessibilityHint={hint}
      style={{ minHeight: TOUCH_TARGET }}
      className={cn(
        'justify-center rounded-control border px-3.5 py-3',
        active ? 'border-action bg-action-soft' : 'border-transparent bg-wash',
      )}
    >
      <Text className={cn('t-body-sm font-medium', active ? 'text-ink' : 'text-ink2')}>
        {title}
      </Text>
      <Text className="mt-0.5 t-caption leading-4 text-ink3">{hint}</Text>
    </Pressable>
  )
}

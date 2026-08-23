import { useCallback, useEffect, useRef } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router, useLocalSearchParams } from 'expo-router'

import { useDebtDetail } from '@money-space/core/features/debts/hooks/use-debt-detail'
import { useDebtsPage } from '@money-space/core/features/debts/hooks/use-debts-page'
import { calcFromBackendEnum } from '@money-space/core/features/debts/model/debts-interest'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { formatVndShort, splitVndScale } from '@money-space/core/shared/lib/format-money'

import {
  ActionSheet,
  BackLink,
  Button,
  ConfirmDialog,
  EmptyState,
  GroupedRow,
  Label,
  Money,
  Panel,
  PanelHeader,
  ProgressBar,
  RowMeta,
  Screen,
  Sections,
  Skeleton,
  StatusChip,
  Sunk,
} from '@/components/ui'
import { RequireAuth } from '@/features/auth/require-auth'
import { DebtFormSheet } from '@/features/debts/debt-form-sheet'
import { DebtUpdateModeSheet } from '@/features/debts/debt-update-mode-sheet'
import { RequireHousehold } from '@/features/onboarding/require-household'

import type { StatusTone } from '@/components/ui'
import type { DebtStatus } from '@money-space/core/features/debts/model/debts.types'

/** Colour marks what needs action — an active loan is not one of those. */
const STATUS_TONE: Record<DebtStatus, StatusTone> = {
  active: 'neutral',
  paid_off: 'interactive',
  paused: 'neutral',
  overdue: 'alert',
  cancelled: 'neutral',
}

/** ISO → `dd/mm/yyyy`; ASCII, so the mono face is safe on it. */
function displayDate(iso: string | undefined, fallback: string) {
  const [year, month, day] = (iso ?? '').slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : fallback
}

/** ISO → `mm/yyyy`. Payoff is month-precision by nature. */
function displayMonth(iso: string | undefined, fallback: string) {
  const [year, month] = (iso ?? '').slice(0, 10).split('-')
  return year && month ? `${month}/${year}` : fallback
}

function monthsUntil(iso?: string) {
  if (!iso) return null
  const today = new Date()
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.max(
    0,
    (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth(),
  )
}

/**
 * One debt in full: what is still owed, how far along, and every instalment.
 *
 * The web lays this out as three wide cards with bordered columns; on a phone
 * those columns stack and the payment calendar — a six-across grid of tiles —
 * becomes a list of grouped rows, because a grid of money on 375pt either
 * truncates or scrolls sideways, and neither is allowed (§6, §8).
 *
 * Editing routes through the same `useDebtsPage` the list uses, so a debt with
 * history gets the same update-mode gate here as it does there.
 */
export default function DebtDetailRoute() {
  // This route lives outside `(tabs)`, so it does not inherit that layout's
  // gates. A deep link to a debt must still land on a session and a household.
  return (
    <RequireAuth>
      <RequireHousehold>
        <DebtDetailGate />
      </RequireHousehold>
    </RequireAuth>
  )
}

/**
 * Selects the active household, the way the tabs layout does.
 *
 * Not optional here: `useActiveHousehold` is what puts an id in the store AND
 * what hands the household's currency to `setDisplayCurrency`. A cold deep link
 * straight to this screen has neither, so every debt query below would stay
 * disabled and the debt would render as "not found".
 */
function DebtDetailGate() {
  useActiveHousehold()
  return <DebtDetailScreen />
}

function DebtDetailScreen() {
  const { debtId } = useLocalSearchParams<{ debtId: string }>()
  const { t } = useTranslation()

  const { debt, ownerName, receivedToAssetName, history, repayments, totalRepaid, upcomingPayments, isLoading } =
    useDebtDetail(debtId)

  const {
    receiveAssetOptions,
    memberOptions,
    control,
    errors,
    setValue,
    trigger,
    submit,
    selectedLenderType,
    isSavingDebt,
    repaymentEstimate,
    termMonths,
    dialogOpen,
    editingId,
    setShowMoreDetails,
    onOpenChange,
    openEdit,
    markPaidOff,
    deletingDebt,
    isDeleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    updateModeOpen,
    updateModeOriginalChanged,
    updateModeBefore,
    updateModeAfter,
    updateModeTotalRepaid,
    isSavingUpdateMode,
    confirmUpdateMode,
    cancelUpdateMode,
  } = useDebtsPage()

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    // A deep link lands here with no stack behind it.
    router.replace('/networth')
  }, [])

  /**
   * Leave once the debt this screen is about is genuinely gone.
   *
   * Deleting is the only way that happens from here, and `confirmDelete`
   * reports its own failure rather than throwing — so waiting for the record
   * to disappear is what distinguishes a delete that landed from one that did
   * not. Without this the screen would fall through to "không tìm thấy", which
   * reads as an error for something the user just did on purpose.
   */
  const existed = useRef(false)
  useEffect(() => {
    if (debt) {
      existed.current = true
      return
    }
    if (existed.current && !isLoading) goBack()
  }, [debt, isLoading, goBack])

  if (isLoading && !debt) {
    return (
      <Screen>
        <Sections>
          <Skeleton height={140} />
          <Skeleton height={200} />
        </Sections>
      </Screen>
    )
  }

  if (!debt) {
    return (
      <Screen>
        <BackLink label={t('debts.detail.back')} onPress={goBack} />
        <Panel className="mt-3">
          <Text className="text-[16px] font-medium text-ink">
            {t('debts.detail.notFoundTitle')}
          </Text>
          <Text className="mt-1.5 text-[13px] leading-5 text-ink2">
            {t('debts.detail.notFoundBody')}
          </Text>
        </Panel>
      </Screen>
    )
  }

  // The recorded repayments are the truth when they exist; the difference
  // between original and outstanding covers debts whose history predates the
  // app. Whichever is larger is the honest figure.
  const repaid = Math.max(totalRepaid, debt.originalAmountValue - debt.outstandingAmountValue)
  const progress =
    debt.originalAmountValue > 0 ? Math.min(100, (repaid / debt.originalAmountValue) * 100) : 0
  const outstanding = splitVndScale(debt.outstandingAmountValue)
  const latestUpdate = history[0]?.isoDate ?? debt.borrowedAt
  const latestRepayment = repayments[0]
  const remainingMonths = monthsUntil(debt.expectedFinalDueDate)
  const stages = debt.interestPeriods ?? []
  const calc = calcFromBackendEnum(debt.interestCalculation)
  const frequencyLabel = t(`debts.form.frequency.${debt.paymentFrequency ?? 'none'}`)
  // "Hàng tháng · dư nợ giảm dần" — the calculation half only means anything
  // once the debt actually charges interest.
  const repaymentMethod = stages.length
    ? `${frequencyLabel} · ${t(`debts.detail.calc.${calc}`, { defaultValue: calc })}`
    : frequencyLabel
  const paymentDay = upcomingPayments[0]?.expectedDate
    ? Number(upcomingPayments[0].expectedDate.slice(8, 10))
    : debt.firstPaymentDate
      ? Number(debt.firstPaymentDate.slice(8, 10))
      : null

  // Paid instalments and expected ones, in one time sequence (§7) — the
  // question is "where am I in this loan", which a split list cannot answer.
  const schedule = [
    ...repayments.map((entry) => ({
      id: `paid-${entry.id}`,
      isoDate: entry.isoDate.slice(0, 10),
      amount: entry.amount,
      paid: true,
    })),
    ...upcomingPayments.map((payment) => ({
      id: `upcoming-${payment.id}`,
      isoDate: payment.expectedDate.slice(0, 10),
      amount: payment.amount,
      paid: false,
    })),
  ].sort((left, right) => left.isoDate.localeCompare(right.isoDate))

  const firstUnpaidId = schedule.find((item) => !item.paid)?.id

  return (
    <Screen>
      <BackLink label={t('debts.detail.back')} onPress={goBack} />

      <View className="mb-4 mt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <StatusChip
            label={t(`options.debtStatus.${debt.status}`)}
            tone={STATUS_TONE[debt.status]}
          />
          <Text className="mt-1.5 text-[19px] font-medium leading-tight text-ink">
            {debt.name}
          </Text>
        </View>
        {/* Edit is the action this screen exists to reach, so it stays a
            button; the rarer ones sit behind the menu, destructive last. */}
        <View className="flex-row items-center">
          <Button variant="ghost" onPress={() => openEdit(debt.id)}>
            {t('common.edit')}
          </Button>
          <ActionSheet
            title={debt.name}
            accessibilityLabel={t('common.actions')}
            items={[
              ...(debt.status !== 'paid_off'
                ? [
                    {
                      key: 'paid',
                      label: t('debts.demo.markPaid'),
                      onPress: () => markPaidOff(debt.id),
                    },
                  ]
                : []),
              {
                key: 'delete',
                label: t('common.delete'),
                onPress: () => requestDelete(debt.id),
                destructive: true,
              },
            ]}
          />
        </View>
      </View>

      <Sections>
        <Panel>
          <PanelHeader
            title={t('debts.detail.overview.title')}
            right={
              <Text className="font-mono text-[11px] text-ink3">
                {displayDate(latestUpdate, t('debts.detail.noValue'))}
              </Text>
            }
          />

          <Label className="mt-5">{t('debts.detail.overview.outstanding')}</Label>
          <View className="mt-1.5 flex-row items-baseline gap-1.5">
            <Money size={40}>{outstanding.amount}</Money>
            {outstanding.unit ? (
              <Text className="text-[17px] font-medium text-ink">{outstanding.unit}</Text>
            ) : null}
          </View>

          <View className="mt-5">
            <View className="flex-row items-baseline justify-between gap-3">
              <Text className="text-[12px] text-ink2">
                {t('debts.detail.overview.progress')}
              </Text>
              <Text
                className="text-[13px] font-medium text-ink"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {Math.round(progress)}%
              </Text>
            </View>
            <ProgressBar
              className="mt-2"
              percent={progress}
              label={t('debts.detail.overview.progressAria', {
                percent: Math.round(progress),
              })}
            />
            <Text className="mt-2 text-[12px] text-ink2">
              {t('debts.detail.overview.repaid')}{' '}
              <Text className="font-medium text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                {formatVndShort(repaid)}
              </Text>
            </Text>
          </View>
        </Panel>

        <Panel>
          <PanelHeader title={t('debts.detail.loan.title')} />

          {/* The three counts the web puts in bordered columns. Stacked as
              grouped rows here — a phone has no room for three columns of
              money that must not truncate. */}
          <View className="mt-4">
            <GroupedRow
              title={t('debts.detail.loan.payoff')}
              meta={<RowMeta>{t('debts.detail.loan.payoffNote')}</RowMeta>}
              value={displayMonth(debt.expectedFinalDueDate, t('debts.detail.noMonth'))}
            />
            <GroupedRow
              title={t('debts.detail.loan.paid')}
              meta={
                latestRepayment ? (
                  <RowMeta>
                    {t('debts.detail.loan.latestInstallment', {
                      date: displayDate(latestRepayment.isoDate, t('debts.detail.noValue')),
                    })}
                  </RowMeta>
                ) : (
                  <RowMeta>{t('debts.detail.loan.noInstallment')}</RowMeta>
                )
              }
              value={t('debts.detail.loan.installments', { count: repayments.length })}
            />
            <GroupedRow
              title={t('debts.detail.loan.remaining')}
              meta={
                <RowMeta>
                  {remainingMonths !== null
                    ? t('debts.detail.loan.remainingMonths', { count: remainingMonths })
                    : t('debts.detail.loan.noTerm')}
                </RowMeta>
              }
              value={t('debts.detail.loan.installments', { count: upcomingPayments.length })}
            />
          </View>

          <Sunk className="mt-4">
            <View className="gap-3">
              <LoanFact
                label={t('debts.detail.loan.lender')}
                value={debt.lenderName || t('debts.detail.loan.notUpdated')}
              />
              <LoanFact
                label={t('debts.detail.loan.lenderType')}
                value={t(`debts.form.lenderType.${debt.lenderType}`)}
              />
              <LoanFact
                label={t('debts.detail.loan.originalAmount')}
                value={formatVndShort(debt.originalAmountValue)}
                numeric
              />
              <LoanFact
                label={t('debts.detail.loan.interest')}
                value={debt.interestSummary || t('debts.detail.loan.noInterest')}
              />
              <LoanFact label={t('debts.detail.loan.method')} value={repaymentMethod} />
              {paymentDay ? (
                <LoanFact
                  label={t('debts.detail.loan.paymentDay')}
                  value={t('debts.detail.loan.paymentDayValue', { day: paymentDay })}
                />
              ) : null}
              <LoanFact
                label={t('debts.detail.loan.owner')}
                value={ownerName || t('debts.detail.loan.unassigned')}
              />
              <LoanFact
                label={t('debts.detail.loan.receivedInto')}
                value={receivedToAssetName || t('debts.detail.loan.notUpdated')}
              />
              <LoanFact
                label={t('debts.detail.loan.disbursedAt')}
                value={displayDate(debt.borrowedAt, t('debts.detail.noValue'))}
                mono
              />
            </View>

            {debt.note ? (
              <Text className="mt-4 text-[13px] leading-5 text-ink2">{debt.note}</Text>
            ) : null}
          </Sunk>
        </Panel>

        <Panel>
          <PanelHeader title={t('debts.detail.schedule.title')} />

          {schedule.length > 0 ? (
            <View className="mt-3">
              {schedule.map((item) => (
                <GroupedRow
                  key={item.id}
                  title={displayDate(item.isoDate, t('debts.detail.noValue'))}
                  // Paid / next says the state in words; the tone never
                  // carries it alone (§9).
                  meta={
                    item.paid ? (
                      <RowMeta>{t('debts.detail.schedule.paid')}</RowMeta>
                    ) : item.id === firstUnpaidId ? (
                      <RowMeta>{t('debts.detail.schedule.next')}</RowMeta>
                    ) : undefined
                  }
                  value={formatVndShort(item.amount)}
                  valueTone={item.paid ? 'muted' : 'default'}
                />
              ))}
            </View>
          ) : (
            <EmptyState className="mt-4" message={t('debts.detail.schedule.empty')} />
          )}
        </Panel>
      </Sections>

      <DebtFormSheet
        open={dialogOpen}
        onOpenChange={onOpenChange}
        editingId={editingId}
        control={control}
        errors={errors}
        isSavingDebt={isSavingDebt}
        setValue={setValue}
        trigger={trigger}
        selectedLenderType={selectedLenderType}
        setShowMoreDetails={setShowMoreDetails}
        receiveAssetOptions={receiveAssetOptions}
        memberOptions={memberOptions}
        repaymentEstimate={repaymentEstimate}
        termMonths={termMonths}
        submit={submit}
      />

      <DebtUpdateModeSheet
        open={updateModeOpen}
        onClose={cancelUpdateMode}
        originalAmountChanged={updateModeOriginalChanged}
        before={updateModeBefore}
        after={updateModeAfter}
        totalRepaid={updateModeTotalRepaid}
        isSubmitting={isSavingUpdateMode}
        onConfirm={confirmUpdateMode}
      />

      <ConfirmDialog
        open={Boolean(deletingDebt)}
        onClose={cancelDelete}
        title={t('debts.remove.title')}
        consequence={t('debts.remove.body', { name: deletingDebt?.name ?? '' })}
        confirmLabel={t('debts.remove.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </Screen>
  )
}

/** One label/value pair inside the loan-details block. */
function LoanFact({
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
      <Text className="flex-shrink text-[13px] text-ink2">{label}</Text>
      <Text
        className={mono ? 'flex-1 text-right font-mono text-[13px] text-ink' : 'flex-1 text-right text-[13px] font-medium text-ink'}
        style={numeric ? { fontVariant: ['tabular-nums'] } : undefined}
      >
        {value}
      </Text>
    </View>
  )
}

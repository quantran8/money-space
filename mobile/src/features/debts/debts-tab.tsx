import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useDebtsPage } from '@money-space/core/features/debts/hooks/use-debts-page'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import { formatMonthYear, formatVndScale } from '@money-space/core/shared/lib/format-money'

import {
  Button,
  CaveatNote,
  ConfirmDialog,
  EmptyState,
  Field,
  Panel,
  PanelHeader,
  Sections,
  Skeleton,
  SummaryStrip,
} from '@/components/ui'
import { DebtFormSheet } from '@/features/debts/debt-form-sheet'
import { DebtRow } from '@/features/debts/debt-row'
import { DebtUpdateModeSheet } from '@/features/debts/debt-update-mode-sheet'

/** Days from today to an ISO date; `Infinity` when there is no date. */
function daysFromNow(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${date}T00:00:00`)
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

/**
 * The **debts** half of the Tài sản & Nợ destination.
 *
 * Assets and debts are one destination with a tab in page state, not a route —
 * the bottom bar is capped at five (§13) and net worth is one question with two
 * halves. This component is that half, self-contained so the two can be wired
 * together without either owning the other.
 *
 * Every number on it comes from `useDebtsPage`; nothing here recomputes a
 * balance, an instalment or a rate.
 */
export function DebtsTab() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const [query, setQuery] = useState('')

  const {
    debts,
    payments,
    summary,
    isLoading,
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
    openCreate,
    openEdit,
    openDetail,
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

  const activeDebts = useMemo(
    () => debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue'),
    [debts],
  )

  const visibleDebts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi')
    if (!needle) return debts
    return debts.filter((debt) =>
      `${debt.name} ${debt.lenderName}`.toLocaleLowerCase('vi').includes(needle),
    )
  }, [debts, query])

  const nextPaymentByDebt = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const map = new Map<string, CashflowEvent>()
    for (const payment of payments) {
      if (!payment.debtId) continue
      if (new Date(`${payment.expectedDate}T00:00:00`) < now) continue
      const existing = map.get(payment.debtId)
      if (!existing || payment.expectedDate < existing.expectedDate) {
        map.set(payment.debtId, payment)
      }
    }
    return map
  }, [payments])

  // Obligations landing inside the 30-day window the forecast covers.
  const upcoming = useMemo(
    () =>
      payments.filter((payment) => {
        const days = daysFromNow(payment.expectedDate)
        return Boolean(payment.debtId) && days >= 0 && days <= 30
      }),
    [payments],
  )
  const upcomingAmount = upcoming.reduce((sum, payment) => sum + payment.amount, 0)

  const farthestDate = useMemo(
    () =>
      activeDebts
        .map((debt) => debt.expectedFinalDueDate)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1),
    [activeDebts],
  )

  const missingScheduleCount = debts.filter((debt) => !nextPaymentByDebt.get(debt.id)).length

  return (
    <Sections>
      <Panel>
        <PanelHeader
          title={t('debts.demo.overview')}
          right={
            <Text className="text-[12px] text-ink3">
              {t('debts.demo.count', { count: activeDebts.length })}
            </Text>
          }
        />

        {/* Two tiles per row; the third wraps. Three across 375pt would
            truncate money, and money never truncates (§6). */}
        <SummaryStrip
          className="mt-5"
          items={[
            {
              key: 'outstanding',
              label: t('debts.demo.outstanding'),
              value: formatVndScale(summary.outstanding),
            },
            {
              key: 'next30',
              label: t('debts.demo.next30Days'),
              value: formatVndScale(upcomingAmount),
              tone: upcoming.length === 0 ? 'attention' : 'default',
            },
            {
              key: 'payoff',
              label: t('debts.demo.farthestPayoff'),
              value: farthestDate
                ? formatMonthYear(farthestDate, locale)
                : t('debts.demo.unknown'),
            },
          ]}
        />

        {/* One caveat line, saying what the figures do NOT yet cover. */}
        <Text className="mt-3 text-[12px] leading-4 text-ink3">
          {upcoming.length > 0
            ? t('debts.demo.confirmedPayments', { count: upcoming.length })
            : t('debts.demo.noConfirmedPayment')}
        </Text>
      </Panel>

      <Panel>
        <PanelHeader
          title={t('debts.demo.listTitle')}
          right={
            <Button variant="ghost" onPress={openCreate}>
              {t('debts.demo.add')}
            </Button>
          }
        />

        {/* Search appears only once scanning is actually work. */}
        {debts.length > 5 ? (
          <Field
            className="mt-4"
            value={query}
            onChangeText={setQuery}
            placeholder={t('debts.demo.search')}
            autoCorrect={false}
          />
        ) : null}

        <View className="mt-3">
          {isLoading && debts.length === 0 ? (
            <View className="gap-2.5">
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </View>
          ) : null}

          {!isLoading && visibleDebts.length === 0 ? (
            <EmptyState
              message={debts.length === 0 ? t('debts.demo.empty') : t('debts.demo.emptySearch')}
              action={debts.length === 0 ? t('debts.demo.add') : undefined}
              onAction={debts.length === 0 ? openCreate : undefined}
            />
          ) : null}

          {visibleDebts.map((debt) => (
            <DebtRow
              key={debt.id}
              debt={debt}
              nextPayment={nextPaymentByDebt.get(debt.id)}
              onEdit={openEdit}
              onMarkPaidOff={markPaidOff}
              onViewDetail={openDetail}
              onDelete={requestDelete}
            />
          ))}
        </View>

        {/* A debt with no scheduled instalment is missing from the forecast.
            That is a caveat on the figures above, not an empty state — the
            list is not empty and nothing here is blocked. */}
        {!isLoading && missingScheduleCount > 0 ? (
          <CaveatNote className="mt-4">
            {t('debts.demo.missingPaymentCount', { count: missingScheduleCount })}
          </CaveatNote>
        ) : null}
      </Panel>

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

      {/* Editing a debt that already has money events does not save directly —
          it asks how the change should be recorded. See memory/debts.md. */}
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
    </Sections>
  )
}

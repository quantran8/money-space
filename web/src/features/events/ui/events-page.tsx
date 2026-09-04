import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useEventsPage } from '@money-space/core/features/events/hooks/use-events-page'
import {
  useEventDeleteImpact,
  useEventOverdrafts,
} from '@money-space/core/features/events/hooks/use-event-wallet-impact'
import { describeOverdraft } from '@money-space/core/features/events/model/wallet-overdraft'
import { EventFormDialog } from '@/features/events/ui/components/event-form-dialog'
import { EventsCategoryCard } from '@/features/events/ui/components/events-category-card'
import { EventsMonthScope } from '@/features/events/ui/components/events-month-scope'
import { EventsSummaryStrip } from '@/features/events/ui/components/events-summary-strip'
import { EventsTimelineCard } from '@/features/events/ui/components/events-timeline-card'
import type { QuickAction } from '@money-space/core/features/events/model/events-form'

export function EventsPage() {
  const { t, i18n } = useTranslation()
  const { asOf } = useAssets()
  const {
    sale,
    groupedRecords,
    periodSummary,
    spendingByCategory,
    incomeByCategory,
    byMember,
    isLoading,
    tab,
    setTab,
    selectedMonth,
    setSelectedMonth,
    selectedMember,
    setSelectedMember,
    query,
    setQuery,
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
    isDeleting,
    sourceAssetOptions,
    memberOptions,
    categoryOptions,
    categoryVisualById,
    actualControl,
    registerActual,
    handleActualSubmit,
    actualErrors,
    openCreate,
    openBorrowMoney,
    openBuyAsset,
    openSellAsset,
    openPlanUpcoming,
    openEditEvent,
    handleFormOpenChange,
    onSubmitActual,
    toggleEventAttention,
    duplicateEvent,
    handleDeleteEvent,
  } = useEventsPage()
  // What deleting this event would do to its wallets — read while the dialog is
  // open so the confirmation can say a wallet would go negative. Advisory only:
  // the delete never depends on it (see wallet-replay-on-edit).
  const deleteImpact = useEventDeleteImpact(deleteEventId)
  // Which rows sit on a negative wallet balance, so the list can mark them.
  const { overdrafts } = useEventOverdrafts()
  const overdraftNotice = describeOverdraft(deleteImpact.impact, t, i18n.resolvedLanguage)

  function handleSelectQuickAction(action: QuickAction) {
    setQuickAction(action)
    setShowMoreDetails(false)
  }

  return (
    <div className="s-section-gap flex flex-col pb-3">
      <CompactPageHeader
        title={t('events.history.title')}
        actions={
          <Button onClick={openCreate}>
            <RefreshCw className="size-4" strokeWidth={1.75} />
            {t('events.history.quickUpdate')}
          </Button>
        }
        scope={<EventsMonthScope month={selectedMonth} onChange={setSelectedMonth} />}
      />

      {/* The summary and the list are two readings of the SAME month, so they
          sit at card-gap rather than section-gap — a wider gap would read as
          two unrelated sections and invite the month to be named twice. */}
      <div className="s-card-gap flex flex-col">
        <EventsSummaryStrip summary={periodSummary} />

        {/* Between the month's totals and the rows that make them up: it
            breaks the same month down one level, which is the step between
            "what did the month come to" and "what was each change". */}
        <EventsCategoryCard
          spending={spendingByCategory}
          income={incomeByCategory}
          byMember={byMember}
          isLoading={isLoading}
        />

        <EventsTimelineCard
          tab={tab}
          onTabChange={setTab}
          groupedRecords={groupedRecords}
          overdrafts={overdrafts}
          categoryVisualById={categoryVisualById}
          memberOptions={memberOptions}
          selectedMonth={selectedMonth}
          selectedMember={selectedMember}
          onMemberChange={setSelectedMember}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
          onEditEvent={openEditEvent}
          onDuplicateEvent={duplicateEvent}
          onToggleEventAttention={toggleEventAttention}
          onDeleteEvent={setDeleteEventId}
        />
      </div>

      <Button className="w-full sm:hidden" onClick={openCreate}>
        <RefreshCw className="size-4" strokeWidth={1.75} />
        {t('events.history.quickUpdate')}
      </Button>

      <EventFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        quickAction={quickAction}
        editingEventType={editingEventType}
        onSelectQuickAction={handleSelectQuickAction}
        onBack={() => {
          setQuickAction(null)
          setShowMoreDetails(false)
        }}
        onBorrowMoney={openBorrowMoney}
        onBuyAsset={openBuyAsset}
        onSellAsset={openSellAsset}
        onPlanUpcoming={openPlanUpcoming}
        showMoreDetails={showMoreDetails}
        onToggleMoreDetails={() => setShowMoreDetails((current) => !current)}
        sourceAssetOptions={sourceAssetOptions}
        categoryOptions={categoryOptions}
        actualControl={actualControl}
        registerActual={registerActual}
        actualErrors={actualErrors}
        handleActualSubmit={handleActualSubmit}
        onSubmitActual={onSubmitActual}
        isSavingActual={isSavingActual}
      />

      <ConfirmDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
        title={t('common.confirmDelete.title')}
        description={[
          t('common.confirmDelete.description', { name: deletingEvent?.note ?? '' }),
          // Deleting a back-dated inflow re-bases every event after it on the
          // same wallet, which can leave those events overdrawn. Allowed, but
          // the household should hear it before saying yes.
          overdraftNotice,
        ]
          .filter(Boolean)
          .join('\n\n')}
        confirmDisabled={isDeleting}
        confirmLoadingLabel={t('events.history.deleting')}
        onConfirm={() => (deleteEventId ? handleDeleteEvent(deleteEventId) : undefined)}
      />

      <AssetSaleDialog
        open={sale.saleOpen}
        onOpenChange={sale.handleOpenChange}
        asset={sale.sellingAsset}
        asOf={asOf}
        form={sale.form}
        walletOptions={sale.walletOptions}
        isMarketAsset={sale.isMarketAsset}
        currentQuantity={sale.currentQuantity}
        previewNet={sale.previewNet}
        isSubmitting={sale.isSubmitting}
        isEditing={sale.isEditing}
        onSubmit={sale.submit}
      />
    </div>
  )
}

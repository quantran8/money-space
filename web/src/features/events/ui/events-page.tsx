import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useEventsPage } from '@money-space/core/features/events/hooks/use-events-page'
import { EventFormDialog } from '@/features/events/ui/components/event-form-dialog'
import { EventsSummaryStrip } from '@/features/events/ui/components/events-summary-strip'
import { EventsTimelineCard } from '@/features/events/ui/components/events-timeline-card'
import type { QuickAction } from '@money-space/core/features/events/model/events-form'

export function EventsPage() {
  const { t } = useTranslation()
  const { asOf } = useAssets()
  const {
    sale,
    groupedRecords,
    periodSummary,
    isLoading,
    tab,
    setTab,
    selectedMonth,
    setSelectedMonth,
    selectedMember,
    setSelectedMember,
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

  function handleSelectQuickAction(action: QuickAction) {
    setQuickAction(action)
    setShowMoreDetails(false)
  }

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader
        title={t('events.history.title')}
        actions={
          <Button className="px-4 t-body-sm" onClick={openCreate}>
            <RefreshCw className="size-4" strokeWidth={1.75} />
            {t('events.history.quickUpdate')}
          </Button>
        }
      />

      <EventsSummaryStrip summary={periodSummary} month={selectedMonth} />

      <EventsTimelineCard
        tab={tab}
        onTabChange={setTab}
        groupedRecords={groupedRecords}
        memberOptions={memberOptions}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedMember={selectedMember}
        onMemberChange={setSelectedMember}
        isLoading={isLoading}
        onEditEvent={openEditEvent}
        onDuplicateEvent={duplicateEvent}
        onToggleEventAttention={toggleEventAttention}
        onDeleteEvent={setDeleteEventId}
      />

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
        description={t('common.confirmDelete.description', { name: deletingEvent?.note ?? '' })}
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

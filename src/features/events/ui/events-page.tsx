import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEventsPage } from '@/features/events/hooks/use-events-page'
import { EventFormDialog } from '@/features/events/ui/components/event-form-dialog'
import { EventsTimelineCard } from '@/features/events/ui/components/events-timeline-card'
import type { QuickAction } from '@/features/events/model/events-form'

export function EventsPage() {
  const { t } = useTranslation()
  const { asOf } = useAssets()
  const {
    sale,
    groupedRecords,
    recordCounts,
    isLoading,
    payments,
    tab,
    setTab,
    formOpen,
    quickAction,
    setQuickAction,
    editingEventType,
    showMoreDetails,
    setShowMoreDetails,
    markPaidPaymentId,
    deleteEventId,
    setDeleteEventId,
    deletingEvent,
    selectedUpcomingForMarkPaid,
    isSavingUpcoming,
    isSavingActual,
    isDeleting,
    assetOptions,
    sourceAssetOptions,
    memberOptions,
    categoryOptions,
    upcomingControl,
    registerUpcoming,
    handleUpcomingSubmit,
    upcomingErrors,
    isUpcomingValid,
    actualControl,
    registerActual,
    handleActualSubmit,
    actualErrors,
    isActualValid,
    openCreate,
    openBorrowMoney,
    openSellAsset,
    openEditPayment,
    openEditEvent,
    openMarkPaid,
    handleFormOpenChange,
    onSubmitUpcoming,
    onSubmitActual,
    togglePaymentAttention,
    toggleEventAttention,
    postponePayment,
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
        eyebrow={t('events.history.eyebrow')}
        title={t('events.history.title')}
        actions={
          <Button className="h-10 px-4 text-[13px]" onClick={openCreate}>
            <RefreshCw className="size-4" />
            {t('events.history.quickUpdate')}
          </Button>
        }
      />

      <EventsTimelineCard
        tab={tab}
        onTabChange={setTab}
        groupedRecords={groupedRecords}
        recordCounts={recordCounts}
        isLoading={isLoading}
        isSavingActual={isSavingActual}
        onMarkPaid={openMarkPaid}
        onPostponePayment={postponePayment}
        onEditPayment={openEditPayment}
        onTogglePaymentAttention={togglePaymentAttention}
        onEditEvent={openEditEvent}
        onDuplicateEvent={duplicateEvent}
        onToggleEventAttention={toggleEventAttention}
        onDeleteEvent={setDeleteEventId}
      />

      <EventFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        quickAction={quickAction}
        editingEventType={editingEventType}
        onSelectQuickAction={handleSelectQuickAction}
        onBorrowMoney={openBorrowMoney}
        onSellAsset={openSellAsset}
        showMoreDetails={showMoreDetails}
        onToggleMoreDetails={() => setShowMoreDetails((current) => !current)}
        markPaidPaymentId={markPaidPaymentId}
        selectedUpcomingForMarkPaid={selectedUpcomingForMarkPaid}
        payments={payments}
        assetOptions={assetOptions}
        sourceAssetOptions={sourceAssetOptions}
        memberOptions={memberOptions}
        categoryOptions={categoryOptions}
        upcomingControl={upcomingControl}
        registerUpcoming={registerUpcoming}
        upcomingErrors={upcomingErrors}
        handleUpcomingSubmit={handleUpcomingSubmit}
        onSubmitUpcoming={onSubmitUpcoming}
        isUpcomingValid={isUpcomingValid}
        isSavingUpcoming={isSavingUpcoming}
        actualControl={actualControl}
        registerActual={registerActual}
        actualErrors={actualErrors}
        handleActualSubmit={handleActualSubmit}
        onSubmitActual={onSubmitActual}
        isActualValid={isActualValid}
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

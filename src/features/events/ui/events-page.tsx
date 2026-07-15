import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEventsPage } from '@/features/events/hooks/use-events-page'
import { EventFormDialog } from '@/features/events/ui/components/event-form-dialog'
import { EventsSummaryStrip } from '@/features/events/ui/components/events-summary-strip'
import { EventsTimelineCard } from '@/features/events/ui/components/events-timeline-card'
import type { QuickAction } from '@/features/events/model/events-form'

export function EventsPage() {
  const { t } = useTranslation()
  const { asOf } = useAssets()
  const {
    sale,
    summary,
    groupedRecords,
    recordCounts,
    isLoading,
    payments,
    tab,
    setTab,
    query,
    setQuery,
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
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('events.header.eyebrow')}
        title={t('events.header.title')}
        description={t('events.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('events.redesign.create')}
          </Button>
        }
      />

      <EventsSummaryStrip summary={summary} />

      <EventsTimelineCard
        query={query}
        onQueryChange={setQuery}
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
        title="Xóa record này?"
        description={`Bạn có chắc muốn xóa “${deletingEvent?.note ?? ''}”? Hành động này không thể hoàn tác.`}
        confirmDisabled={isDeleting}
        confirmLoadingLabel="Dang xoa..."
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

import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
    actualControl,
    registerActual,
    handleActualSubmit,
    actualErrors,
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
      <header className="flex items-center justify-between gap-4 px-1 py-1">
        <div>
          <h1 className="page-title text-[19px]">{t('events.history.title')}</h1>
          <p className="mt-1 text-[12px] text-ink3">{t('events.history.description')}</p>
        </div>
        <div className="hidden sm:block">
          <Button className="h-10 px-4 text-[13px]" onClick={openCreate}>
            <RefreshCw className="size-4" strokeWidth={1.75} />
            {t('events.history.quickUpdate')}
          </Button>
        </div>
      </header>

      <EventsTimelineCard
        tab={tab}
        onTabChange={setTab}
        groupedRecords={groupedRecords}
        memberOptions={memberOptions}
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
        isSavingUpcoming={isSavingUpcoming}
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

import { Plus } from 'lucide-react'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useEventsPage } from '@/features/events/hooks/use-events-page'
import { EventFormDialog } from '@/features/events/ui/components/event-form-dialog'
import { EventsSummaryStrip } from '@/features/events/ui/components/events-summary-strip'
import { EventsTimelineCard } from '@/features/events/ui/components/events-timeline-card'
import type { QuickAction } from '@/features/events/model/events-form'

export function EventsPage() {
  const {
    summary,
    groupedRecords,
    payments,
    tab,
    setTab,
    query,
    setQuery,
    formOpen,
    quickAction,
    setQuickAction,
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
    memberOptions,
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Money Timeline"
        title="Financial Records"
        description="Theo dõi khoản sắp tới và các sự kiện tài chính đáng ghi nhận của nhà mình."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Tạo record
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
        onSelectQuickAction={handleSelectQuickAction}
        onBorrowMoney={openBorrowMoney}
        showMoreDetails={showMoreDetails}
        onToggleMoreDetails={() => setShowMoreDetails((current) => !current)}
        markPaidPaymentId={markPaidPaymentId}
        selectedUpcomingForMarkPaid={selectedUpcomingForMarkPaid}
        payments={payments}
        assetOptions={assetOptions}
        memberOptions={memberOptions}
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
        description={`Bạn có chắc muốn xóa “${deletingEvent?.title ?? ''}”? Hành động này không thể hoàn tác.`}
        confirmDisabled={isDeleting}
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (deleteEventId ? handleDeleteEvent(deleteEventId) : undefined)}
      />
    </div>
  )
}

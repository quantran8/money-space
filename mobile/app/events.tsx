import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import { useEventsPage } from '@money-space/core/features/events/hooks/use-events-page'
import type { QuickAction } from '@money-space/core/features/events/model/events-form'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { useNavigate } from '@money-space/core/shared/navigation'

import { BackLink, Button, ConfirmDialog, Screen, Sections } from '@/components/ui'
import { AssetSaleSheet } from '@/features/assets/components/asset-sale-sheet'
import { EventFormSheet } from '@/features/events/ui/event-form-sheet'
import { EventsSummaryPanel } from '@/features/events/ui/events-summary-panel'
import { EventsTimelineSection } from '@/features/events/ui/events-timeline-section'

/**
 * `/events` — Sự kiện tài chính, the ledger of money that has ALREADY moved.
 *
 * Reached from Gia đình and deliberately not a sixth tab: the bar is capped at
 * five (§13), and this is a "what happened" question a household asks
 * occasionally rather than one of the five places it lives.
 *
 * The distinction this screen exists to hold: a money event is a fact about the
 * past. What is *expected* to move is a cashflow event and belongs entirely to
 * `/upcoming`, which owns its complete / postpone / cancel lifecycle. The two
 * are never merged into one timeline — a forecast row and a recorded row are
 * different kinds of fact, and the quick-action picker's "Khoản sắp tới" entry
 * navigates there rather than writing an expected movement from here.
 *
 * A **composition slice**: every figure, filter, default and mutation comes
 * from core's `useEventsPage`. This file decides only what sits above what.
 */
export default function EventsScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()
  const { asOf } = useAssets()
  const [refreshing, setRefreshing] = useState(false)

  /**
   * Pull-to-refresh. The backend has no push channel, so a deliberate pull is
   * the household's way of saying "check again" — and after the other person
   * records something on their phone it is the only way.
   *
   * Invalidating by the `events` PREFIX refetches both halves at once: the
   * timeline list and the backend-computed thu/chi/net summary, which are
   * separate queries that must never disagree about the same month.
   */
  const handleRefresh = useCallback(async () => {
    if (!activeHouseholdId) return
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: ['households', activeHouseholdId, 'events'],
      })
    } finally {
      setRefreshing(false)
    }
  }, [activeHouseholdId, queryClient])

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
    <Screen
      title={t('events.history.title')}
      onRefresh={() => void handleRefresh()}
      refreshing={refreshing}
    >
      <Sections>
        {/* Named in words, not left to an arrow: a deep link can land here with
            no stack behind it, and the system gesture is invisible (§9). */}
        <BackLink label={t('nav.household')} onPress={() => navigate('/household')} />

        <EventsSummaryPanel summary={periodSummary} month={selectedMonth} />

        <EventsTimelineSection
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

        {/* The CTA sits below the list rather than in the header: recording
            something is what you do after reading what is already there, and a
            full-width target at the bottom is where the thumb already is. */}
        <Button onPress={openCreate}>{t('events.history.quickUpdate')}</Button>
      </Sections>

      <EventFormSheet
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
        onToggleMoreDetails={() => setShowMoreDetails(!showMoreDetails)}
        sourceAssetOptions={sourceAssetOptions}
        categoryOptions={categoryOptions}
        control={actualControl}
        errors={actualErrors}
        handleSubmit={handleActualSubmit}
        onSubmit={onSubmitActual}
        isSaving={isSavingActual}
      />

      <ConfirmDialog
        open={deleteEventId !== null}
        onClose={() => setDeleteEventId(null)}
        title={t('common.confirmDelete.title')}
        consequence={t('common.confirmDelete.description', { name: deletingEvent?.note ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={isDeleting}
        onConfirm={() => {
          if (!deleteEventId) return
          void handleDeleteEvent(deleteEventId)
            .then(() => setDeleteEventId(null))
            // The hook has already surfaced the failure; keep the sheet open so
            // the household can retry rather than losing the confirmation.
            .catch(() => undefined)
        }}
      />

      {/* An `asset_sale` cannot be edited through the generic form — quantity,
          fee and the receiving wallet have no field there — so core routes it
          to the same sheet the assets screen uses. The sold asset is fixed
          context, never a form field. */}
      <AssetSaleSheet
        open={sale.saleOpen}
        onOpenChange={sale.handleOpenChange}
        asset={sale.sellingAsset}
        asOf={asOf || AS_OF}
        form={sale.form}
        walletOptions={sale.walletOptions}
        isMarketAsset={sale.isMarketAsset}
        currentQuantity={sale.currentQuantity}
        previewNet={sale.previewNet}
        isSubmitting={sale.isSubmitting}
        isEditing={sale.isEditing}
        onSubmit={sale.submit}
      />
    </Screen>
  )
}

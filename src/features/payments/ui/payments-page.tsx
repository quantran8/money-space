import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePaymentsPage } from '@/features/payments/hooks/use-payments-page'
import { PaymentFormDialog } from '@/features/payments/ui/components/payment-form-dialog'
import { PaymentsFocusCard } from '@/features/payments/ui/components/payments-focus-card'
import { PaymentsGentleCard } from '@/features/payments/ui/components/payments-gentle-card'
import { PaymentsHeader } from '@/features/payments/ui/components/payments-header'
import { PaymentsListSection } from '@/features/payments/ui/components/payments-list-section'
import { PaymentsMonthCard } from '@/features/payments/ui/components/payments-month-card'
import { PaymentsSummaryStrip } from '@/features/payments/ui/components/payments-summary-strip'

type PaymentsPanelProps = {
  embedded?: boolean
}

export function PaymentsPanel({ embedded = false }: PaymentsPanelProps) {
  const { t } = useTranslation()
  const {
    strip,
    nearestPayment,
    payments,
    isLoading,
    visiblePayments,
    groups,
    paymentStatusLabels,
    dueMeta,
    tab,
    setTab,
    query,
    setQuery,
    form,
    isEditing,
    isSavingPayment,
    submit,
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    deleteId,
    setDeleteId,
    deletingPayment,
    isDeleting,
    handleDeletePayment,
  } = usePaymentsPage()

  return (
    <div className="space-y-7">
      <PaymentsHeader embedded={embedded} onCreate={openCreate} />

      <PaymentsSummaryStrip
        next7={strip.next7}
        next30={strip.next30}
        discuss={strip.discuss}
        total={strip.total}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <PaymentsListSection
          payments={payments}
          isLoading={isLoading}
          visiblePayments={visiblePayments}
          groups={groups}
          statusLabels={paymentStatusLabels}
          dueMeta={dueMeta}
          query={query}
          onQueryChange={setQuery}
          tab={tab}
          onTabChange={setTab}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />

        <aside className="space-y-4 xl:col-span-4">
          <PaymentsFocusCard
            nearestPayment={nearestPayment}
            dueMeta={dueMeta}
            onEdit={openEdit}
          />
          <PaymentsMonthCard next30Amount={strip.next30Amount} discuss={strip.discuss} />
          <PaymentsGentleCard />
        </aside>
      </div>

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        isEditing={isEditing}
        isSaving={isSavingPayment}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingPayment?.name ?? '' })}
        confirmDisabled={isDeleting}
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (deleteId ? handleDeletePayment(deleteId) : undefined)}
      />
    </div>
  )
}

export function PaymentsPage() {
  return <PaymentsPanel />
}

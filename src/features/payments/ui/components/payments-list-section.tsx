import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { type PaymentStatus, type UpcomingPaymentItem } from '@/features/payments/model/payments'
import {
  groupDot,
  sumAmounts,
  type PaymentGroup,
  type PaymentTab,
} from '@/features/payments/model/payments-form'
import { PaymentRow } from '@/features/payments/ui/components/payment-row'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type PaymentsListSectionProps = {
  payments: UpcomingPaymentItem[]
  isLoading?: boolean
  visiblePayments: UpcomingPaymentItem[]
  groups: PaymentGroup[]
  statusLabels: Record<PaymentStatus, string>
  dueMeta: (due: string) => string
  query: string
  onQueryChange: (value: string) => void
  tab: PaymentTab
  onTabChange: (value: PaymentTab) => void
  onCreate: () => void
  onEdit: (paymentId: string) => void
  onDelete: (paymentId: string) => void
}

export function PaymentsListSection({
  payments,
  isLoading = false,
  visiblePayments,
  groups,
  statusLabels,
  dueMeta,
  query,
  onQueryChange,
  tab,
  onTabChange,
  onCreate,
  onEdit,
  onDelete,
}: PaymentsListSectionProps) {
  const { t } = useTranslation()

  return (
    <Card className="xl:col-span-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('payments.list.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('payments.list.title')}
          </h2>
        </div>
        <div className="relative sm:w-[260px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('payments.toolbar.searchPlaceholder')}
            aria-label={t('payments.toolbar.search')}
            className="pl-11"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'important', 'pending'] as PaymentTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onTabChange(value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === value
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            {t(`payments.tabs.${value}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="surface-muted rounded-3xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-7 w-24 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('payments.list.empty')}
          </p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="mr-2 size-4" />
            {t('payments.form.submit')}
          </Button>
        </div>
      ) : visiblePayments.length === 0 ? (
        <p className="rounded-3xl bg-[hsl(var(--muted))] px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('payments.list.emptyFiltered')}
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: groupDot[group.key] }}
                  />
                  <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                    {t(`payments.groups.${group.key}`)}
                  </h3>
                </div>
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  {t('payments.groups.countAmount', {
                    count: group.items.length,
                    value: formatVndShort(sumAmounts(group.items)),
                  })}
                </p>
              </div>

              <div className="space-y-3">
                {group.items.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    statusLabels={statusLabels}
                    dueMeta={dueMeta}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

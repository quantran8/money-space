import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { Asset } from '@/features/assets/model/assets.types'
import type { CashflowEvent } from '@/features/cashflow/model/cashflow.types'
import type { DebtItem } from '@/features/debts/model/debts.types'
import { DebtListItem } from '@/features/debts/ui/components/debt-list-item'
import type { MemberItem } from '@/features/members/model/members.types'

type DebtsListSectionProps = {
  debts: DebtItem[]
  members: MemberItem[]
  assets: Asset[]
  payments: CashflowEvent[]
  isLoading: boolean
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}

export function DebtsListSection({
  debts,
  members,
  payments,
  isLoading,
  isUpdating,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: DebtsListSectionProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const visibleDebts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi')
    if (!needle) return debts
    return debts.filter((debt) =>
      `${debt.name} ${debt.lenderName}`.toLocaleLowerCase('vi').includes(needle),
    )
  }, [debts, query])

  function nextPaymentFor(debtId: string) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return payments
      .filter((payment) => payment.debtId === debtId)
      .filter((payment) => new Date(`${payment.expectedDate}T00:00:00`) >= now)
      .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))[0]
  }

  const missingScheduleCount = debts.filter((debt) => !nextPaymentFor(debt.id)).length

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="section-title text-[16px]">{t('debts.demo.listTitle')}</h2>
        <label className="sunk flex h-10 items-center gap-2 px-3 sm:w-[250px]">
          <Search className="size-4 text-ink3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('debts.demo.search')}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink3"
          />
        </label>
      </div>

      <div className="mt-7 hidden grid-cols-[1.2fr_1fr_.8fr_1.15fr_.65fr_.8fr_1fr_90px] px-3 lg:grid">
        <p className="label">{t('debts.demo.columns.item')}</p>
        <p className="label">{t('debts.demo.columns.lender')}</p>
        <p className="label text-right">{t('debts.demo.columns.outstanding')}</p>
        <p className="label">{t('debts.demo.columns.nextPayment')}</p>
        <p className="label text-right">{t('debts.demo.columns.interest')}</p>
        <p className="label">{t('debts.demo.columns.owner')}</p>
        <p className="label">{t('debts.demo.columns.payoff')}</p>
        <span />
      </div>

      <div className="mt-2 space-y-1">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-control" />
            ))
          : null}
        {!isLoading && visibleDebts.length === 0 ? (
          <p className="rounded-sunk bg-sunk px-4 py-10 text-center text-[13px] text-ink2">
            {debts.length === 0 ? t('debts.demo.empty') : t('debts.demo.emptySearch')}
          </p>
        ) : null}
        {!isLoading
          ? visibleDebts.map((debt) => (
              <DebtListItem
                key={debt.id}
                debt={debt}
                ownerName={members.find((member) => member.id === debt.ownerMemberId)?.name}
                nextPayment={nextPaymentFor(debt.id)}
                isUpdating={isUpdating}
                onEdit={onEdit}
                onMarkPaidOff={onMarkPaidOff}
                onViewDetail={onViewDetail}
                onDelete={onDelete}
              />
            ))
          : null}
      </div>

      {!isLoading && missingScheduleCount > 0 ? (
        <div className="sunk mt-5 flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="text-[13px] text-ink2">
            {t('debts.demo.missingPaymentCount', { count: missingScheduleCount })}
          </span>
          <Link to="/upcoming" className="text-[13px] font-medium text-accent">
            {t('debts.demo.addSchedule')}
          </Link>
        </div>
      ) : null}
    </Panel>
  )
}

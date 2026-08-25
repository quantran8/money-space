import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import type { DebtItem } from '@money-space/core/features/debts/model/debts.types'
import { DebtListItem } from '@/features/debts/ui/components/debt-list-item'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'

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
        <h2 className="t-title">{t('debts.demo.listTitle')}</h2>
        <label className="sunk flex h-10 items-center gap-2 px-3 sm:w-[250px]">
          <Search className="size-4 text-ink3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('debts.demo.search')}
            className="min-w-0 flex-1 bg-transparent t-body-sm outline-none placeholder:text-ink3"
          />
        </label>
      </div>

      {/* A real table: the header and every row share ONE set of column widths,
          so a heading can no longer drift out of line with its column. */}
      {/* `min-w` so the container SCROLLS on a narrow screen rather than
          squeezing eight columns into an unreadable width. */}
      <Table className="mt-5 min-w-[900px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* `.label-vi`, not `.label`: these headings are accented
                Vietnamese, and mono renders diacritics poorly (§10.1). */}
            <TableHead className="label-vi">{t('debts.demo.columns.item')}</TableHead>
            <TableHead className="label-vi">{t('debts.demo.columns.lender')}</TableHead>
            <TableHead className="label-vi text-right">
              {t('debts.demo.columns.outstanding')}
            </TableHead>
            <TableHead className="label-vi">{t('debts.demo.columns.nextPayment')}</TableHead>
            <TableHead className="label-vi text-right">
              {t('debts.demo.columns.interest')}
            </TableHead>
            <TableHead className="label-vi">{t('debts.demo.columns.owner')}</TableHead>
            <TableHead className="label-vi">{t('debts.demo.columns.payoff')}</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-2">
                    <Skeleton className="h-9 w-full rounded-control" />
                  </TableCell>
                </TableRow>
              ))
            : null}

          {!isLoading && visibleDebts.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8}>
                <p className="rounded-control bg-wash px-4 py-8 text-center t-body-sm text-ink2">
                  {debts.length === 0 ? t('debts.demo.empty') : t('debts.demo.emptySearch')}
                </p>
              </TableCell>
            </TableRow>
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
        </TableBody>
      </Table>

      {!isLoading && missingScheduleCount > 0 ? (
        <div className="sunk mt-5 flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="t-body-sm text-ink2">
            {t('debts.demo.missingPaymentCount', { count: missingScheduleCount })}
          </span>
          <Link to="/upcoming" className="t-body-sm font-medium text-action">
            {t('debts.demo.addSchedule')}
          </Link>
        </div>
      ) : null}
    </Panel>
  )
}

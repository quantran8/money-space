import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import type { DebtItem } from '@money-space/core/features/debts/model/debts.types'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'

import { ActionSheet, GroupedRow, RowMeta, RowMetaMono } from '@/components/ui'

import type { ActionSheetItem } from '@/components/ui'

/**
 * One debt, as a grouped row.
 *
 * The web shows this as an eight-column table. On a phone a table becomes
 * grouped rows and never scrolls sideways (§8), so the columns collapse to
 * what actually answers the question at list level: **what it is** and **what
 * is still owed**, with the next instalment underneath. Lender, interest rate,
 * owner and payoff date all move to the detail screen — they are one tap away
 * and none of them is what someone scanning a list is looking for.
 *
 * The whole row navigates. The "…" opens a sheet rather than a dropdown, which
 * on a phone would open under the thumb that pressed it.
 */
export function DebtRow({
  debt,
  nextPayment,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: {
  debt: DebtItem
  nextPayment?: CashflowEvent
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()

  const items: ActionSheetItem[] = [
    { key: 'detail', label: t('goals.list.viewDetail'), onPress: () => onViewDetail(debt.id) },
    { key: 'edit', label: t('common.edit'), onPress: () => onEdit(debt.id) },
    ...(debt.status !== 'paid_off'
      ? [
          {
            key: 'paid',
            label: t('debts.demo.markPaid'),
            onPress: () => onMarkPaidOff(debt.id),
          },
        ]
      : []),
    {
      key: 'delete',
      label: t('common.delete'),
      onPress: () => onDelete(debt.id),
      destructive: true,
    },
  ]

  return (
    <GroupedRow
      title={debt.name}
      // The date is ASCII so it takes the mono face; "chưa xác nhận kỳ tới" is
      // Vietnamese and must not (§5, hard constraint).
      meta={
        nextPayment ? (
          <RowMetaMono>{displayDate(nextPayment.expectedDate)}</RowMetaMono>
        ) : (
          <RowMeta>{t('debts.demo.unconfirmed')}</RowMeta>
        )
      }
      // Outstanding, in full — money never truncates, and the unit stays on
      // because this is a list, not a table with a unit in its header.
      value={formatVndExact(debt.outstandingAmountValue)}
      valueTone={debt.status === 'overdue' ? 'alert' : 'default'}
      onPress={() => onViewDetail(debt.id)}
      right={
        <View>
          <ActionSheet
            title={debt.name}
            accessibilityLabel={t('common.actions')}
            items={items}
          />
        </View>
      }
    />
  )
}

/** ISO → `dd/mm/yyyy`. */
function displayDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

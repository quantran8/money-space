import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  computeSavingEarly,
  computeSavingOnTime,
  termMonthsOf,
  type CalculationTerm,
} from '@money-space/core/features/assets/model/assets'
import { formatVndExact } from '@money-space/core/shared/lib/format-money'

type SavingWithdrawalPanelProps = {
  term: CalculationTerm
}

/**
 * Format a payout figure; a negative interest is a clawback (shown as such).
 *
 * Exact đồng: this table has to foot. Each column is principal + interest =
 * total, and the callout below is the difference between the two totals — so
 * four of the seven figures are derived from the others on screen. At the
 * compact scale a 350.000đ early interest disappeared into "100,0 tr + ... =
 * 100,4 tr", and the stated difference ("3,9 tr") disagreed with the two totals
 * printed above it ("104,2 − 100,4 = 3,8"). Breaking a deposit is the decision
 * this panel exists to inform.
 */
function Money({ value, tone }: { value: number; tone?: 'muted' | 'orange' }) {
  const cls =
    tone === 'orange'
      ? 'text-attention-ink'
      : tone === 'muted'
        ? 'text-ink2'
        : 'text-foreground'
  const sign = value < 0 ? '-' : ''
  return (
    <span className={`money-number ${cls}`}>
      {sign}
      {formatVndExact(Math.abs(value))}
    </span>
  )
}

/**
 * On-time vs early-withdrawal comparison for a saving deposit. Shown only when
 * the term has a maturity date; the figures are derived display projections and
 * never touch the stored valuation.
 */
export function SavingWithdrawalPanel({ term }: SavingWithdrawalPanelProps) {
  const { t } = useTranslation()
  const termMonths = termMonthsOf(term)

  // Guard: a sub-month term has no meaningful "early" point.
  const hasEarly = termMonths > 1
  const [month, setMonth] = useState(() =>
    hasEarly ? Math.max(1, Math.floor(termMonths / 2)) : 1,
  )
  const clampedMonth = Math.min(Math.max(month, 1), Math.max(termMonths - 1, 1))

  const onTime = computeSavingOnTime(term)
  const early = computeSavingEarly(term, clampedMonth)
  // Never display a below-zero payout (extreme rate/tenor edge case).
  const earlyTotal = Math.max(0, early.total)
  const difference = onTime.total - earlyTotal

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="t-title">
            {t('assets.detail.withdrawal.title')}
          </h2>
        </div>
        <Badge className="bg-accent-tint text-action">
          {t(`options.interestPayment.${term.interestPayment}`)}
        </Badge>
      </div>

      {hasEarly ? (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between t-body-sm">
            <span className="text-ink2">
              {t('assets.detail.withdrawal.withdrawMonth', {
                month: clampedMonth,
                total: termMonths,
              })}
            </span>
          </div>
          <Slider
            min={1}
            max={termMonths - 1}
            step={1}
            value={[clampedMonth]}
            onValueChange={(next) => setMonth(next[0] ?? 1)}
          />
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('assets.detail.withdrawal.metric')}</TableHead>
            <TableHead className="text-right">
              {t('assets.detail.withdrawal.onTime')}
            </TableHead>
            <TableHead className="text-right">
              {t('assets.detail.withdrawal.early')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{t('assets.detail.withdrawal.principal')}</TableCell>
            <TableCell className="text-right">
              <Money value={onTime.principal} tone="muted" />
            </TableCell>
            <TableCell className="text-right">
              <Money value={early.principal} tone="muted" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              {early.interest < 0
                ? t('assets.detail.withdrawal.clawback')
                : t('assets.detail.withdrawal.interest')}
            </TableCell>
            <TableCell className="text-right">
              <Money value={onTime.interest} tone="muted" />
            </TableCell>
            <TableCell className="text-right">
              <Money
                value={early.interest}
                tone={early.interest < 0 ? 'orange' : 'muted'}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              {t('assets.detail.withdrawal.total')}
            </TableCell>
            <TableCell className="text-right font-medium">
              <Money value={onTime.total} />
            </TableCell>
            <TableCell className="text-right font-medium">
              <Money value={earlyTotal} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-attention-tint px-4 py-3 t-body-sm">
        <span className="text-ink2">
          {t('assets.detail.withdrawal.difference')}
        </span>
        <span className="money-number font-medium text-attention-ink">
          -{formatVndExact(Math.abs(difference))}
        </span>
      </div>
    </Card>
  )
}

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
} from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type SavingWithdrawalPanelProps = {
  term: CalculationTerm
}

/** Format a payout figure; a negative interest is a clawback (shown as such). */
function Money({ value, tone }: { value: number; tone?: 'muted' | 'orange' }) {
  const cls =
    tone === 'orange'
      ? 'text-[hsl(var(--status-orange))]'
      : tone === 'muted'
        ? 'text-[hsl(var(--muted-foreground))]'
        : 'text-foreground'
  const sign = value < 0 ? '-' : ''
  return (
    <span className={`money-number ${cls}`}>
      {sign}
      {formatVndShort(Math.abs(value))}
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
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('assets.detail.withdrawal.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-lg font-semibold">
            {t('assets.detail.withdrawal.title')}
          </h2>
        </div>
        <Badge className="bg-[hsla(var(--accent),0.15)] text-[hsl(var(--accent))]">
          {t(`options.interestPayment.${term.interestPayment}`)}
        </Badge>
      </div>

      {hasEarly ? (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
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
            <TableCell className="font-semibold">
              {t('assets.detail.withdrawal.total')}
            </TableCell>
            <TableCell className="text-right font-semibold">
              <Money value={onTime.total} />
            </TableCell>
            <TableCell className="text-right font-semibold">
              <Money value={earlyTotal} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[hsla(var(--status-orange),0.08)] px-4 py-3 text-sm">
        <span className="text-[hsl(var(--muted-foreground))]">
          {t('assets.detail.withdrawal.difference')}
        </span>
        <span className="money-number font-semibold text-[hsl(var(--status-orange))]">
          -{formatVndShort(Math.abs(difference))}
        </span>
      </div>
    </Card>
  )
}

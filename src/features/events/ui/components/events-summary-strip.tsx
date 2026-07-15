import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { formatVndShort } from '@/shared/lib/format-money'

type EventsSummary = {
  upcomingIn30DaysCount: number
  upcomingIn30DaysAmount: number
  recordedThisMonth: number
  attentionCount: number
  totalIncome: number
  totalOutcome: number
  netChange: number
}

type EventsSummaryStripProps = {
  summary: EventsSummary
}

export function EventsSummaryStrip({ summary }: EventsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const month = new Date().toLocaleDateString(locale, { month: 'long' })
  const isNetPositive = summary.netChange >= 0

  return (
    <section className="grid gap-4 xl:grid-cols-12">
      <div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_14px_38px_rgba(0,0,0,0.08)] sm:p-8 xl:col-span-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-white/45">
                {t('events.redesign.summary.month', { month })}
              </p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55">
                {t('events.redesign.summary.recordedCount', {
                  count: summary.recordedThisMonth,
                })}
              </span>
            </div>
            <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {isNetPositive ? '+' : '-'}
              {formatVndShort(Math.abs(summary.netChange))}
            </p>
            <p className="mt-4 text-sm text-white/40">
              {t('events.redesign.summary.netDescription')}
            </p>
          </div>

          <div className="grid min-w-[280px] gap-5 sm:grid-cols-2 sm:gap-3">
            <HeroMetric
              label={t('events.redesign.summary.income')}
              value={formatVndShort(summary.totalIncome)}
            />
            <HeroMetric
              label={t('events.redesign.summary.outcome')}
              value={formatVndShort(summary.totalOutcome)}
            />
          </div>
        </div>
      </div>

      <Card className="xl:col-span-4">
        <p className="text-sm text-muted-foreground">{t('events.redesign.status.eyebrow')}</p>
        <h2 className="section-title mt-1 text-xl font-semibold">
          {t('events.redesign.status.title')}
        </h2>
        <div className="mt-5 divide-y divide-border">
          <StatusRow
            label={t('events.redesign.status.upcoming')}
            note={t('events.redesign.status.upcomingCount', {
              count: summary.upcomingIn30DaysCount,
            })}
            value={formatVndShort(summary.upcomingIn30DaysAmount)}
          />
          <StatusRow
            label={t('events.redesign.status.recorded')}
            note={t('events.redesign.status.currentMonth')}
            value={t('events.redesign.status.eventCount', {
              count: summary.recordedThisMonth,
            })}
          />
          <StatusRow
            label={t('events.redesign.status.attention')}
            note={t('events.redesign.status.attentionNote')}
            value={t('events.redesign.status.itemCount', { count: summary.attentionCount })}
          />
        </div>
      </Card>
    </section>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="money-number mt-3 text-xl font-semibold">{value}</p>
    </div>
  )
}

function StatusRow({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>
      <p className="money-number shrink-0 text-lg font-semibold">{value}</p>
    </div>
  )
}

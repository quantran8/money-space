import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { PeriodSummary } from '@money-space/core/features/events/model/events-form'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type EventsSummaryStripProps = {
  summary: PeriodSummary
}

/**
 * What this month came to, above the timeline that lists it row by row.
 *
 * Net leads and is the only figure at `t-figure`: in and out are inputs to the
 * question, net IS the question ("did this month add up"). The month itself is
 * named once, by the scope control under the page title, so this header does
 * not repeat it.
 *
 * Only records that actually happened are counted — an unpaid or postponed row
 * is money that has not moved, and folding it in here would report a month that
 * has not finished happening.
 */
export function EventsSummaryStrip({ summary }: EventsSummaryStripProps) {
  const { t } = useTranslation()
  const isShort = summary.netChange < 0

  const metrics = [
    {
      icon: ArrowLeftRight,
      iconTone: 'text-data-primary',
      label: t('events.summary.net'),
      value: `${isShort ? '−' : '+'}${formatVndScale(Math.abs(summary.netChange))}`,
      // Colour marks what needs a look (§5.2), so only a month that ended
      // short is tinted. A positive net is the expected case and stays ink —
      // a static metric never wears the action colour (§4).
      valueClassName: isShort ? 'text-alert-ink' : undefined,
      lead: true,
    },
    {
      icon: ArrowDownLeft,
      iconTone: 'text-protect',
      label: t('events.summary.moneyIn'),
      value: `+${formatVndScale(summary.totalIncome)}`,
      valueClassName: undefined,
      lead: false,
    },
    {
      icon: ArrowUpRight,
      iconTone: 'text-ink2',
      label: t('events.summary.moneyOut'),
      value: `−${formatVndScale(summary.totalOutcome)}`,
      valueClassName: undefined,
      lead: false,
    },
  ]

  return (
    <Panel>
      <PanelHeader title={t('events.summary.title')} />

      {/*
        Label row and figure row are shared across the columns via `subgrid`, so
        the three figures sit on one baseline even though net is a step taller.
        Three independent blocks would step the smaller two up by that
        difference and the row stops reading as one comparison. Below `md` the
        columns stack and net drops back to `t-metric`.
      */}
      <div className="s-head-body grid gap-x-12 gap-y-5 md:grid-cols-[1.2fr_1fr_1fr] md:grid-rows-[auto_1fr] md:gap-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="grid gap-y-2 md:row-span-2 md:grid-rows-subgrid">
            <MetricLabel icon={metric.icon} tone={metric.iconTone} label={metric.label} />
            <p
              className={cn(
                'money-number self-end',
                metric.lead ? 't-metric lg:t-figure' : 't-metric',
                metric.valueClassName,
              )}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function MetricLabel({ icon: Icon, tone, label }: { icon: LucideIcon; tone: string; label: string }) {
  return (
    <p className="flex items-center gap-2 t-body-sm text-ink2">
      <Icon className={cn('size-[18px] shrink-0', tone)} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </p>
  )
}

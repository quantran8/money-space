import type { ReactNode } from 'react'
import {
  ArrowRight,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  assetGroups,
  attentionItems,
  dashboardGoals as goals,
  dashboardSnapshot as snapshot,
  moneyEvents,
  upcomingPayments as payments,
} from '@/lib/mock-data'

type MetricCellProps = {
  label: string
  value: string
  className?: string
}

function MetricCell({ label, value, className }: MetricCellProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-4', className)}>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="money-number mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  to,
  children,
}: {
  title: string
  subtitle: string
  to: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[hsl(var(--accent))]"
        >
          {t('common.view')}
          <ArrowRight className="ml-1 size-4" />
        </Link>
      </div>

      {children}
    </section>
  )
}

function SubSectionLink({
  title,
  to,
  children,
  className,
  titleClassName,
}: {
  title: string
  to: string
  children: ReactNode
  className?: string
  titleClassName?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'block rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 transition-colors hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className={cn('text-sm font-semibold text-[hsl(var(--muted-foreground))]', titleClassName)}>
          {title}
        </h3>
        <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      {children}
    </Link>
  )
}

function shortDate(value: string) {
  return value.replace('/2026', '')
}

function dueDate(value: string) {
  return value.replace(' Jul', '/07')
}

function amountGap(current: string, target: string) {
  const currentValue = Number(current.replace(/[^\d.]/g, ''))
  const targetValue = Number(target.replace(/[^\d.]/g, ''))

  if (!Number.isFinite(currentValue) || !Number.isFinite(targetValue)) {
    return ''
  }

  return `${Math.max(targetValue - currentValue, 0)}M`
}

const longTermAssets = assetGroups.find((group) => group.name === 'Dài hạn')?.value ?? '374M'
const primaryAssets = assetGroups
  .find((group) => group.name === 'Dài hạn')
  ?.note.split(',')
  .slice(0, 2)
  .map((item) => item.trim())
  .join(', ') ?? 'Vàng, đầu tư'
const nearestPayment = payments[0]
const firstAttention = attentionItems[0]
const mainGoal = goals[0]

export function DashboardPage() {
  const { t } = useTranslation()
  const goalGap = amountGap(mainGoal.current, mainGoal.target) || t('common.notCalculated')
  const statusKey =
    snapshot.attentionCount > 2
      ? 'dashboard.status.tense'
      : snapshot.attentionCount > 0
        ? 'dashboard.status.attention'
        : 'dashboard.status.stable'
  const statusLabel = t(statusKey)

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-8 lg:col-span-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    statusKey === 'dashboard.status.stable' &&
                      'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]',
                    statusKey === 'dashboard.status.attention' &&
                      'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
                    statusKey === 'dashboard.status.tense' &&
                      'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
                  )}
                >
                  {statusLabel}
                </Badge>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.updatedAt', { date: shortDate(snapshot.updatedAt) })}
                </span>
              </div>
              <h1 className="page-title mt-4 text-4xl font-semibold sm:text-[2.8rem]">
                {t('dashboard.title')}
              </h1>
            </div>

            <Link
              to="/events"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" />
              {t('dashboard.heroButton')}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('dashboard.metrics.liquid')}</p>
              <p className="money-number mt-2 text-2xl font-bold">{snapshot.liquidDisplay}</p>
            </div>
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('dashboard.metrics.upcoming')}</p>
              <p className="mt-2 text-2xl font-semibold">{t('dashboard.metrics.paymentsCount', { count: payments.length })}</p>
            </div>
            <div className="rounded-3xl bg-[hsl(var(--secondary))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('dashboard.metrics.attention')}</p>
              <p className="mt-2 text-2xl font-semibold">{t('dashboard.metrics.attentionCount', { count: snapshot.attentionCount })}</p>
            </div>
          </div>
        </Card>

        <Link
          to="/events"
          className="hidden rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] lg:col-span-3 lg:block"
        >
          <Card className="flex h-full min-h-[180px] flex-col justify-between rounded-[32px] bg-[hsl(var(--foreground))] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">{t('common.quick')}</p>
              <Bell className="size-5 text-white/80" />
            </div>
            <div>
              <p className="section-title text-3xl font-semibold">{t('dashboard.quickCardTitle')}</p>
              <p className="mt-2 text-sm text-white/70">{t('common.takesTwoMinutes')}</p>
            </div>
          </Card>
        </Link>
      </section>

      <SectionCard title={t('dashboard.sections.money.title')} subtitle={t('dashboard.sections.money.subtitle')} to="/assets">
        <div className="grid gap-4 lg:grid-cols-2">
          <SubSectionLink title={t('dashboard.sections.money.liquidity')} to="/assets">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCell label={t('dashboard.sections.money.liquid')} value={snapshot.liquidDisplay} />
              <MetricCell label={t('dashboard.sections.money.reserve')} value={snapshot.savings} />
            </div>
          </SubSectionLink>

          <SubSectionLink title={t('dashboard.sections.money.totalAssets')} to="/assets">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCell label={t('dashboard.sections.money.assets')} value={longTermAssets} />
              <MetricCell label={t('dashboard.sections.money.debt')} value={snapshot.debt} />
            </div>
          </SubSectionLink>
        </div>
      </SectionCard>

      <SectionCard title={t('dashboard.sections.attention.title')} subtitle={t('dashboard.sections.attention.subtitle')} to="/payments">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SubSectionLink
            title={t('dashboard.sections.attention.upcoming')}
            to="/payments"
            className="border-[hsla(var(--status-orange),0.18)] bg-[hsla(var(--status-orange),0.1)]"
            titleClassName="text-[hsl(var(--status-orange))]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[hsl(var(--status-orange))]">
                {t('dashboard.metrics.paymentsCount', { count: payments.length })}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('dashboard.sections.attention.nearest')}</p>
              <p className="mt-1 text-xl font-bold">{nearestPayment.name}</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {dueDate(nearestPayment.due)} · {nearestPayment.amount}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {payments.slice(1, 3).map((payment) => (
                <span key={payment.name} className="rounded-full bg-white px-3 py-2">
                  {payment.name} {dueDate(payment.due)}
                </span>
              ))}
            </div>
          </SubSectionLink>

          <SubSectionLink title={t('dashboard.sections.attention.discuss')} to="/events">
            <div className="mt-1">
              <p className="text-3xl font-bold">{t('dashboard.metrics.attentionCount', { count: snapshot.attentionCount })}</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {firstAttention.title.replace(' hơi lớn so với mức tiền dùng ngay', '')}
              </p>
            </div>
            <span className="mt-6 inline-flex rounded-full bg-[hsl(var(--foreground))] px-4 py-3 text-sm font-semibold text-white">
              {t('dashboard.sections.attention.discussMore')}
            </span>
          </SubSectionLink>
        </div>
      </SectionCard>

      <SectionCard title={t('dashboard.sections.longTerm.title')} subtitle={t('dashboard.sections.longTerm.subtitle')} to="/goals">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <SubSectionLink title={t('dashboard.sections.longTerm.mainGoal')} to="/goals">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('dashboard.sections.longTerm.mainGoal')}</p>
                <p className="mt-2 text-2xl font-bold">{mainGoal.name}</p>
              </div>
              <p className="money-number text-4xl font-bold">{mainGoal.progress}%</p>
            </div>
            <Progress value={mainGoal.progress} className="mt-6" />
          </SubSectionLink>

          <div className="grid gap-3">
            <SubSectionLink title={t('dashboard.sections.longTerm.remaining')} to="/goals">
              <p className="money-number text-2xl font-bold">{goalGap}</p>
            </SubSectionLink>

            <SubSectionLink title={t('dashboard.sections.longTerm.mainAssets')} to="/assets">
              <p className="text-xl font-bold">{primaryAssets}</p>
            </SubSectionLink>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t('dashboard.sections.recent.title')}
        subtitle={`${moneyEvents[0].title} · ${moneyEvents[0].date}`}
        to="/events"
      >
        <Link
          to="/events"
          className="block rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 transition-colors hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t('dashboard.sections.recent.activity')}</h3>
            <ArrowRight className="size-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div className="space-y-3">
            {moneyEvents.slice(0, 3).map((event) => (
              <div
                key={`${event.title}-${event.date}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.date}</p>
                </div>
                <p className="money-number shrink-0 text-xl">{event.amount}</p>
              </div>
            ))}
          </div>
        </Link>
      </SectionCard>
    </div>
  )
}

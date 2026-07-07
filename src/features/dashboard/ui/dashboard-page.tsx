import type { ReactNode } from 'react'
import { Bell, ChevronRight, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview'
import { cn } from '@/shared/lib/utils'

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
    <Card className="rounded-[32px] p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title text-xl font-semibold md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[hsl(var(--accent))]"
        >
          {t('common.view')}
          <ChevronRight className="ml-0.5 size-4" strokeWidth={1.8} />
        </Link>
      </div>

      {children}
    </Card>
  )
}

/**
 * A soft-tinted meaning group inside a section (design.md §10.4). Its header
 * is a link into the relevant detail page.
 */
function SoftGroup({
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
    <div className={cn('rounded-3xl bg-[hsl(var(--muted))] p-4', className)}>
      <Link to={to} className="flex items-center justify-between gap-2 px-1">
        <p className={cn('text-sm font-medium text-[hsl(var(--muted-foreground))]', titleClassName)}>
          {title}
        </p>
        <ChevronRight className="size-4 text-[hsl(var(--muted-foreground))]" strokeWidth={1.8} />
      </Link>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/**
 * A divided list of label/value rows on a white surface — the grouped-list
 * pattern the design system prefers over stacks of mini metric cards.
 */
function StatList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-2xl bg-card">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">{row.label}</span>
          <strong className="money-number text-2xl">{row.value}</strong>
        </div>
      ))}
    </div>
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

export function DashboardPage() {
  const { t } = useTranslation()
  const {
    snapshot,
    payments,
    goals,
    assetGroups,
    attentionItems,
    recentEvents: moneyEvents,
  } = useDashboardOverview()

  const longTermAssets =
    assetGroups.find((group) => group.name === 'Dài hạn')?.value ?? '374M'
  const primaryAssets =
    assetGroups
      .find((group) => group.name === 'Dài hạn')
      ?.note.split(',')
      .slice(0, 2)
      .map((item) => item.trim())
      .join(', ') ?? 'Vàng, đầu tư'
  const firstAttention = attentionItems[0]
  const mainGoal = goals[0]
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
        <Card className="apple-shadow rounded-[32px] p-6 md:p-8 lg:col-span-9">
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
              <h1 className="page-title mt-4 text-4xl font-semibold md:text-5xl">
                {t('dashboard.title')}
              </h1>
            </div>

            <Link
              to="/events"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" strokeWidth={1.8} />
              {t('dashboard.heroButton')}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[hsl(var(--muted))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.metrics.liquid')}
              </p>
              <p className="money-number mt-2 text-2xl md:text-3xl">{snapshot.liquidDisplay}</p>
            </div>
            <div className="rounded-2xl bg-[hsl(var(--muted))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.metrics.upcoming')}
              </p>
              <p className="mt-2 text-2xl font-semibold md:text-3xl">
                {t('dashboard.metrics.paymentsCount', { count: payments.length })}
              </p>
            </div>
            <div className="rounded-2xl bg-[hsl(var(--muted))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.metrics.attention')}
              </p>
              <p className="mt-2 text-2xl font-semibold md:text-3xl">
                {t('dashboard.metrics.attentionCount', { count: snapshot.attentionCount })}
              </p>
            </div>
          </div>
        </Card>

        <Link
          to="/events"
          className="hidden rounded-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] lg:col-span-3 lg:block"
        >
          <Card className="apple-shadow flex h-full min-h-[180px] flex-col justify-between rounded-[32px] bg-[hsl(var(--foreground))] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">{t('common.quick')}</p>
              <Bell className="size-5 text-white/80" strokeWidth={1.8} />
            </div>
            <div>
              <p className="section-title text-3xl font-semibold">{t('dashboard.quickCardTitle')}</p>
              <p className="mt-1 text-sm text-white/60">{t('common.takesTwoMinutes')}</p>
            </div>
          </Card>
        </Link>
      </section>

      <SectionCard
        title={t('dashboard.sections.money.title')}
        subtitle={t('dashboard.sections.money.subtitle')}
        to="/assets"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <SoftGroup title={t('dashboard.sections.money.liquidity')} to="/assets">
            <StatList
              rows={[
                { label: t('dashboard.sections.money.liquid'), value: snapshot.liquidDisplay },
                { label: t('dashboard.sections.money.reserve'), value: snapshot.savings },
              ]}
            />
          </SoftGroup>

          <SoftGroup title={t('dashboard.sections.money.totalAssets')} to="/assets">
            <StatList
              rows={[
                { label: t('dashboard.sections.money.assets'), value: longTermAssets },
                { label: t('dashboard.sections.money.debt'), value: snapshot.debt },
              ]}
            />
          </SoftGroup>
        </div>
      </SectionCard>

      <SectionCard
        title={t('dashboard.sections.attention.title')}
        subtitle={t('dashboard.sections.attention.subtitle')}
        to="/payments"
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SoftGroup
            title={t('dashboard.sections.attention.upcoming')}
            to="/payments"
            titleClassName="text-[hsl(var(--status-orange))]"
          >
            <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-2xl bg-card">
              {payments.map((payment, index) => (
                <Link
                  key={payment.name}
                  to="/payments"
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[hsl(var(--muted))]"
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'truncate font-medium tracking-[-0.01em]',
                        index === 0 && 'font-semibold',
                      )}
                    >
                      {payment.name}
                    </p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {dueDate(payment.due)}
                      {payment.amount ? ` · ${payment.amount}` : ''}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]"
                    strokeWidth={1.8}
                  />
                </Link>
              ))}
            </div>
          </SoftGroup>

          <SoftGroup title={t('dashboard.sections.attention.discuss')} to="/events">
            <p className="money-number px-1 text-4xl">
              {t('dashboard.metrics.attentionCount', { count: snapshot.attentionCount })}
            </p>
            <p className="mt-2 px-1 text-sm text-[hsl(var(--muted-foreground))]">
              {firstAttention.title.replace(' hơi lớn so với mức tiền dùng ngay', '')}
            </p>
            <Link
              to="/events"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
            >
              {t('dashboard.sections.attention.discussMore')}
            </Link>
          </SoftGroup>
        </div>
      </SectionCard>

      <SectionCard
        title={t('dashboard.sections.longTerm.title')}
        subtitle={t('dashboard.sections.longTerm.subtitle')}
        to="/goals"
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SoftGroup title={t('dashboard.sections.longTerm.mainGoal')} to="/goals">
            <div className="rounded-2xl bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-semibold tracking-[-0.02em]">{mainGoal.name}</p>
                <p className="money-number text-2xl md:text-3xl">{mainGoal.progress}%</p>
              </div>
              <Progress value={mainGoal.progress} className="mt-5 h-2.5" />
            </div>
          </SoftGroup>

          <SoftGroup title={t('dashboard.sections.longTerm.remaining')} to="/goals">
            <div className="rounded-2xl bg-card p-5">
              <p className="money-number text-3xl">{goalGap}</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.longTerm.mainAssets')} · {primaryAssets}
              </p>
            </div>
          </SoftGroup>
        </div>
      </SectionCard>

      <SectionCard
        title={t('dashboard.sections.recent.title')}
        subtitle={`${moneyEvents[0].title} · ${moneyEvents[0].date}`}
        to="/events"
      >
        <div className="rounded-3xl bg-[hsl(var(--muted))] p-4">
          <p className="px-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {t('dashboard.sections.recent.activity')}
          </p>
          <div className="mt-4 divide-y divide-[hsl(var(--border))] overflow-hidden rounded-2xl bg-card">
            {moneyEvents.slice(0, 3).map((event) => (
              <Link
                key={`${event.title}-${event.date}`}
                to="/events"
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium tracking-[-0.01em]">{event.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.date}</p>
                </div>
                <p className="money-number shrink-0 text-lg">{event.amount}</p>
              </Link>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

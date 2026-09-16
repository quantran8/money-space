import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { EventsSummaryResponse } from '@money-space/core/features/events/api/events.repository'
import type { MoneyEventItem } from '@money-space/core/features/events/model/events.types'
import { formatVndCellSigned, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { Panel, PanelHeader } from '@/components/ui'
import { CategoryDisc } from '@/features/events/ui/components/category-disc'
import { colors, TOUCH_TARGET } from '@/theme/tokens'

/** The direction fills at low alpha, matching the web's `bg-positive/15`. */
const DISC_POSITIVE = 'rgba(143, 205, 164, 0.22)'
const DISC_ALERT = 'rgba(232, 163, 154, 0.26)'

/**
 * Home section — Chi tiêu tháng này.
 *
 * What has ALREADY moved this month, as its own card rather than a strip inside
 * the 30-day section: this card is the month that happened, the forecast is the
 * month that is coming.
 *
 * The two totals are the answer and the rows are the evidence. It stops at
 * three — past that this becomes the Events page (§2.14).
 *
 * Nothing here attributes a movement to a person: the rows name WHAT was
 * recorded, never who recorded it (§0.2, §16.4).
 */
export function SpendingSection({
  summary,
  recentEvents,
  categoryVisualById,
  asOfDate,
  onViewAll,
}: {
  /** Backend aggregate for the month. Omitted → the card says so. */
  summary?: EventsSummaryResponse
  recentEvents: MoneyEventItem[]
  categoryVisualById?: Record<
    string,
    { label: string; iconKey: string | null; iconColor: string | null }
  >
  /** Today, per the forecast — the month is only recorded up to here. */
  asOfDate: string
  onViewAll: () => void
}) {
  const { t } = useTranslation()

  // Two zeroes would state that nothing moved this month, which is a different
  // claim from not knowing (§23).
  if (!summary) {
    return (
      <Panel>
        <PanelHeader title={t('home.spending.title')} />
        <Text className="mt-6 t-body-sm text-ink2">{t('home.spending.unavailable')}</Text>
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHeader
        title={t('home.spending.title')}
        right={
          <Text className="font-mono t-caption text-ink3">
            {t('home.spending.meta', { date: formatDayMonth(asOfDate) })}
          </Text>
        }
      />

      <View className="mt-7 gap-7">
        <SpendingTotal
          icon="arrow-bottom-left"
          label={t('home.spending.income')}
          value={formatVndScale(summary.totalIncome)}
          tone="text-positive-ink"
          glyph={colors.positiveInk}
          disc={DISC_POSITIVE}
        />
        <SpendingTotal
          icon="arrow-top-right"
          label={t('home.spending.outcome')}
          value={formatVndScale(-summary.totalOutcome)}
          tone="text-alert-ink"
          glyph={colors.alertInk}
          disc={DISC_ALERT}
        />
      </View>

      {recentEvents.length > 0 ? (
        <View className="mt-8">
          {/* No glyph beside the heading: the rows below carry category discs,
              and a second icon competes with them for the same reading. */}
          <Text className="t-subtitle text-ink">{t('home.spending.recent')}</Text>

          <View className="mt-2">
            {recentEvents.map((event, index) => (
              <RecentEventRow
                key={event.id ?? `${event.isoDate}-${index}`}
                event={event}
                visual={categoryVisualById?.[event.categoryId]}
                isFirst={index === 0}
              />
            ))}
          </View>

          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            style={{ minHeight: TOUCH_TARGET }}
            className="mt-3 justify-center active:opacity-70"
          >
            <Text className="t-body font-medium text-action">{t('home.spending.viewAll')}</Text>
          </Pressable>
        </View>
      ) : null}
    </Panel>
  )
}

function SpendingTotal({
  icon,
  label,
  value,
  tone,
  glyph,
  disc,
}: {
  icon: 'arrow-bottom-left' | 'arrow-top-right'
  label: string
  value: string
  tone: string
  /** The glyph's ink — an `*-ink` token, because it is read, not a fill. */
  glyph: string
  /** The tinted disc behind the glyph. */
  disc: string
}) {
  return (
    <View className="flex-row items-start gap-4">
      {/* A tinted disc, so the two directions are told apart before either
          figure is read. Decorative — the label names the direction (§24). */}
      <View
        accessible={false}
        style={{
          marginTop: 4,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: disc,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={glyph} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="t-body-sm font-medium text-ink">{label}</Text>
        {/* `formatVndScale` carries its own unit ("21,6 tr"), so no unit is
            appended — that would print it twice (§10.4). */}
        <Text className={cn('mt-1 t-figure', tone)} style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
    </View>
  )
}

/**
 * One recorded movement, drawn the way the Events timeline draws it: a category
 * disc, the note over its category, and the signed amount.
 */
function RecentEventRow({
  event,
  visual,
  isFirst,
}: {
  event: MoneyEventItem
  visual?: { label: string; iconKey: string | null; iconColor: string | null }
  isFirst: boolean
}) {
  const { t } = useTranslation()

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 py-3',
        !isFirst && 'border-t border-divider',
      )}
    >
      <CategoryDisc visual={visual} size={44} />

      <View className="min-w-0 flex-1">
        {/* The note is what the household wrote; the category label is the
            fallback when they wrote nothing, so a row is never blank. */}
        <Text className="t-body-sm font-medium text-ink" numberOfLines={1}>
          {event.note || visual?.label || t(`options.eventType.${event.type}`)}
        </Text>
        <Text className="t-caption text-ink3" numberOfLines={1}>
          {event.note && visual?.label
            ? `${formatDayMonth(event.isoDate)} · ${visual.label}`
            : formatDayMonth(event.isoDate)}
        </Text>
      </View>

      {/* `amount` arrives already signed (inflow > 0), so the sign is the
          data's, not something re-derived from `direction`. */}
      <View className="flex-row items-baseline gap-1">
        <Text
          className={cn(
            't-body-sm font-medium',
            event.amount > 0 ? 'text-positive-ink' : 'text-alert-ink',
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatVndCellSigned(event.amount)}
        </Text>
        <Text className="font-mono t-caption-sm text-ink3">{t('units.million')}</Text>
      </View>
    </View>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}

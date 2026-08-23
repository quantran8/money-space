/**
 * The forecast pieces. `Sắp tới` composes all of them; Home may borrow the
 * timeline or the assumptions note for its own 30-day preview.
 */

export { AssumptionsNote } from '@/features/forecast/ui/assumptions-note'
export { ForecastSummary } from '@/features/forecast/ui/forecast-summary'
export { ForecastTimeline } from '@/features/forecast/ui/forecast-timeline'
export { HorizonSelector } from '@/features/forecast/ui/horizon-selector'

export {
  formatDayMonth,
  formatFullDate,
  isoPlusDays,
  monthKey,
  monthParts,
  todayIso,
} from '@/features/forecast/lib/forecast-dates'

export type { ForecastTimelineProps } from '@/features/forecast/ui/forecast-timeline'

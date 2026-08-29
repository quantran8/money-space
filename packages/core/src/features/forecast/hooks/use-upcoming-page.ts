import { useMemo, useState } from 'react'

import { useForecast } from '#/features/forecast/hooks/use-forecast'
import {
  DEFAULT_RANGE,
  horizonFor,
  resolveRange,
  windowForecast,
  type ForecastRange,
} from '#/features/forecast/model/forecast-range'
import { daysWithActivity } from '#/features/forecast/model/forecast-presentation'
import { buildOverdue } from '#/features/forecast/model/forecast-overdue'
import { useCashflowEvents } from '#/features/cashflow/hooks/use-cashflow-events'

export function useUpcomingPage() {
  const [range, setRange] = useState<ForecastRange>(DEFAULT_RANGE)

  /**
   * The horizon is DERIVED from the range, never chosen directly.
   *
   * Until the first forecast lands there is no `asOfDate` to resolve a calendar
   * range against, so the horizon is computed from the device date and then
   * recomputed from `asOfDate` once the server answers. A rolling range — the
   * default — resolves to the same horizon either way, so the common path never
   * refetches.
   */
  const today = new Date().toISOString().slice(0, 10)
  const { forecast, isLoading, isError, error } = useForecast(horizonFor(range, today))

  const { cashflowEvents } = useCashflowEvents()

  const asOf = forecast?.asOfDate ?? today
  const bounds = useMemo(() => resolveRange(range, asOf), [range, asOf])

  const summary = useMemo(
    () => (forecast ? windowForecast(forecast, bounds.start, bounds.end) : undefined),
    [forecast, bounds.start, bounds.end],
  )

  // The table shows the same window the summary describes, so a row can never
  // sit outside the period the figures above it were computed for.
  //
  // Overdue occurrences are lifted OUT of it and into their own section: the
  // backend clamps them onto day 0, so in the timeline they read as "due today"
  // among genuinely upcoming items. They are still counted in every figure —
  // only where they are LISTED changes — and a day left with no other
  // occurrence drops out rather than rendering as an empty date.
  const days = useMemo(
    () =>
      daysWithActivity(forecast)
        .filter((day) => day.date >= bounds.start && day.date <= bounds.end)
        .map((day) => ({
          ...day,
          occurrences: day.occurrences.filter(
            (occurrence) => !occurrence.wasClampedFromPast,
          ),
        }))
        .filter((day) => day.occurrences.length > 0),
    [forecast, bounds.start, bounds.end],
  )

  // The same derivation Home uses, so "quá hạn" means one thing in the product.
  // No row limit here: this is the page you open to work through them, and a
  // "còn N khoản nữa" line with nowhere further to go would be a dead end.
  const overdue = useMemo(
    () => (forecast ? buildOverdue(forecast, cashflowEvents, Number.MAX_SAFE_INTEGER) : undefined),
    [forecast, cashflowEvents],
  )

  return {
    range,
    setRange,
    /** Occurrences clamped onto day 0 — listed in their own section, not the timeline. */
    overdue,
    /** `[start, end]` the page is answering for, both inclusive. */
    bounds,
    forecast,
    /** Figures recomputed for `bounds`. Undefined until the forecast lands. */
    summary,
    days,
    isLoading,
    isError,
    error,
    // The page is empty only when NEITHER list has anything — an overdue-only
    // page still has something to show and must not render the empty state.
    isEmpty: !isLoading && days.length === 0 && (overdue?.totalCount ?? 0) === 0,
  }
}

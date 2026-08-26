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

  const asOf = forecast?.asOfDate ?? today
  const bounds = useMemo(() => resolveRange(range, asOf), [range, asOf])

  const summary = useMemo(
    () => (forecast ? windowForecast(forecast, bounds.start, bounds.end) : undefined),
    [forecast, bounds.start, bounds.end],
  )

  // The table shows the same window the summary describes, so a row can never
  // sit outside the period the figures above it were computed for.
  const days = useMemo(
    () => daysWithActivity(forecast).filter(
      (day) => day.date >= bounds.start && day.date <= bounds.end,
    ),
    [forecast, bounds.start, bounds.end],
  )

  return {
    range,
    setRange,
    /** `[start, end]` the page is answering for, both inclusive. */
    bounds,
    forecast,
    /** Figures recomputed for `bounds`. Undefined until the forecast lands. */
    summary,
    days,
    isLoading,
    isError,
    error,
    isEmpty: !isLoading && days.length === 0,
  }
}

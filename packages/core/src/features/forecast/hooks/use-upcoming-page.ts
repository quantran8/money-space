import { useMemo, useState } from 'react'

import { useForecast } from '#/features/forecast/hooks/use-forecast'
import {
  DEFAULT_HORIZON,
  type HorizonDays,
} from '#/features/forecast/model/forecast.types'
import { daysWithActivity } from '#/features/forecast/model/forecast-presentation'

export function useUpcomingPage() {
  const [horizonDays, setHorizonDays] = useState<HorizonDays>(DEFAULT_HORIZON)
  const { forecast, isLoading, isError, error } = useForecast(horizonDays)

  const days = useMemo(() => daysWithActivity(forecast), [forecast])

  return {
    horizonDays,
    setHorizonDays,
    forecast,
    days,
    isLoading,
    isError,
    error,
    isEmpty: !isLoading && days.length === 0,
  }
}

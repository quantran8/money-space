import { useQuery } from '@tanstack/react-query'

import { getForecastBundle, type ForecastBundle } from '#/features/forecast/api/forecast.repository'
import { DEFAULT_HORIZON, type HorizonDays } from '#/features/forecast/model/forecast.types'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * The one request behind all three forecast hooks.
 *
 * `flexibleMoney` and `financialState` are pure functions of `forecast`, so the
 * server computes them from a single load and returns all three together. The
 * three hooks below share this query key, which means Home — which reads all
 * three — issues ONE request instead of three that each re-loaded the same
 * assets/events/reserves bundle and re-ran the same engine.
 *
 * `select` narrows the shared cache entry per hook without splitting it: every
 * caller still gets the same TanStack Query status fields it had before.
 */
function useForecastBundle<T>(horizonDays: HorizonDays, select: (bundle: ForecastBundle) => T) {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.forecastBundle(activeHouseholdId, horizonDays)
      : ['forecast-bundle', 'inactive'],
    queryFn: () => getForecastBundle(activeHouseholdId!, horizonDays),
    enabled: !!activeHouseholdId,
    select,
  })

  return { query, activeHouseholdId }
}

export function useForecast(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { query, activeHouseholdId } = useForecastBundle(
    horizonDays,
    (bundle) => bundle.forecast,
  )

  return { forecast: query.data, activeHouseholdId, ...query }
}

export function useFlexibleMoney(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { query, activeHouseholdId } = useForecastBundle(
    horizonDays,
    (bundle) => bundle.flexibleMoney,
  )

  return { flexibleMoney: query.data, activeHouseholdId, ...query }
}

export function useFinancialState(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { query, activeHouseholdId } = useForecastBundle(
    horizonDays,
    (bundle) => bundle.financialState,
  )

  return { financialState: query.data, activeHouseholdId, ...query }
}

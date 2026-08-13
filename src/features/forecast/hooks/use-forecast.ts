import { useQuery } from '@tanstack/react-query'

import {
  getFinancialState,
  getFlexibleMoney,
  getForecast,
} from '@/features/forecast/api/forecast.repository'
import { DEFAULT_HORIZON, type HorizonDays } from '@/features/forecast/model/forecast.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

export function useForecast(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.forecast(activeHouseholdId, horizonDays)
      : ['forecast', 'inactive'],
    queryFn: () => getForecast(activeHouseholdId!, horizonDays),
    enabled: !!activeHouseholdId,
  })

  return { forecast: query.data, activeHouseholdId, ...query }
}

export function useFlexibleMoney(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.flexibleMoney(activeHouseholdId, horizonDays)
      : ['flexible-money', 'inactive'],
    queryFn: () => getFlexibleMoney(activeHouseholdId!, horizonDays),
    enabled: !!activeHouseholdId,
  })

  return { flexibleMoney: query.data, activeHouseholdId, ...query }
}

export function useFinancialState(horizonDays: HorizonDays = DEFAULT_HORIZON) {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.financialState(activeHouseholdId, horizonDays)
      : ['financial-state', 'inactive'],
    queryFn: () => getFinancialState(activeHouseholdId!, horizonDays),
    enabled: !!activeHouseholdId,
  })

  return { financialState: query.data, activeHouseholdId, ...query }
}

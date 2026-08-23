import { apiRequest } from '#/shared/api/http'
import type {
  FinancialStateResult,
  FlexibleMoneyResult,
  ForecastResult,
  HorizonDays,
} from '#/features/forecast/model/forecast.types'

export function getForecast(householdId: string, horizonDays: HorizonDays) {
  return apiRequest<ForecastResult>(
    `/api/households/${householdId}/forecast?horizon_days=${horizonDays}`,
  )
}

export function getFlexibleMoney(householdId: string, horizonDays: HorizonDays) {
  return apiRequest<FlexibleMoneyResult>(
    `/api/households/${householdId}/flexible-money?horizon_days=${horizonDays}`,
  )
}

export function getFinancialState(householdId: string, horizonDays: HorizonDays) {
  return apiRequest<FinancialStateResult>(
    `/api/households/${householdId}/financial-state?horizon_days=${horizonDays}`,
  )
}

export type ForecastBundle = {
  forecast: ForecastResult
  flexibleMoney: FlexibleMoneyResult
  financialState: FinancialStateResult
}

/**
 * All three readings of one forecast in a single request.
 *
 * `flexibleMoney` and `financialState` are pure functions of `forecast`, so
 * fetching them separately made the server load the same data and run the same
 * engine three times per page view. Prefer this over the three single-value
 * endpoints wherever more than one of them is read.
 */
export function getForecastBundle(householdId: string, horizonDays: HorizonDays) {
  return apiRequest<ForecastBundle>(
    `/api/households/${householdId}/forecast-bundle?horizon_days=${horizonDays}`,
  )
}

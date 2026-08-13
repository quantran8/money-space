import { apiRequest } from '@/shared/api/http'
import type {
  FinancialStateResult,
  FlexibleMoneyResult,
  ForecastResult,
  HorizonDays,
} from '@/features/forecast/model/forecast.types'

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

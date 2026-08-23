import { apiRequest } from '#/shared/api/http'
import type { ActivityPage } from '#/features/activity/model/activity.types'

export function listActivity(
  householdId: string,
  params: { limit?: number; before?: string } = {},
) {
  return apiRequest<ActivityPage>(
    `/api/households/${householdId}/activity`,
    undefined,
    { limit: params.limit, before: params.before },
  )
}

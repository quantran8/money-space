import { apiRequest } from '@/shared/api/http'
import type { WhatIfRequest, WhatIfResult } from '@/features/whatif/model/whatif.types'

/**
 * A POST that is a READ — it writes nothing. It is a POST only because it needs
 * a request body. Never gate it behind an `edit` capability.
 */
export function runWhatIf(householdId: string, payload: WhatIfRequest) {
  return apiRequest<WhatIfResult>(`/api/households/${householdId}/what-if`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

import { apiRequest } from '#/shared/api/http'

export type FeedbackType = 'bug' | 'idea' | 'other'

/** Everything the client attaches without being asked. */
export type FeedbackContext = {
  /** The route the user was on: '/goals', '/(tabs)/household'. */
  route?: string
  platform?: string
  appVersion?: string
  /** Browser UA on web; absent on native. */
  userAgent?: string
  /** Which copy they were reading when it happened. */
  locale?: string
}

export type SubmitFeedbackPayload = {
  type: FeedbackType
  message: string
  /** The space they were looking at, when there is one. A hint, not a scope. */
  householdId?: string | null
  context: FeedbackContext
}

/**
 * Send a report. Version-free path — `http.ts` applies `/api/v1`.
 *
 * NOT under `/households/:id`: the reports worth the most come from someone with
 * no household yet, and a household-scoped path gives them no URL to post to.
 * The server takes the actor from the bearer token.
 */
export function submitFeedback(payload: SubmitFeedbackPayload) {
  return apiRequest<{ submitted: true; feedbackId: string }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

import { z } from 'zod'

import type { FeedbackType } from '#/features/feedback/api/feedback.repository'
import { localizedRequiredText } from '#/shared/lib/validation'

/** Matches the server's cap, so the form refuses what the API would refuse. */
export const FEEDBACK_MESSAGE_MAX = 2000

export type FeedbackForm = {
  type: FeedbackType
  message: string
}

export const defaultFeedbackFormValues: FeedbackForm = {
  // 'bug' leads because a broken thing is the report that cannot wait; an idea
  // keeps.
  type: 'bug',
  message: '',
}

export function buildFeedbackSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  return z.object({
    type: z.enum(['bug', 'idea', 'other']),
    message: localizedRequiredText(
      t,
      t('feedback.form.message'),
      FEEDBACK_MESSAGE_MAX,
    ),
  })
}

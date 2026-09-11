import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  submitFeedback,
  type FeedbackContext,
} from '#/features/feedback/api/feedback.repository'
import {
  buildFeedbackSchema,
  defaultFeedbackFormValues,
  type FeedbackForm,
} from '#/features/feedback/model/feedback-form'
import { env } from '#/shared/api/env'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { useLocation } from '#/shared/navigation'
import { notify } from '#/shared/notify'

/**
 * The whole feature's logic, shared by the web dialog and the mobile sheet.
 *
 * No query key and no invalidation: a report is write-only, so there is nothing
 * cached that it changes and `useMutation` needs no key.
 *
 * Context is gathered HERE rather than in each UI, so the two clients cannot
 * drift into reporting different things. The one piece core cannot see is the
 * user agent — that is DOM, and core runs on Hermes too — so the host passes it.
 */
export function useFeedback({ userAgent }: { userAgent?: string } = {}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  // Null during onboarding and on /join — which is exactly when a report matters
  // most, so this is a hint and never a gate.
  const { activeHouseholdId } = useActiveHousehold()
  const location = useLocation()

  const schema = useMemo(() => buildFeedbackSchema(t), [t])

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(schema),
    defaultValues: defaultFeedbackFormValues,
    // §22.10: the button stays enabled and says what is missing on click.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const mutation = useMutation({
    mutationFn: (values: FeedbackForm) => {
      const context: FeedbackContext = {
        route: location.pathname,
        platform: env.platform,
        appVersion: env.appVersion,
        locale: i18n.resolvedLanguage,
        ...(userAgent ? { userAgent } : {}),
      }
      return submitFeedback({
        type: values.type,
        message: values.message,
        householdId: activeHouseholdId ?? null,
        context,
      })
    },
    onSuccess: () => {
      notify.success(t('feedback.toast.success'))
      form.reset(defaultFeedbackFormValues)
      setOpen(false)
    },
    onError: (error: unknown) => {
      notify.error(getErrorMessage(error, t('feedback.toast.error')))
    },
  })

  const submit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
  })

  /**
   * Closing discards the draft — a half-typed report kept across opens reads as
   * a form that failed to send.
   */
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) form.reset(defaultFeedbackFormValues)
  }

  return {
    open,
    setOpen,
    handleOpenChange,
    form,
    submit,
    isSubmitting: mutation.isPending,
  }
}

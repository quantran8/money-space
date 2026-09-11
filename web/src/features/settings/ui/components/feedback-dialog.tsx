import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Segmented, TextareaField } from '@/components/ui/form-22'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  FEEDBACK_MESSAGE_MAX,
  type FeedbackForm,
} from '@money-space/core/features/feedback/model/feedback-form'

/**
 * The report itself: what kind, and what happened.
 *
 * Two fields and nothing else. Route, version, platform and browser are attached
 * by the hook without asking — a form that made someone type their app version
 * is a form that gets abandoned.
 */
export function FeedbackDialog({
  open,
  onOpenChange,
  form,
  isSubmitting,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<FeedbackForm>
  isSubmitting: boolean
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const { control, formState } = form

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[520px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('feedback.dialog.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t('feedback.dialog.description')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="s-head-body flex flex-col gap-4"
        >
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'bug', label: t('feedback.type.bug') },
                  { value: 'idea', label: t('feedback.type.idea') },
                  { value: 'other', label: t('feedback.type.other') },
                ]}
              />
            )}
          />

          <Controller
            control={control}
            name="message"
            render={({ field }) => (
              <TextareaField
                id="feedback-message"
                label={t('feedback.form.message')}
                placeholder={t('feedback.form.messagePlaceholder')}
                rows={6}
                maxLength={FEEDBACK_MESSAGE_MAX}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors.message?.message}
              />
            )}
          />

          {/* What is attached, said plainly. Nobody should have to guess what a
              report carries about them. */}

          <ResponsiveDialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            {/* Never disabled (§22.10) — pressing it with an empty message runs
                the schema and says what is missing. */}
            <Button type="submit">
              {isSubmitting ? t('feedback.dialog.sending') : t('feedback.dialog.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

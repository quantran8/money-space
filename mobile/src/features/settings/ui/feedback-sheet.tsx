import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import {
  FEEDBACK_MESSAGE_MAX,
  type FeedbackForm,
} from '@money-space/core/features/feedback/model/feedback-form'

import { BottomSheet, Button, Field, Segmented } from '@/components/ui'

/**
 * The report, in a sheet. Two fields — everything else is attached for them.
 *
 * §22.10: the primary button is never disabled; `loading` blocks the press
 * without dimming it into a dead end, and an empty message is answered by the
 * schema rather than by a greyed-out control.
 */
export function FeedbackSheet({
  open,
  onClose,
  form,
  isSubmitting,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  form: UseFormReturn<FeedbackForm>
  isSubmitting: boolean
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const { control, formState } = form

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('feedback.dialog.title')}
      footer={
        <View className="gap-2">
          <Button onPress={onSubmit} loading={isSubmitting}>
            {t('feedback.dialog.submit')}
          </Button>
          <Button variant="secondary" onPress={onClose}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        <Text className="t-body-sm leading-5 text-ink2">
          {t('feedback.dialog.description')}
        </Text>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Segmented
              value={field.value}
              options={[
                { value: 'bug', label: t('feedback.type.bug') },
                { value: 'idea', label: t('feedback.type.idea') },
                { value: 'other', label: t('feedback.type.other') },
              ]}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="message"
          render={({ field }) => (
            <Field
              label={t('feedback.form.message')}
              placeholder={t('feedback.form.messagePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors.message?.message}
              multiline
              maxLength={FEEDBACK_MESSAGE_MAX}
              textAlignVertical="top"
              // `Field` is a fixed 46pt box by default; a report needs room to be
              // a paragraph.
              className="h-[132px] py-3"
              style={{ height: 132, paddingTop: 12 }}
            />
          )}
        />
      </View>
    </BottomSheet>
  )
}

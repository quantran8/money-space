import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { useFeedback } from '@money-space/core/features/feedback/hooks/use-feedback'

import { Button, Panel, PanelHeader } from '@/components/ui'
import { FeedbackSheet } from '@/features/settings/ui/feedback-sheet'

/**
 * Reporting something broken, from the hub.
 *
 * `secondary`, like sign-out: nothing here is destructive. No user agent is
 * passed — there is no browser — so the hook reports platform and app version
 * from `configureEnv`, which `bootstrap.ts` fills from `expo-constants`.
 */
export function FeedbackSection() {
  const { t } = useTranslation()
  const feedback = useFeedback()

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('feedback.card.title')}
          right={<Text className="t-caption text-ink3">{t('feedback.card.meta')}</Text>}
        />

        <Text className="mt-4 t-body-sm leading-5 text-ink2">
          {t('feedback.card.description')}
        </Text>

        <View className="mt-4 flex-row">
          <Button
            variant="secondary"
            className="px-4"
            onPress={() => feedback.setOpen(true)}
          >
            {t('feedback.card.action')}
          </Button>
        </View>
      </Panel>

      <FeedbackSheet
        open={feedback.open}
        onClose={() => feedback.handleOpenChange(false)}
        form={feedback.form}
        isSubmitting={feedback.isSubmitting}
        onSubmit={() => void feedback.submit()}
      />
    </>
  )
}

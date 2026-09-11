import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { FeedbackDialog } from '@/features/settings/ui/components/feedback-dialog'
import { useFeedback } from '@money-space/core/features/feedback/hooks/use-feedback'

/**
 * Reporting something that is broken, or saying what is missing.
 *
 * Shaped like `DataCard`, deliberately NOT like `DangerCard`: nothing here is
 * destructive, and borrowing the one bordered card's weight would overstate a
 * message box.
 *
 * The user agent is read here because core cannot touch `window` — it runs on
 * Hermes too — and handed to the hook, which owns the rest of the context.
 */
export function FeedbackCard() {
  const { t } = useTranslation()
  const feedback = useFeedback({
    userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
  })

  return (
    <>
      <Panel>
        <PanelHeader title={t('feedback.card.title')} meta={t('feedback.card.meta')} />

        <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <p className="max-w-[680px] t-body-sm leading-5 text-ink2">
            {t('feedback.card.description')}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() => feedback.setOpen(true)}
          >
            <MessageSquare className="size-4" strokeWidth={1.75} />
            {t('feedback.card.action')}
          </Button>
        </div>
      </Panel>

      <FeedbackDialog
        open={feedback.open}
        onOpenChange={feedback.handleOpenChange}
        form={feedback.form}
        isSubmitting={feedback.isSubmitting}
        onSubmit={() => void feedback.submit()}
      />
    </>
  )
}

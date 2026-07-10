import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'

type PaymentsHeaderProps = {
  embedded: boolean
  onCreate: () => void
}

export function PaymentsHeader({ embedded, onCreate }: PaymentsHeaderProps) {
  const { t } = useTranslation()

  if (embedded) {
    return (
      <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,hsla(var(--accent),0.06),hsla(var(--status-blue),0.02))] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('payments.header.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('payments.header.title')}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('payments.header.description')}
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" />
          {t('payments.form.submit')}
        </Button>
      </div>
    )
  }

  return (
    <PageHeader
      eyebrow={t('payments.header.eyebrow')}
      title={t('payments.header.title')}
      description={t('payments.header.description')}
      actions={
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" />
          {t('payments.form.submit')}
        </Button>
      }
    />
  )
}

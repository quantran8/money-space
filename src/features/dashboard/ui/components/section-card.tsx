import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

type SectionCardProps = {
  title: string
  subtitle: string
  to: string
  className?: string
  children: ReactNode
}

export function SectionCard({ title, subtitle, to, className, children }: SectionCardProps) {
  const { t } = useTranslation()

  return (
    <Card className={cn('flex h-full flex-col rounded-[28px] p-5 md:p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title text-lg font-semibold md:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center whitespace-nowrap text-sm font-semibold text-[hsl(var(--accent))]"
        >
          {t('common.view')}
          <ChevronRight className="ml-0.5 size-4" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="flex-1">{children}</div>
    </Card>
  )
}

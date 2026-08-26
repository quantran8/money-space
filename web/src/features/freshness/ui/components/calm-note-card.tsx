import { ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

/**
 * The calm-list card: an icon in a tinted disc beside a title and a soft
 * paragraph. Harvested from the deleted `payments-gentle-card.tsx` (Phase 5),
 * which hardcoded its copy; this takes the strings so the freshness sheet and
 * anything else can reuse the markup.
 */
export function CalmNoteCard({
  title,
  description,
  icon: Icon = ShieldCheck,
}: {
  title: string
  description: string
  icon?: LucideIcon
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-tint">
          <Icon className="size-5 text-action" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 t-body-sm leading-6 text-ink2">
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}

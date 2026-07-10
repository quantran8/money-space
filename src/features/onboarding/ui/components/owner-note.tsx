import { Check } from 'lucide-react'
import { Trans } from 'react-i18next'

/** Reassures the creator they'll be Owner + Admin after creating the household. */
export function OwnerNote() {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))]">
          <Check className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            <Trans i18nKey="onboarding.ownerNote.title" />
          </p>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            <Trans
              i18nKey="onboarding.ownerNote.description"
              components={{ b: <strong className="font-semibold text-[hsl(var(--foreground))]" /> }}
            />
          </p>
        </div>
      </div>
    </div>
  )
}

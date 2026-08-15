import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EventField, eventSelectTriggerClass } from '@/components/ui/event-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VISIBILITY_LEVELS } from '@/features/assets/model/asset-classification'
import type { AssetForm } from '@/features/assets/model/assets-form'
import { useMembers } from '@/features/members/hooks/use-members'

/**
 * Who is responsible for a money source, and how much of it the shared picture
 * shows. Extracted so the asset dialog and the onboarding "money sources" step
 * render **the same fields** rather than two drifting copies.
 *
 * Both fields default to something sensible and neither blocks a save, which is
 * why the dialog keeps them inside its collapsed disclosure. Promoting the
 * sharing level to the always-visible part of the form would turn every asset
 * entry into a disclosure decision — the opposite of the product's posture.
 */
export function AssetClassificationFields({ form }: { form: UseFormReturn<AssetForm> }) {
  const { t } = useTranslation()
  const { control } = form
  const { members } = useMembers()

  return (
    <>
      <Controller
        control={control}
        name="holderMemberId"
        render={({ field }) => (
          <EventField label={t('assets.form.holder')}>
            <Select value={field.value || 'none'} onValueChange={field.onChange}>
              <SelectTrigger className={eventSelectTriggerClass}>
                <SelectValue placeholder={t('assets.form.holderPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('assets.form.holderNone')}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EventField>
        )}
      />

      <Controller
        control={control}
        name="visibilityLevel"
        render={({ field }) => (
          <EventField label={t('assets.form.visibility')}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={eventSelectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {t(`options.visibilityLevel.${level}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/*
              The only copy that explains what the choice means for the other
              person. Both descriptions say the money is counted either way —
              that reassurance is the point, and it is what was missing while a
              level existed that quietly removed money from the shared picture.
            */}
            <p className="mt-1.5 text-[13px] leading-5 text-[hsl(var(--muted-foreground))]">
              {t(`options.visibilityLevelDescription.${field.value}`)}
            </p>
            {/*
              §22.12 is deliberately NOT repeated beside the save button (see
              the note in form-22.tsx) because it becomes noise once learned.
              This field is the exception: with no permission system left,
              "the change appears in the journal" is not a reminder, it IS the
              accountability mechanism that replaced the permission grant.
            */}
            <p className="mt-1 text-[13px] leading-5 text-[hsl(var(--muted-foreground))]">
              {t('assets.form.visibilityHint')}
            </p>
          </EventField>
        )}
      />
    </>
  )
}

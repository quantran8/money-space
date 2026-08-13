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
import {
  FINANCIAL_NATURES,
  MVP_VISIBILITY_LEVELS,
  isSelectableVisibility,
  requiresPrivacyOwner,
  type VisibilityLevel,
} from '@/features/assets/model/asset-classification'
import type { AssetForm } from '@/features/assets/model/assets-form'
import { useMembers } from '@/features/members/hooks/use-members'

/**
 * The §11/§30 classification field group, extracted so the asset dialog and the
 * onboarding "money sources" step render **the same fields** rather than two
 * drifting copies. This is the plan's biggest reuse win for Phase 11.
 */
export function AssetClassificationFields({ form }: { form: UseFormReturn<AssetForm> }) {
  const { t } = useTranslation()
  const { control, watch } = form
  const { members } = useMembers()

  const visibilityLevel = watch('visibilityLevel')

  // A record stored as `grouped` is valid but not offered in the MVP picker.
  // Show its label read-only rather than an empty Select.
  const showsReadOnlyVisibility = !isSelectableVisibility(visibilityLevel)

  return (
    <>
      <Controller
        control={control}
        name="financialNature"
        render={({ field }) => (
          <EventField label={t('assets.form.financialNature')}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={eventSelectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_NATURES.map((nature) => (
                  <SelectItem key={nature} value={nature}>
                    {t(`options.financialNature.${nature}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EventField>
        )}
      />

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
          <EventField label={t('assets.form.sharing')}>
            {showsReadOnlyVisibility ? (
              <p className="text-[17px] font-medium">
                {t(`options.sharing.${field.value as VisibilityLevel}`)}
              </p>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={eventSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MVP_VISIBILITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {t(`options.sharing.${level}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </EventField>
        )}
      />

      {requiresPrivacyOwner(visibilityLevel) ? (
        <Controller
          control={control}
          name="privacyOwnerMemberId"
          render={({ field, fieldState }) => (
            <EventField
              label={t('assets.form.privacyOwner')}
              error={fieldState.error?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={eventSelectTriggerClass}>
                  <SelectValue placeholder={t('assets.form.privacyOwnerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
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
      ) : null}
    </>
  )
}

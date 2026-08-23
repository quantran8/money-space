import { Controller } from 'react-hook-form'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { Settings } from '@money-space/core/features/settings/model/settings-form'

import { Button, Label, Panel, Select } from '@/components/ui'

import type { UseFormReturn } from 'react-hook-form'

/**
 * The household's own card: what it is called, and the two settings that
 * change how every number in the app reads.
 *
 * Only currency and language are here. The web's card carries the same two and
 * no more, for a reason that is worth restating: `updateHouseholdConfig`
 * PATCHes `currency` alone, so a control for anything else would be a control
 * that silently discards what the household chose — the worst possible bug in
 * a product whose proposition is "you decide". Language is client-side and
 * takes effect immediately.
 *
 * Save is a button in this panel rather than beside the screen title. On the
 * web it sits level with the title because it commits two selects buried in a
 * card of five; on a phone the panel IS the screen's first fold, so the button
 * is already where the eye is, and a header action would compete with the
 * screen title for a 375pt row.
 */
export function HouseholdIdentitySection({
  form,
  householdName,
  isSaving,
  onSave,
}: {
  form: UseFormReturn<Settings>
  /** The stored name — this card reads it, `useSettingsPage` does not write it. */
  householdName: string
  isSaving: boolean
  onSave: () => void
}) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <Panel>
      <Label>{t('household.merged.householdName')}</Label>
      <Text className="mt-1.5 text-[26px] font-medium text-ink" style={{ letterSpacing: -0.78 }}>
        {householdName}
      </Text>

      {/* ── SEAM: freshness ────────────────────────────────────────────────
          The web's card opens with a dot saying whether every source is still
          current. That belongs to the freshness port (`useFreshness` in core),
          which owns `src/features/freshness/` — dropping a second rendering of
          it here would give the household two places telling it the same
          thing, and they would disagree the moment one is updated. */}

      <View className="mt-6 gap-3">
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              label={t('settings.household.currency')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('settings.household.currencyPlaceholder')}
              options={[
                { value: 'VND' as const, label: t('options.currency.VND') },
                { value: 'USD' as const, label: t('options.currency.USD') },
                { value: 'EUR' as const, label: t('options.currency.EUR') },
              ]}
            />
          )}
        />

        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Select
              label={t('settings.household.language')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('settings.household.languagePlaceholder')}
              options={[
                { value: 'vi' as const, label: t('options.language.vi') },
                { value: 'en' as const, label: t('options.language.en') },
              ]}
            />
          )}
        />
      </View>

      {/* §22.10: never disabled. `loading` blocks a second press without
          dimming the control into a dead end that explains nothing. */}
      <Button className="mt-4" loading={isSaving} onPress={onSave}>
        {t('settings.header.save')}
      </Button>
    </Panel>
  )
}

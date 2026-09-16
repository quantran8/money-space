import { Controller } from 'react-hook-form'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { ReactNode } from 'react'

import type { Settings } from '@money-space/core/features/settings/model/settings-form'

import { Button, Field, Panel, PanelHeader, Select } from '@/components/ui'
import { PlanPill } from '@/features/billing/ui/plan-pill'

import type { UseFormReturn } from 'react-hook-form'

/**
 * The household's own card: what it is called, and the two settings that
 * change how every number in the app reads.
 *
 * The name is a real field. It was read-only for as long as the backend had no
 * endpoint to change it — a control that silently discarded what the household
 * chose would be the worst possible bug in a product whose proposition is "you
 * decide". `updateHouseholdConfig` now takes a payload and validates each field
 * only when present, so the name can be edited here (60 characters, the same
 * limit the backend enforces).
 *
 * Currency is stored with it; language is client-side and takes effect
 * immediately.
 *
 * Save is a button in this panel rather than beside the screen title. On the
 * web it sits level with the title because it commits two selects buried in a
 * card of five; on a phone the panel IS the screen's first fold, so the button
 * is already where the eye is, and a header action would compete with the
 * screen title for a 375pt row.
 */
export function HouseholdIdentitySection({
  form,
  isSaving,
  onSave,
  memberCount,
  sourceCount,
  children,
}: {
  form: UseFormReturn<Settings>
  isSaving: boolean
  onSave: () => void
  memberCount: number
  sourceCount: number
  /** The members list, which shares this card under a divider. */
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const {
    control,
    formState: { errors },
  } = form

  return (
    <Panel>
      {/* The space's own title, and beside it what plan it is on — the pill is
          the hub's only door to the paywall (§2.1: one thing on the right). */}
      <PanelHeader title={t('settings.household.spaceTitle')} right={<PlanPill />} />

      <Controller
        control={control}
        name="householdName"
        render={({ field }) => (
          <Field
            className="mt-6"
            label={t('household.merged.householdName')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.householdName?.message}
            maxLength={60}
          />
        )}
      />

      {/* ── SEAM: freshness ────────────────────────────────────────────────
          The web's card opens with a dot saying whether every source is still
          current. That belongs to the freshness port (`useFreshness` in core),
          which owns `src/features/freshness/` — dropping a second rendering of
          it here would give the household two places telling it the same
          thing, and they would disagree the moment one is updated. */}

      {/* What this space IS, in one line, under the name it belongs to. */}
      <Text className="mt-2 t-caption text-ink3">
        {`${t('members.list.count', { count: memberCount })} · ${t('members.list.holdsSources', {
          count: sourceCount,
        })}`}
      </Text>

      {/* §22.10: never disabled. `loading` blocks a second press without
          dimming the control into a dead end that explains nothing. */}
      <Button className="mt-4 self-start px-4" loading={isSaving} onPress={onSave}>
        {t('settings.header.save')}
      </Button>

      {/* Members belong to the SPACE, so they share its card — separated by a
          rule rather than by a second panel, which would read as a second
          subject. */}
      <View className="my-6 h-px bg-divider" />

      {children}
    </Panel>
  )
}

/**
 * Currency and language — their own card, as on the web.
 *
 * They are not the space's identity: they change how every number in the app
 * reads, which is a different question from "what is this space and who is in
 * it". Folding them into the space card made one card answer two things.
 */
export function OtherSettingsSection({
  form,
  isSaving,
  onSave,
}: {
  form: UseFormReturn<Settings>
  isSaving: boolean
  onSave: () => void
}) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <Panel>
      <PanelHeader title={t('settings.other.title')} />

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

      <Button className="mt-4 self-start px-4" loading={isSaving} onPress={onSave}>
        {t('settings.header.save')}
      </Button>
    </Panel>
  )
}

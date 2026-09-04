import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Settings } from '@money-space/core/features/settings/model/settings-form'

type HouseholdOverviewCardProps = {
  form: UseFormReturn<Settings>
}

/**
 * The space itself: what it is called, and the two choices that apply to
 * everything inside it. Saving lives beside the page title — see `SettingsPage`.
 *
 * The name is not a heading with a field under it — it IS the field. Showing it
 * twice made the panel restate one fact in two places and needed a label to
 * tell them apart; one control at heading size says the same thing once.
 *
 * It also does not wear the standard field chrome. §22.3 asks an input to
 * separate itself from the panel it sits on, and every other field in the app
 * obeys that — but a heading in a box reads as a form row, which is the one
 * thing this is not. The affordance moves to the states instead: a wash band on
 * hover, and the full field treatment on focus, so while it is being edited it
 * looks exactly like every other input.
 *
 * `-mx-3` on the wrapper is what keeps the title FLUSH with the panel's other
 * content while its hover band bleeds 12px past it — padding alone would indent
 * the title from the heading above it.
 *
 * Written as a plain `<input>` rather than the `Input` primitive because that
 * one hard-codes `t-body-sm`, and `cn` is twMerge — which does not know the
 * custom `t-*` classes, so both steps would survive into the DOM and CSS source
 * order would silently decide the size (the bug `button.tsx` documents).
 */
export function HouseholdOverviewCard({ form }: HouseholdOverviewCardProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors },
  } = form

  return (
    <Panel>
      <PanelHeader title={t('settings.household.spaceTitle')} />

      <div className="s-head-body -mx-3">
        <input
          id="settings-name"
          aria-label={t('settings.household.name')}
          aria-invalid={Boolean(errors.householdName)}
          className="w-full rounded-control border border-transparent bg-transparent px-3 py-1.5 t-title text-ink outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-ink3 hover:bg-canvas focus-visible:border-data-primary focus-visible:bg-card focus-visible:shadow-[0_0_0_3px_rgba(115,164,215,0.16)] aria-[invalid=true]:border-alert-ink"
          {...register('householdName')}
        />
        {errors.householdName?.message ? (
          <p className="mt-2 px-3 t-caption text-alert-ink">{errors.householdName.message}</p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={t('settings.household.currency')} htmlFor="settings-currency">
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="settings-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">{t('options.currency.VND')}</SelectItem>
                  <SelectItem value="USD">{t('options.currency.USD')}</SelectItem>
                  <SelectItem value="EUR">{t('options.currency.EUR')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={t('settings.household.language')} htmlFor="settings-language">
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="settings-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">{t('options.language.vi')}</SelectItem>
                  <SelectItem value="en">{t('options.language.en')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
    </Panel>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block t-caption font-medium text-ink2">
        {label}
      </label>
      {children}
    </div>
  )
}

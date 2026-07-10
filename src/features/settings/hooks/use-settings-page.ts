import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useMembers } from '@/features/members/hooks/use-members'
import {
  buildSettingsSchema,
  isCurrency,
  isFrequency,
  type Settings,
} from '@/features/settings/model/settings-form'

export function useSettingsPage() {
  const { i18n, t } = useTranslation()
  const { household } = useMembers()
  const safeHousehold = household ?? {
    name: '',
    currency: 'VND',
    updateFrequency: 'weekly',
    createdAt: '',
  }

  const settingsSchema = useMemo(() => buildSettingsSchema(t), [t])

  const initialSettings: Settings = {
    householdName: safeHousehold.name,
    currency: isCurrency(safeHousehold.currency) ? safeHousehold.currency : 'VND',
    updateFrequency: isFrequency(safeHousehold.updateFrequency) ? safeHousehold.updateFrequency : 'weekly',
    language: i18n.resolvedLanguage === 'en' ? 'en' : 'vi',
    reminderPayments: true,
    reminderUpdate: true,
    shareAssets: 'grouped',
    shareUpcoming: 'detailed',
    hidePrivateNotes: true,
  }

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
    mode: 'onChange',
  })

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = form

  function handleSave(values: Settings) {
    void i18n.changeLanguage(values.language)
    // Re-baseline the form so it reflects the saved state.
    reset(values)
    toast.success(t('settings.header.saved'))
  }

  const shareAssets = watch('shareAssets')
  const updateFrequency = watch('updateFrequency')

  return {
    // data
    safeHousehold,
    shareAssets,
    updateFrequency,
    // form
    form,
    isValid,
    submit: handleSubmit(handleSave),
  }
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useMembers } from '@/features/members/hooks/use-members'
import { updateHouseholdConfig } from '@/features/settings/api/settings.repository'
import {
  buildSettingsSchema,
  isCurrency,
  isFrequency,
  type Settings,
} from '@/features/settings/model/settings-form'
import { queryKeys } from '@/shared/api/query-keys'
import { getDisplayCurrency, setDisplayCurrency } from '@/shared/lib/format-money'

export function useSettingsPage() {
  const { i18n, t } = useTranslation()
  const queryClient = useQueryClient()
  const { household, activeHouseholdId, isLoading } = useMembers()
  const updateConfig = useMutation({
    mutationFn: (currency: Settings['currency']) =>
      updateHouseholdConfig(activeHouseholdId!, currency),
  })
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
    reminderAccess: false,
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
    formState: { isValid },
  } = form

  async function handleSave(values: Settings) {
    if (!activeHouseholdId) return
    const previousCurrency = getDisplayCurrency()
    const previousLanguage: Settings['language'] = i18n.resolvedLanguage === 'en' ? 'en' : 'vi'

    // Optimistic UX: reflect the choice and notify immediately. The server
    // request continues in the background; failures restore the prior state.
    setDisplayCurrency(values.currency)
    await i18n.changeLanguage(values.language)
    reset(values)
    toast.success(t('settings.header.saved'))

    try {
      await updateConfig.mutateAsync(values.currency)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.households }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members(activeHouseholdId) }),
      ])
    } catch {
      setDisplayCurrency(previousCurrency)
      await i18n.changeLanguage(previousLanguage)
      reset({
        ...values,
        currency: previousCurrency,
        language: previousLanguage,
      })
      toast.error('Không thể lưu cài đặt.')
    }
  }

  return {
    // data
    isLoading,
    // form
    form,
    isValid,
    isSaving: updateConfig.isPending,
    submit: handleSubmit(handleSave),
  }
}

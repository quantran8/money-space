import { useState, type ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/ui/number-input'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useFlexibleMoney } from '@/features/forecast/hooks/use-forecast'
import { useReserves } from '@/features/reserves/hooks/use-reserves'
import type { Settings } from '@/features/settings/model/settings-form'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { parseRawMoney } from '@/shared/lib/number-format'
import { cn } from '@/shared/lib/utils'

type HouseholdReserveCardProps = {
  form: UseFormReturn<Settings>
}

export function HouseholdReserveCard({ form }: HouseholdReserveCardProps) {
  const { t, i18n } = useTranslation()
  const { emergencyFund, hasEmergencyFund, isLoading, setEmergencyFund } = useReserves()
  const { flexibleMoney } = useFlexibleMoney()
  const { control } = form
  // The field shows the stored floor until the user types, so it reads as "what
  // is in force" rather than an empty box next to a live number. Derived rather
  // than seeded through an effect: clearing the draft after a save re-syncs it
  // to whatever the server now holds.
  const [draft, setDraft] = useState<string | null>(null)
  const amount = draft ?? (hasEmergencyFund ? String(emergencyFund) : '')
  const amountValue = parseRawMoney(amount)
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const dateLabel = new Date().toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const canSave =
    Number.isFinite(amountValue) && amountValue >= 0 && amountValue !== emergencyFund

  /**
   * A floor above the money that is actually spendable almost always means the
   * fund is already sitting in savings — which the forecast excludes from liquid
   * money anyway, so declaring it here subtracts it a second time.
   */
  const liquid = flexibleMoney?.currentSharedLiquidMoney
  const exceedsLiquid =
    hasEmergencyFund && liquid !== undefined && emergencyFund > liquid

  async function handleSave() {
    if (!canSave) return
    try {
      await setEmergencyFund.mutateAsync(amountValue)
      setDraft(null)
    } catch (error) {
      toast.error(getErrorMessage(error, t('reserve.saveFailed')))
    }
  }

  return (
    <Panel>
      <PanelHeader title={t('household.merged.reserveCadence')} meta={dateLabel} />
      <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-x-14">
        <div>
          <p className="label">{t('household.merged.safetyFund')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <MoneyInput
              value={amount}
              onChange={setDraft}
              placeholder="0"
              aria-label={t('reserve.form.amount')}
              className="h-11 text-[20px]"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!canSave || setEmergencyFund.isPending}
            >
              {t('reserve.form.save')}
            </Button>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-ink2">
            {t('household.merged.safetyFundDescription')}
          </p>

          {!isLoading && !hasEmergencyFund ? (
            <p className="mt-2 text-[12px] leading-5 text-ink3">{t('reserve.empty')}</p>
          ) : null}

          {exceedsLiquid ? (
            <p className="mt-3 rounded-sunk bg-sunk px-3 py-2 text-[12px] leading-5 text-ink2">
              {t('reserve.overLiquid')}
            </p>
          ) : null}
        </div>

        <div>
          <p className="label">{t('household.merged.updateCadence')}</p>
          <Controller
            control={control}
            name="updateFrequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-2 h-auto w-fit min-w-40 bg-transparent p-0 text-[17px] font-medium focus-visible:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('options.frequency.weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('options.frequency.biweekly')}</SelectItem>
                  <SelectItem value="monthly">{t('options.frequency.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <p className="mt-2 text-[12px] leading-5 text-ink2">
            {t('household.merged.cadenceDescription')}
          </p>

          <ReminderToggle
            className="mt-5"
            title={t('settings.reminders.updatesTitle')}
            description={t('settings.reminders.updatesDescription')}
          >
            <Controller
              control={control}
              name="reminderUpdate"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </ReminderToggle>

          <details className="mt-2 rounded-sunk bg-sunk px-4 py-3">
            <summary className="cursor-pointer list-none text-[12px] font-medium text-ink2">
              {t('household.merged.otherReminders')}
            </summary>
            <div className="mt-3 space-y-3">
              <ReminderToggle
                title={t('settings.reminders.upcomingTitle')}
                description={t('settings.reminders.upcomingDescription')}
              >
                <Controller
                  control={control}
                  name="reminderPayments"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </ReminderToggle>
              {/*
                The "access changed" reminder is gone with the permission model
                it reported on. Nothing grants or revokes access any more, and
                the sharing level of a record is reported by the journal, not by
                a reminder toggle that never persisted.
              */}
            </div>
          </details>
        </div>
      </div>
    </Panel>
  )
}

function ReminderToggle({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('sunk flex items-center justify-between gap-4 p-4', className)}>
      <div>
        <p className="text-[12px] font-medium">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-ink3">{description}</p>
      </div>
      {children}
    </div>
  )
}

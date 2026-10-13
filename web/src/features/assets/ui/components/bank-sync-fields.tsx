import { useState } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Segmented, TextField } from '@/components/ui/form-22'
import { Switch } from '@/components/ui/switch'
import type { AssetForm } from '@money-space/core/features/assets/model/assets-form'
import { usePremiumAction } from '@money-space/core/features/billing/hooks/use-premium-action'
import { useBankDevices } from '@money-space/core/features/bank-sync/hooks/use-bank-devices'
import { normalizeAccountNumber } from '@money-space/core/features/bank-sync/model/bank-sync.schemas'
import {
  BANK_PROVIDERS,
  type BankProviderCode,
} from '@money-space/core/features/bank-sync/model/bank-sync.types'

/** Create-only: link a new bank account to its real account. See memory/bank-sync.md. */
export function BankSyncFields({ form }: { form: UseFormReturn<AssetForm> }) {
  const { t } = useTranslation()
  const { check } = usePremiumAction()
  const {
    control,
    register,
    formState: { errors },
  } = form
  const enabled = useWatch({ control, name: 'bankSyncEnabled' })
  const accountNumber = useWatch({ control, name: 'bankAccountNumber' })
  const name = useWatch({ control, name: 'name' })
  const [confirmAuto, setConfirmAuto] = useState(false)

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="bankSyncEnabled"
        render={({ field }) => (
          <SwitchRow
            id="asset-bank-sync"
            label={t('assets.form.bankSync.toggle')}
            hint={t('assets.form.bankSync.toggleHint')}
            checked={field.value}
            onCheckedChange={(on) => {
              if (on && !check({ reason: 'bank_sync' })) return
              field.onChange(on)
            }}
          />
        )}
      />

      {enabled ? (
        <>
          <Field
            label={t('bankSync.sources.form.provider')}
            error={errors.bankProviderCode?.message}
          >
            <Controller
              control={control}
              name="bankProviderCode"
              render={({ field }) => (
                <Segmented
                  value={field.value as BankProviderCode}
                  onChange={field.onChange}
                  options={BANK_PROVIDERS.map((p) => ({
                    value: p,
                    label: t(`bankSync.providers.${p}`),
                  }))}
                />
              )}
            />
          </Field>
          <TextField
            id="asset-bank-account"
            label={t('bankSync.sources.form.account')}
            inputMode="numeric"
            autoComplete="off"
            className="num"
            error={errors.bankAccountNumber?.message}
            {...register('bankAccountNumber')}
          />
          <Controller
            control={control}
            name="bankAutoPost"
            render={({ field }) => (
              <SwitchRow
                id="asset-bank-auto"
                label={t('bankSync.sources.autoLabel')}
                hint={t('bankSync.sources.autoHint')}
                checked={field.value}
                onCheckedChange={(on) => (on ? setConfirmAuto(true) : field.onChange(false))}
              />
            )}
          />
          <BankSyncNote />
          <ConfirmDialog
            open={confirmAuto}
            onOpenChange={setConfirmAuto}
            title={t('bankSync.sources.autoConfirmTitle', {
              last4: normalizeAccountNumber(accountNumber ?? '')?.slice(-4) ?? '••••',
            })}
            description={t('bankSync.sources.autoConfirmDescription', {
              wallet: name?.trim() || t('options.assetType.bank_account'),
            })}
            confirmLabel={t('bankSync.sources.autoConfirm')}
            destructive={false}
            onConfirm={() => {
              form.setValue('bankAutoPost', true, { shouldDirty: true })
              setConfirmAuto(false)
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (on: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="t-body-sm leading-[1.4] text-ink2">
          {label}
        </label>
        <p className="mt-1 t-caption leading-[1.45] text-ink3">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function BankSyncNote() {
  const { t } = useTranslation()
  const { devices, isLoading } = useBankDevices()
  const hasDevice = devices.some((d) => d.status === 'ACTIVE')
  if (isLoading || hasDevice) return null

  return (
    <p className="t-caption leading-[1.45] text-ink3">
      {t('assets.form.bankSync.noDevice')}{' '}
          {/* New tab, so what was typed in this dialog survives. */}
          <Link
            to="/settings/bank-sync"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-action hover:underline"
          >
        {t('assets.form.bankSync.setupDevice')}
      </Link>
    </p>
  )
}

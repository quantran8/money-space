import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Plus, Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import { useBankDevices } from '@money-space/core/features/bank-sync/hooks/use-bank-devices'
import { bankIngestUrl } from '@money-space/core/features/bank-sync/model/bank-sync'
import {
  buildDeviceSchema,
  type DeviceFormValues,
} from '@money-space/core/features/bank-sync/model/bank-sync.schemas'
import type { BankCredential } from '@money-space/core/features/bank-sync/model/bank-sync.types'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export function DevicesPanel() {
  const { t } = useTranslation()
  const devices = useBankDevices()
  const [addOpen, setAddOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<BankCredential | null>(null)
  const schema = useMemo(() => buildDeviceSchema(t), [t])
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deviceLabel: '' },
  })

  const submit = form.handleSubmit(async (values) => {
    const result = await devices.create(values.deviceLabel)
    if (result) {
      setAddOpen(false)
      form.reset()
    }
  })

  return (
    <Panel>
      <PanelHeader
        title={t('bankSync.devices.title')}
        meta={t('bankSync.devices.meta')}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            {t('bankSync.devices.add')}
          </Button>
        }
      />
      <p className="s-head-body max-w-[680px] t-body-sm leading-5 text-ink2">
        {t('bankSync.devices.description')}
      </p>

      {devices.isLoading ? (
        <Skeleton className="mt-4 h-12 w-full" />
      ) : devices.devices.length === 0 ? (
        <EmptyState icon={Smartphone}>{t('bankSync.devices.empty')}</EmptyState>
      ) : (
        <ul className="mt-4 divide-y divide-divider">
          {devices.devices.map((device) => (
            <li key={device.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate t-body-sm font-medium text-ink">{device.deviceLabel}</p>
                <p className="num t-caption text-ink3">
                  {device.tokenPrefix}… ·{' '}
                  {device.lastUsedAt
                    ? t('bankSync.devices.lastUsed', { time: formatDateTime(device.lastUsedAt) })
                    : t('bankSync.devices.neverUsed')}
                </p>
              </div>
              {device.status === 'ACTIVE' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevokeTarget(device)}
                >
                  {t('bankSync.devices.revoke')}
                </Button>
              ) : (
                <StatusChip>{t('bankSync.devices.status.REVOKED')}</StatusChip>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[480px] gap-0 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('bankSync.devices.form.title')}</DialogTitle>
          </DialogHeader>
          <form className="mt-5" onSubmit={(e) => void submit(e)}>
            <FormField
              label={t('bankSync.devices.form.label')}
              error={form.formState.errors.deviceLabel?.message}
            >
              <Input
                {...form.register('deviceLabel')}
                placeholder={t('bankSync.devices.form.labelPlaceholder')}
                maxLength={60}
                autoComplete="off"
                autoFocus
              />
            </FormField>
            <DialogFooter className="-mx-6 mt-5 px-6 py-3">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={devices.isCreating}>
                {t('bankSync.devices.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shown once; closing it drops the raw token from memory. */}
      <Dialog open={devices.created !== null} onOpenChange={(open) => !open && devices.clearCreated()}>
        <DialogContent className="max-w-[560px] gap-0 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('bankSync.devices.token.title')}</DialogTitle>
            <DialogDescription className="mt-1 leading-6">
              {t('bankSync.devices.token.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex items-center gap-2 rounded-control bg-wash p-3">
            <code className="min-w-0 flex-1 break-all t-caption text-ink">
              {devices.created?.token}
            </code>
            <Button type="button" variant="secondary" size="sm" onClick={() => void devices.copyToken()}>
              <Copy className="size-4" strokeWidth={1.75} />
              {t('bankSync.devices.token.copy')}
            </Button>
          </div>
          <p className="label mt-6 mb-2">{t('bankSync.devices.token.stepsTitle')}</p>
          <ol className="list-decimal space-y-2 pl-5 t-body-sm leading-5 text-ink2">
            <li>{t('bankSync.devices.token.step1')}</li>
            <li>{t('bankSync.devices.token.step2')}</li>
            <li className="break-all">{t('bankSync.devices.token.step3', { url: bankIngestUrl() })}</li>
            <li>{t('bankSync.devices.token.step4')}</li>
            <li>{t('bankSync.devices.token.step5')}</li>
          </ol>
          <DialogFooter className="-mx-6 mt-5 px-6 py-3">
            <Button type="button" onClick={devices.clearCreated}>
              {t('bankSync.devices.token.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title={t('bankSync.devices.revokeTitle', { name: revokeTarget?.deviceLabel ?? '' })}
        description={t('bankSync.devices.revokeDescription')}
        confirmLabel={t('bankSync.devices.revoke')}
        confirmDisabled={devices.isRevoking}
        onConfirm={async () => {
          if (!revokeTarget) return
          await devices.revoke(revokeTarget.id)
          setRevokeTarget(null)
        }}
      />
    </Panel>
  )
}

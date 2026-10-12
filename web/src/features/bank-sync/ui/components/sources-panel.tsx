import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import { Switch } from '@/components/ui/switch'
import { useBankSources } from '@money-space/core/features/bank-sync/hooks/use-bank-sources'
import {
  buildSourceSchema,
  type SourceFormValues,
} from '@money-space/core/features/bank-sync/model/bank-sync.schemas'
import {
  BANK_PROVIDERS,
  type BankSource,
} from '@money-space/core/features/bank-sync/model/bank-sync.types'

type WalletOption = { value: string; label: string }

function WalletSelect({
  value,
  onChange,
  options,
  id,
}: {
  value: string | undefined
  onChange: (value: string) => void
  options: WalletOption[]
  id?: string
}) {
  const { t } = useTranslation()
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={t('bankSync.inbox.detail.walletPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SourcesPanel({
  addOpen,
  onAddOpenChange,
}: {
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const sources = useBankSources()
  const [autoTarget, setAutoTarget] = useState<BankSource | null>(null)
  const [unlinkTarget, setUnlinkTarget] = useState<BankSource | null>(null)
  const schema = useMemo(() => buildSourceSchema(t), [t])
  const form = useForm<SourceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { providerCode: '', accountNumber: '', displayLabel: '', assetId: '' },
  })

  const submit = form.handleSubmit(async (values) => {
    const result = await sources.add(values)
    if (result) {
      onAddOpenChange(false)
      form.reset()
    }
  })

  const toggleAuto = (source: BankSource, on: boolean) => {
    if (!source.link) return
    if (on) setAutoTarget(source)
    else void sources.setLink(source, source.link.assetId, 'REVIEW')
  }

  return (
    <Panel>
      <PanelHeader
        title={t('bankSync.sources.title')}
        meta={t('bankSync.sources.meta')}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={() => onAddOpenChange(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            {t('bankSync.sources.add')}
          </Button>
        }
      />
      <p className="s-head-body max-w-[680px] t-body-sm leading-5 text-ink2">
        {t('bankSync.sources.description')}
      </p>

      {sources.isLoading ? (
        <Skeleton className="mt-4 h-16 w-full" />
      ) : sources.sources.length === 0 ? (
        <EmptyState icon={Landmark}>{t('bankSync.sources.empty')}</EmptyState>
      ) : (
        <ul className="mt-4 divide-y divide-divider">
          {sources.sources.map((source) => (
            <li key={source.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="truncate t-body-sm font-medium text-ink">
                  {t(`bankSync.providers.${source.providerCode}`)} ·{' '}
                  <span className="num">
                    {t('bankSync.sources.account', { last4: source.last4 ?? '????' })}
                  </span>
                  {source.displayLabel ? ` · ${source.displayLabel}` : ''}
                </p>
                {source.status === 'DISABLED' ? (
                  <StatusChip className="mt-1">{t('bankSync.sources.disabled')}</StatusChip>
                ) : source.link ? (
                  <p className="mt-1 t-caption text-ink3">
                    {t('bankSync.sources.wallet')}: {source.link.assetName}
                  </p>
                ) : (
                  <StatusChip tone="attention" className="mt-1">
                    {t('bankSync.sources.notLinked')}
                  </StatusChip>
                )}
                <div className="mt-3 max-w-xs">
                  <WalletSelect
                    value={source.link?.assetId}
                    options={sources.walletOptions}
                    onChange={(assetId) =>
                      void sources.setLink(source, assetId, source.link?.postingMode ?? 'REVIEW')
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <label className="flex items-center gap-2 t-body-sm text-ink">
                  <Switch
                    checked={source.link?.postingMode === 'AUTO'}
                    disabled={!source.link || source.status !== 'ACTIVE' || sources.isLinking}
                    onCheckedChange={(on) => toggleAuto(source, on)}
                  />
                  {t('bankSync.sources.autoLabel')}
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void sources.setStatus(
                        source.id,
                        source.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                      )
                    }
                  >
                    {source.status === 'ACTIVE'
                      ? t('bankSync.sources.pause')
                      : t('bankSync.sources.resume')}
                  </Button>
                  {source.link ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnlinkTarget(source)}
                    >
                      {t('bankSync.sources.unlink')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 t-caption text-ink3">{t('bankSync.sources.autoHint')}</p>

      <Dialog open={addOpen} onOpenChange={onAddOpenChange}>
        <DialogContent className="max-w-[520px] gap-0 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('bankSync.sources.form.title')}</DialogTitle>
            <DialogDescription className="mt-1 leading-6">
              {t('bankSync.sources.form.reviewNote')}
            </DialogDescription>
          </DialogHeader>
          <form className="mt-5 grid gap-4" onSubmit={(e) => void submit(e)}>
            <FormField
              label={t('bankSync.sources.form.provider')}
              error={form.formState.errors.providerCode?.message}
            >
              <Controller
                control={form.control}
                name="providerCode"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('bankSync.sources.form.providerRequired')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(`bankSync.providers.${p}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              label={t('bankSync.sources.form.account')}
              error={form.formState.errors.accountNumber?.message}
            >
              <Input
                {...form.register('accountNumber')}
                inputMode="numeric"
                autoComplete="off"
                className="num"
              />
            </FormField>
            <p className="-mt-2 t-caption text-ink3">{t('bankSync.sources.form.accountHint')}</p>
            <FormField
              label={t('bankSync.sources.form.label')}
              error={form.formState.errors.displayLabel?.message}
            >
              <Input
                {...form.register('displayLabel')}
                placeholder={t('bankSync.sources.form.labelPlaceholder')}
                maxLength={60}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={t('bankSync.sources.form.wallet')}
              error={form.formState.errors.assetId?.message}
            >
              {sources.walletOptions.length === 0 ? (
                <p className="t-body-sm text-ink2">{t('bankSync.sources.form.walletEmpty')}</p>
              ) : (
                <Controller
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <WalletSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={sources.walletOptions}
                    />
                  )}
                />
              )}
            </FormField>
            <DialogFooter className="-mx-6 mt-2 px-6 py-3">
              <Button type="button" variant="secondary" onClick={() => onAddOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={sources.isAdding}>
                {t('bankSync.sources.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={autoTarget !== null}
        onOpenChange={(open) => !open && setAutoTarget(null)}
        title={t('bankSync.sources.autoConfirmTitle', { last4: autoTarget?.last4 ?? '' })}
        description={t('bankSync.sources.autoConfirmDescription', {
          wallet: autoTarget?.link?.assetName ?? '',
        })}
        confirmLabel={t('bankSync.sources.autoConfirm')}
        destructive={false}
        confirmDisabled={sources.isLinking}
        onConfirm={async () => {
          if (!autoTarget?.link) return
          await sources.setLink(autoTarget, autoTarget.link.assetId, 'AUTO')
          setAutoTarget(null)
        }}
      />

      <ConfirmDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
        title={t('bankSync.sources.unlinkTitle', { last4: unlinkTarget?.last4 ?? '' })}
        description={t('bankSync.sources.unlinkDescription')}
        confirmLabel={t('bankSync.sources.unlink')}
        onConfirm={async () => {
          if (!unlinkTarget) return
          await sources.unlink(unlinkTarget.id)
          setUnlinkTarget(null)
        }}
      />
    </Panel>
  )
}

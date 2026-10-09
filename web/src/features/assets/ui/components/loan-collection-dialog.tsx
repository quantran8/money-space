import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Field,
  MoneyField,
  TextareaField,
  fieldControlReset,
  fieldShell,
} from '@/components/ui/form-22'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { useLoanCollection } from '@money-space/core/features/assets/hooks/use-loan-collection'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

type LoanCollectionDialogProps = {
  flow: ReturnType<typeof useLoanCollection>
}

/** Record that a loan_receivable was repaid in full into a wallet. */
export function LoanCollectionDialog({ flow }: LoanCollectionDialogProps) {
  const { t } = useTranslation()

  return (
    <ResponsiveDialog open={flow.open} onOpenChange={flow.setOpen}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void flow.submit()
          }}
        >
          <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8">
            <ResponsiveDialogTitle className="t-subhead">
              {t('assets.loanCollection.title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="t-body-sm text-ink2">
              {t('assets.loanCollection.description', { name: flow.loan?.name ?? '' })}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 px-6 py-5 sm:px-8">
            <MoneyField
              id="loan-collection-amount"
              label={t('assets.loanCollection.amount')}
              value={flow.amount}
              onChange={flow.setAmount}
            />

            <Field label={t('assets.loanCollection.wallet')}>
              <div className={fieldShell}>
                <Select value={flow.walletId} onValueChange={flow.setWalletId}>
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('assets.loanCollection.walletPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {flow.walletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.balance === undefined
                          ? option.label
                          : `${option.label} · ${formatMoney(option.balance)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Field label={t('assets.loanCollection.date')}>
              <div className={fieldShell}>
                <DatePicker
                  value={flow.date}
                  onChange={flow.setDate}
                  className={fieldControlReset}
                />
              </div>
            </Field>

            <TextareaField
              id="loan-collection-note"
              label={t('assets.loanCollection.note')}
              rows={2}
              value={flow.note}
              onChange={(event) => flow.setNote(event.target.value)}
            />
          </div>

          <ResponsiveDialogFooter fullBleed className="px-6 py-3 sm:px-8">
            <Button
              type="button"
              variant="secondary"
              className="rounded-control"
              onClick={() => flow.setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!flow.canSubmit || flow.isSubmitting}>
              {flow.isSubmitting
                ? t('assets.loanCollection.submitting')
                : t('assets.loanCollection.confirm')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

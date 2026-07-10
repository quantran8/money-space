import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  confirmLoadingLabel?: string
  cancelLabel?: string
  /** Style the confirm button as a destructive action. Defaults to true. */
  destructive?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * A small always-modal confirmation dialog. Used for destructive actions
 * (delete / remove) which must always be confirmed. Renders as a centered
 * dialog on every viewport since the content is short.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmLoadingLabel,
  cancelLabel,
  destructive = true,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const [isConfirming, setIsConfirming] = React.useState(false)

  async function handleConfirm() {
    try {
      setIsConfirming(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={confirmDisabled || isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming
              ? (confirmLoadingLabel ?? confirmLabel ?? t('common.delete'))
              : (confirmLabel ?? t('common.delete'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

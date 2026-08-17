import { Copy, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { QrCode } from '@/components/ui/qr-code'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { HouseholdInvite } from '@/features/invites/model/invites.types'

type InviteQrDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdName?: string | null
  invite: HouseholdInvite | null
  joinUrl: string | null
  isPreparing: boolean
  error: string | null
  isRenewing: boolean
  onRenew: () => void
  onCopyLink: () => void
}

/**
 * Adding a member is now a code on screen, not a form.
 *
 * The email invite asked the inviter to type an address for someone sitting
 * next to them, then waited on a mail round-trip before anything happened. A QR
 * closes the loop in the room: one person opens this, the other scans, and the
 * household has two people. The copyable link is the same token for the case
 * where they are not in the same room.
 */
export function InviteQrDialog({
  open,
  onOpenChange,
  householdName,
  invite,
  joinUrl,
  isPreparing,
  error,
  isRenewing,
  onRenew,
  onCopyLink,
}: InviteQrDialogProps) {
  const { t } = useTranslation()

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-[480px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-ink2">{t('invites.qr.eyebrow')}</p>
          <ResponsiveDialogTitle className="text-[26px] font-semibold tracking-[-0.035em] sm:text-[28px]">
            {t('invites.qr.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {householdName
              ? t('invites.qr.helperNamed', { name: householdName })
              : t('invites.qr.helper')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-6 space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="sunk flex flex-col items-center gap-4 px-4 py-6">
            {joinUrl ? (
              <QrCode value={joinUrl} alt={t('invites.qr.imageAlt')} />
            ) : (
              <Skeleton className="size-[232px] rounded-card" />
            )}

            <p className="max-w-[280px] text-center text-[12px] leading-5 text-ink2">
              {error ?? (isPreparing ? t('invites.qr.preparing') : t('invites.qr.scanHint'))}
            </p>
          </div>

          {/*
            The link is a permanent part of this dialog, not a fallback that
            appears once something has gone wrong — because the thing that goes
            wrong is unobservable from here. A camera that will not focus, a
            scanner app that strips query params, the two people being on a
            phone call rather than in a room, or the inviter running on
            localhost (where the QR's origin only resolves on their own
            machine): none of that reaches this component, so the escape hatch
            cannot be conditional on detecting it.

            Shown in full rather than truncated, and selectable, so it can be
            read out or typed by hand when even copy is not an option.
          */}
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-medium text-ink2">
              {t('invites.qr.linkLabel')}
            </p>
            <div className="sunk flex items-start gap-2 px-3 py-2.5">
              {joinUrl ? (
                <span className="min-w-0 flex-1 break-all font-mono text-[11px] leading-5 text-ink2">
                  {joinUrl}
                </span>
              ) : (
                <Skeleton className="mt-0.5 h-4 flex-1" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-mt-0.5 shrink-0 gap-1.5 text-[12px]"
                disabled={!joinUrl}
                onClick={onCopyLink}
              >
                <Copy className="size-3.5" aria-hidden />
                {t('invites.qr.copy')}
              </Button>
            </div>
          </div>

          {invite ? (
            <p className="px-1 text-[11px] leading-5 text-ink3">
              {t('invites.qr.expiresOn', { date: formatExpiry(invite.expiresAt) })}
            </p>
          ) : null}

          <ResponsiveDialogFooter className="-mx-6 mt-2 flex-row items-center justify-between border-t border-hair px-6 pt-4 sm:-mx-8 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[12px] text-ink2"
              disabled={isRenewing}
              onClick={onRenew}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {t('invites.qr.renew')}
            </Button>
            <Button type="button" className="px-6" onClick={() => onOpenChange(false)}>
              {t('common.done')}
            </Button>
          </ResponsiveDialogFooter>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function formatExpiry(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

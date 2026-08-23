import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { HouseholdInvite } from '@money-space/core/features/invites/model/invites.types'

import { BottomSheet, Button, QrCode, Skeleton } from '@/components/ui'

/**
 * Adding a member is a code on screen, not a form.
 *
 * The two people are normally in the same room, so the fastest path is one
 * phone showing a code and the other scanning it. On mobile the code is a
 * `moneyspace://join?…` deep link (the base is set in `bootstrap.ts`), which
 * means a scan opens this app directly at `app/join.tsx` rather than bouncing
 * through a browser.
 *
 * The link is a **permanent** part of this sheet, never a fallback that appears
 * once something has gone wrong — because the thing that goes wrong is
 * invisible from here. A camera that will not focus, a scanner that strips
 * query params, the two people being on a phone call instead of in a room:
 * none of that reaches this component, so the escape hatch cannot be
 * conditional on detecting it. It is shown in full and selectable, so it can
 * be read out loud when even copying is not an option.
 */
export function InviteQrSheet({
  open,
  onClose,
  invite,
  joinUrl,
  isPreparing,
  error,
  isRenewing,
  onRenew,
  onCopyLink,
}: {
  open: boolean
  onClose: () => void
  invite: HouseholdInvite | null
  joinUrl: string | null
  isPreparing: boolean
  error: string | null
  isRenewing: boolean
  onRenew: () => void
  onCopyLink: () => void
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('invites.qr.title')}
      footer={
        <Button onPress={onClose}>{t('common.done')}</Button>
      }
    >
      <View className="items-center gap-4 rounded-sunk bg-sunk px-4 py-6">
        {joinUrl ? (
          <QrCode value={joinUrl} accessibilityLabel={t('invites.qr.imageAlt')} />
        ) : (
          <Skeleton height={256} className="w-[256px] rounded-sunk" />
        )}

        {/* Only speaks up when there is something to say: a failure, or the
            wait while the code is minted. The steady state is the code. */}
        {error || isPreparing ? (
          <Text
            className={`max-w-[280px] text-center text-[12px] leading-5 ${error ? 'text-alert' : 'text-ink2'}`}
          >
            {error ?? t('invites.qr.preparing')}
          </Text>
        ) : null}
      </View>

      <Text className="mt-5 text-[13px] text-ink2">{t('invites.qr.linkLabel')}</Text>

      <View className="mt-2 rounded-sunk bg-sunk px-3.5 py-3">
        {joinUrl ? (
          <Text selectable className="font-mono text-[11px] leading-5 text-ink2">
            {joinUrl}
          </Text>
        ) : (
          <Skeleton height={16} />
        )}
        <Button
          className="mt-1 -ml-2 self-start px-2"
          variant="ghost"
          onPress={onCopyLink}
        >
          {t('invites.qr.copy')}
        </Button>
      </View>

      {invite ? (
        <Text className="mt-3 text-[11px] leading-5 text-ink3">
          {t('invites.qr.expiresOn', { date: formatExpiry(invite.expiresAt) })}
        </Text>
      ) : null}

      {/* Renewing is deliberately quiet and last: opening this sheet reuses the
          household's live token rather than minting one, because every live
          token is a standing way in. Replacing a code that got out is a
          separate, explicit decision. */}
      <Button
        className="mt-4 -ml-2 self-start px-2"
        variant="ghost"
        loading={isRenewing}
        onPress={onRenew}
      >
        {t('invites.qr.renew')}
      </Button>
    </BottomSheet>
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

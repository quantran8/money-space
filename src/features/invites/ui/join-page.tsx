import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useJoinInvite } from '@/features/invites/hooks/use-join-invite'

/**
 * `/join?household=…&token=…` — where a scanned QR lands.
 *
 * Sits **outside** `RequireHousehold` on purpose: whoever scans this is very
 * often someone with no household at all, and that gate would send them into
 * the create-a-household wizard — the opposite of joining one. It is still
 * behind `RequireAuth`, because joining attaches a real identity to a real
 * member row, so we have to know who is joining.
 *
 * Shows the household name, who invited them, and nothing about the money. A
 * token holder has been granted nothing until they tap the button.
 */
export function JoinPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    isMissingToken,
    preview,
    isLoading,
    loadError,
    isAccepting,
    isAutoJoining,
    acceptJoin,
  } = useJoinInvite()

  const problem = isMissingToken ? t('invites.join.malformed') : loadError

  return (
    <main className="flex min-h-screen items-center justify-center bg-app p-4 text-ink md:p-6">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <p className="text-sm font-medium text-ink2">{t('invites.join.eyebrow')}</p>

        {/*
          Signing up in order to follow an invite link joins on arrival, so this
          screen reports progress rather than asking again. It is checked before
          the loading branch: the preview fetch and the accept are one continuous
          action from here, and splitting them into two spinners would make a
          single step look like two.
        */}
        {isAutoJoining && !problem ? (
          <>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em]">
              {preview
                ? t('invites.join.autoJoiningNamed', { name: preview.householdName })
                : t('invites.join.autoJoining')}
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-ink2">
              {t('invites.join.autoJoiningHint')}
            </p>
          </>
        ) : isLoading ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : problem ? (
          <>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em]">
              {t('invites.join.unavailableTitle')}
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-ink2">{problem}</p>
          </>
        ) : preview ? (
          <>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em]">
              {t('invites.join.title', { name: preview.householdName })}
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-ink2">
              {preview.invitedByName
                ? t('invites.join.invitedBy', { name: preview.invitedByName })
                : t('invites.join.invitedByUnknown')}
            </p>

            <div className="sunk mt-6 px-4 py-3.5">
              <p className="text-[12px] leading-5 text-ink2">
                {preview.acceptable
                  ? t('invites.join.equalMembers')
                  : t(`invites.join.status.${preview.status}`)}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
              <Button
                type="button"
                className="flex-1"
                disabled={!preview.acceptable || isAccepting}
                onClick={acceptJoin}
              >
                {isAccepting ? t('invites.join.joining') : t('invites.join.accept')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/', { replace: true })}
              >
                {t('invites.join.later')}
              </Button>
            </div>
          </>
        ) : null}

        {problem ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-6 w-full"
            onClick={() => navigate('/', { replace: true })}
          >
            {t('invites.join.back')}
          </Button>
        ) : null}
      </div>
    </main>
  )
}

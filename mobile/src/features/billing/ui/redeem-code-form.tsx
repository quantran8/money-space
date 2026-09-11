import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useRedeemCode } from '@money-space/core/features/billing/hooks/use-redeem-code'
import { clipboard } from '@money-space/core/shared/clipboard'

import { Button, Field } from '@/components/ui'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

const ERROR_KEYS = {
  invalid: 'billing.redeem.error.invalid',
  expired: 'billing.redeem.error.expired',
  exhausted: 'billing.redeem.error.exhausted',
  already_used: 'billing.redeem.error.alreadyUsed',
  no_effect: 'billing.redeem.error.noEffect',
  rate_limited: 'billing.redeem.error.rateLimited',
} as const

/**
 * Enter a code, see what it does, then activate it.
 *
 * Allowed on mobile where a payment button is not: entering a code is not a
 * transaction, so it does not fall under the App Store's rule about linking out
 * to purchase.
 */
export function RedeemCodeForm({ onRedeemed }: { onRedeemed?: () => void }) {
  const { t } = useTranslation()
  const {
    input,
    onChange,
    step,
    preview,
    reason,
    pending,
    check,
    confirm,
    reset,
  } = useRedeemCode(onRedeemed)

  if (step === 'done') {
    const grant = preview?.grant
    return (
      <View>
        <Text className="t-subtitle text-ink">
          {t('billing.redeem.success.title')}
        </Text>
        <Text className="mt-2 t-body-sm leading-5 text-ink2">
          {grant?.isLifetime || !grant?.periodEndAfter
            ? t('billing.redeem.success.lifetime')
            : t('billing.redeem.success.description', {
                date: formatDate(grant.periodEndAfter),
              })}
        </Text>
        <View className="mt-4 flex-row">
          <Button variant="secondary" className="px-4" onPress={reset}>
            {t('billing.redeem.success.done')}
          </Button>
        </View>
      </View>
    )
  }

  if (step === 'previewing' && preview?.grant) {
    const { grant } = preview
    return (
      <View>
        <Text className="t-subtitle text-ink">
          {t('billing.redeem.preview.title')}
        </Text>
        <Text className="mt-2 t-body-sm leading-5 text-ink2">
          {grant.isLifetime
            ? t('billing.redeem.preview.lifetime')
            : grant.stacked && grant.periodEndAfter
              ? t('billing.redeem.preview.stacked', {
                  current: formatDate(
                    new Date(
                      new Date(grant.periodEndAfter).getTime() -
                        grant.addedDays * 86_400_000,
                    ).toISOString(),
                  ),
                  days: grant.addedDays,
                  after: formatDate(grant.periodEndAfter),
                })
              : t('billing.redeem.preview.description', { days: grant.addedDays })}
        </Text>
        <Text className="mt-1 t-caption text-ink3">
          {t('billing.redeem.preview.forHousehold', { name: preview.householdName })}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <Button className="px-4" loading={pending} onPress={() => void confirm()}>
            {pending
              ? t('billing.redeem.submitting')
              : t('billing.redeem.preview.confirm')}
          </Button>
          <Button variant="secondary" className="px-4" onPress={reset}>
            {t('billing.redeem.preview.back')}
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View>
      <Text className="t-subtitle text-ink">{t('billing.redeem.title')}</Text>
      <Text className="mt-1 t-body-sm leading-5 text-ink2">
        {t('billing.redeem.description')}
      </Text>

      <Field
        className="mt-4"
        value={input}
        onChangeText={onChange}
        placeholder={t('billing.redeem.placeholder')}
        // A phone keyboard's autocorrect will happily rewrite a code.
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        error={reason ? t(ERROR_KEYS[reason]) : undefined}
      />

      <View className="mt-3 flex-row gap-2">
        <Button className="px-4" loading={pending} onPress={() => void check()}>
          {pending ? t('billing.redeem.submitting') : t('billing.redeem.submit')}
        </Button>
        <Button
          variant="secondary"
          className="px-4"
          onPress={() => void clipboard.readText().then(onChange).catch(() => {})}
        >
          {t('billing.redeem.paste')}
        </Button>
      </View>
    </View>
  )
}

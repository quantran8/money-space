import { useTranslation } from 'react-i18next'

/** The terms/privacy footnote under both auth forms. */
export function AuthLegalNote() {
  const { t } = useTranslation()
  return (
    <p className="mt-8 text-center text-[11px] leading-5 text-ink3">{t('auth.legal')}</p>
  )
}

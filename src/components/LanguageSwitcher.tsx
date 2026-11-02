import { useTranslation } from 'react-i18next'
import { changeLanguage, SUPPORTED_LANGUAGES, type Language } from '../i18n'

/** "RO | RU": the active language is bold and dark, the other one grey (plan de design, section 5). */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const current: Language = i18n.resolvedLanguage === 'ru' ? 'ru' : 'ro'
  const short = (lng: Language) => t(lng === 'ro' ? 'language.roShort' : 'language.ruShort')

  return (
    <div role="group" aria-label={t('language.label')} className={`flex shrink-0 items-center ${className}`}>
      {SUPPORTED_LANGUAGES.map((lng, index) => {
        const active = current === lng
        return (
          <span key={lng} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="text-line-strong">
                |
              </span>
            )}
            <button
              type="button"
              lang={lng}
              aria-pressed={active}
              aria-label={`${short(lng)} – ${t(`language.${lng}`)}`}
              onClick={() => void changeLanguage(lng)}
              className={`inline-flex min-h-11 min-w-9 items-center justify-center rounded-field px-1.5 text-sm ${
                active ? 'font-semibold text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {short(lng)}
            </button>
          </span>
        )
      })}
    </div>
  )
}

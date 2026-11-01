import { useTranslation } from 'react-i18next'
import { changeLanguage, SUPPORTED_LANGUAGES, type Language } from '../i18n'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600'

/**
 * Phones: one small button showing the OTHER language ("RU" while the site is in Romanian).
 * Computers (sm+): both languages side by side, the active one highlighted.
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current: Language = i18n.resolvedLanguage === 'ru' ? 'ru' : 'ro'
  const other: Language = current === 'ro' ? 'ru' : 'ro'
  const short = (lng: Language) => t(lng === 'ro' ? 'language.roShort' : 'language.ruShort')

  return (
    <>
      <button
        type="button"
        lang={other}
        onClick={() => void changeLanguage(other)}
        aria-label={`${t('language.label')}: ${t(`language.${other}`)}`}
        className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:hidden ${focusRing}`}
      >
        {short(other)}
      </button>

      <div
        role="group"
        aria-label={t('language.label')}
        className="hidden rounded-lg border border-slate-300 bg-white p-0.5 sm:flex"
      >
        {SUPPORTED_LANGUAGES.map((lng) => {
          const active = current === lng
          return (
            <button
              key={lng}
              type="button"
              lang={lng}
              aria-pressed={active}
              aria-label={t(`language.${lng}`)}
              onClick={() => void changeLanguage(lng)}
              className={`min-w-10 rounded-md px-2 py-1.5 text-sm font-semibold transition ${focusRing} ${
                active ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {short(lng)}
            </button>
          )
        })}
      </div>
    </>
  )
}

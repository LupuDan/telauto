import { useTranslation } from 'react-i18next'
import { changeLanguage, SUPPORTED_LANGUAGES } from '../i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-lg border border-slate-300 bg-white p-0.5">
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <button
            key={lng}
            type="button"
            lang={lng}
            aria-pressed={active}
            aria-label={t(`language.${lng}`)}
            onClick={() => void changeLanguage(lng)}
            className={`min-w-10 rounded-md px-2 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600 ${
              active ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t(lng === 'ro' ? 'language.roShort' : 'language.ruShort')}
          </button>
        )
      })}
    </div>
  )
}

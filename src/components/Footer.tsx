import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { STATIC_PAGES } from '../lib/staticPages'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
        <nav aria-label={t('footer.navLabel')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {STATIC_PAGES.map((page) => (
              <li key={page}>
                <Link to={`/p/${page}`} className="hover:text-brand-700 hover:underline">
                  {t(`footer.${page}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-4 flex flex-wrap gap-x-2">
          <span>{t('footer.rights', { year: CURRENT_YEAR })}</span>
          <span aria-hidden="true">·</span>
          <span>{t('footer.testVersion')}</span>
        </p>
      </div>
    </footer>
  )
}

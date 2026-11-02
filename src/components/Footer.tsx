import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { STATIC_PAGES } from '../lib/staticPages'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto max-w-page px-4 py-8 text-sm text-muted md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo variant="compact" />
            <p className="mt-3 max-w-sm">{t('app.tagline')}</p>
          </div>
          <nav aria-label={t('footer.navLabel')}>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:flex-wrap">
              {STATIC_PAGES.map((page) => (
                <li key={page}>
                  <Link to={`/p/${page}`} className="inline-flex min-h-11 items-center text-ink hover:text-brand hover:underline">
                    {t(`footer.${page}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap gap-x-2">
            <span>{t('footer.rights', { year: CURRENT_YEAR })}</span>
            <span aria-hidden="true">·</span>
            <span>{t('footer.testVersion')}</span>
          </p>
          <ThemeToggle variant="full" className="self-start sm:self-auto" />
        </div>
      </div>
    </footer>
  )
}

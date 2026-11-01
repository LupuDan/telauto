import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          to="/"
          aria-label={t('header.homeLink')}
          className="shrink-0 text-xl font-extrabold tracking-tight text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {t('app.name')}
        </Link>

        {/* On phones the search bar takes its own full-width row (order-last). */}
        <div className="order-last w-full md:order-none md:w-auto md:flex-1">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LanguageSwitcher />
          <Link
            to="/new"
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <span aria-hidden="true">+ </span>
            {t('header.addListing')}
          </Link>
        </div>
      </div>
    </header>
  )
}

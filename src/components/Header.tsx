import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../features/auth/authContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  )
}

export function Header() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
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

          {!loading && (
            <Link
              to={user ? '/account' : '/login'}
              aria-label={user ? t('header.account') : t('header.login')}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <UserIcon />
              <span className="hidden sm:inline">{user ? t('header.account') : t('header.login')}</span>
            </Link>
          )}

          <Link
            to="/new"
            className="inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <span aria-hidden="true">+&nbsp;</span>
            <span className="sm:hidden">{t('header.addListingShort')}</span>
            <span className="hidden sm:inline">{t('header.addListing')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

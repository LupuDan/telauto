import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { LoadingState } from '../components/ui/LoadingState'
import { useAdminCounts } from '../features/admin/api'
import { FlaggedTab, HiddenTab, ReportsTab } from '../features/admin/ModerationTabs'
import { ReferencesTab } from '../features/admin/ReferencesTab'
import { UsersTab } from '../features/admin/UsersTab'
import { useAuth } from '../features/auth/authContext'
import { useProfile } from '../features/profile/hooks'
import { translateKey } from '../i18n/translate'

const TABS = ['reports', 'flagged', 'hidden', 'users', 'references'] as const
type Tab = (typeof TABS)[number]

/**
 * #/admin – only for profiles with role = 'admin' (see README).
 * Hiding the page is only for convenience: the database refuses admin actions for everyone else.
 */
export function AdminPage() {
  const { t } = useTranslation()
  usePageMeta(t('admin.metaTitle'))
  const { user } = useAuth()
  const profile = useProfile(user?.id)

  if (profile.isPending) return <LoadingState />
  if (!profile.data || profile.data.role !== 'admin' || profile.data.is_blocked) {
    return (
      <section className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-semibold">{t('admin.noAccessTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('admin.noAccessText')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand hover:underline">
          {t('notFound.backHome')}
        </Link>
      </section>
    )
  }
  return <AdminPanel />
}

function AdminPanel() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'reports'
  const counts = useAdminCounts()
  const badge: Partial<Record<Tab, number>> = {
    reports: counts.data?.open_reports,
    flagged: counts.data?.flagged_messages,
    hidden: counts.data?.hidden_listings,
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold">{t('admin.title')}</h1>
      <nav aria-label={t('admin.title')} className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {TABS.map((item) => (
            <li key={item}>
              <button
                type="button"
                aria-current={tab === item ? 'page' : undefined}
                onClick={() => setParams({ tab: item })}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${
                  tab === item ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-ink'
                }`}
              >
                {translateKey(t, `admin.tabs.${item}`)}
                {(badge[item] ?? 0) > 0 && (
                  <span className="rounded-full bg-danger px-1.5 text-xs leading-5 text-white">{badge[item]}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'flagged' && <FlaggedTab />}
      {tab === 'hidden' && <HiddenTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'references' && <ReferencesTab />}
    </div>
  )
}

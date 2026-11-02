import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { buttonClass } from '../components/ui/buttonStyles'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { Tabs } from '../components/ui/Tabs'
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
      <EmptyState
        title={t('admin.noAccessTitle')}
        text={t('admin.noAccessText')}
        action={
          <Link to="/" className={buttonClass('secondary')}>
            {t('notFound.backHome')}
          </Link>
        }
      />
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
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 type-h1 text-ink">{t('admin.title')}</h1>
      <div className="mb-6">
        <Tabs
          label={t('admin.title')}
          value={tab}
          onChange={(item) => setParams({ tab: item })}
          items={TABS.map((item) => ({
            value: item,
            label: (
              <>
                {translateKey(t, `admin.tabs.${item}`)}
                {(badge[item] ?? 0) > 0 && (
                  <span className="min-w-5 rounded-full bg-danger px-1.5 text-center text-xs leading-5 text-white tabular">
                    {badge[item]}
                  </span>
                )}
              </>
            ),
          }))}
        />
      </div>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'flagged' && <FlaggedTab />}
      {tab === 'hidden' && <HiddenTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'references' && <ReferencesTab />}
    </div>
  )
}

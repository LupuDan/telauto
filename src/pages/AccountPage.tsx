import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { Tabs } from '../components/ui/Tabs'
import { signOut } from '../features/auth/api'
import { useAuth } from '../features/auth/authContext'
import { FavoritesList } from '../features/favorites/FavoritesList'
import { GarageList } from '../features/garage/GarageList'
import { MyListings } from '../features/listings/MyListings'
import { ChangePasswordForm } from '../features/profile/ChangePasswordForm'
import { DeleteAccountForm } from '../features/profile/DeleteAccountForm'
import { useMyPhone, useProfile } from '../features/profile/hooks'
import { ProfileSettingsForm } from '../features/profile/ProfileSettingsForm'
import { CATEGORIES, CATEGORY_SLUGS } from '../lib/categories'

// "garage" is the tab the auto categories add (homeModule 'garage' in src/lib/categories.ts)
const HAS_GARAGE = CATEGORY_SLUGS.some((slug) => CATEGORIES[slug].homeModule === 'garage')
const TABS = (['listings', 'favorites', 'garage', 'settings'] as const).filter((tab) => tab !== 'garage' || HAS_GARAGE)
type Tab = (typeof TABS)[number]

export function AccountPage() {
  const { t } = useTranslation()
  usePageMeta(t('account.metaTitle'))
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'listings'
  const { user } = useAuth()
  const myProfile = useProfile(user?.id)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="type-h1 text-ink">{t('account.title')}</h1>
        {myProfile.data?.role === 'admin' && (
          <Link to="/admin" className={buttonClass('secondary', 'compact')}>
            <Settings aria-hidden="true" className="size-5" strokeWidth={1.75} />
            {t('admin.openPanel')}
          </Link>
        )}
      </div>

      {params.get('notice') === 'password-changed' && (
        <div className="mb-4">
          <Alert kind="success">{t('auth.resetDone')}</Alert>
        </div>
      )}

      <div className="mb-6">
        <Tabs
          label={t('account.title')}
          items={TABS.map((item) => ({ value: item, label: t(`account.tabs.${item}`) }))}
          value={tab}
          onChange={(item) => setParams({ tab: item })}
        />
      </div>

      {(params.get('notice') === 'published' || params.get('notice') === 'saved') && (
        <div className="mb-4">
          <Alert kind="success">
            {params.get('notice') === 'published' ? t('myListings.publishedNotice') : t('myListings.savedNotice')}
            {params.get('id') && /^[0-9a-f-]{36}$/i.test(params.get('id') ?? '') && (
              <>
                {' '}
                <Link to={`/a/${params.get('id')}`} className="font-medium text-brand underline-offset-2 hover:underline">
                  {t('myListings.viewListing')}
                </Link>
              </>
            )}
          </Alert>
        </div>
      )}

      {tab === 'settings' ? (
        <SettingsTab />
      ) : tab === 'favorites' ? (
        <FavoritesList />
      ) : tab === 'garage' ? (
        <GarageList />
      ) : user ? (
        <MyListings userId={user.id} />
      ) : null}
    </div>
  )
}

function SettingsTab() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const profile = useProfile(user?.id)
  const phone = useMyPhone(user?.id)

  if (!user) return null
  if (profile.isPending || phone.isPending) return <LoadingState />
  if (profile.isError || phone.isError || !profile.data) {
    return (
      <ErrorState
        error={profile.error ?? phone.error}
        onRetry={() => {
          void profile.refetch()
          void phone.refetch()
        }}
      />
    )
  }

  const email = user.email ?? ''

  return (
    <div className="space-y-6">
      {profile.data.is_blocked && <Alert kind="warning">{t('account.blockedNotice')}</Alert>}

      <Section title={t('account.profileSection')}>
        <p className="mb-4 text-sm text-muted">
          {t('account.email')}: <span className="font-medium text-ink">{email}</span>
          {' · '}
          <Link to={`/u/${user.id}`} className="text-brand hover:underline">
            {t('account.publicProfileLink')}
          </Link>
        </p>
        <ProfileSettingsForm userId={user.id} profile={profile.data} phone={phone.data} />
      </Section>

      <Section title={t('account.passwordSection')}>
        <ChangePasswordForm email={email} />
      </Section>

      <Section title={t('account.logoutSection')}>
        <Button variant="secondary" onClick={() => void signOut()}>
          {t('auth.logout')}
        </Button>
      </Section>

      <Section title={t('account.dangerSection')} danger>
        <DeleteAccountForm userId={user.id} email={email} />
      </Section>
    </div>
  )
}

function Section({ title, danger = false, children }: { title: string; danger?: boolean; children: ReactNode }) {
  return (
    <section
      className={`rounded-panel border bg-surface p-4 sm:p-5 ${danger ? 'border-danger-200' : 'border-line'}`}
    >
      <h2 className={`mb-4 type-h2 ${danger ? 'text-danger' : 'text-ink'}`}>{title}</h2>
      {children}
    </section>
  )
}

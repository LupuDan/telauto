import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { signOut } from '../features/auth/api'
import { useAuth } from '../features/auth/authContext'
import { ChangePasswordForm } from '../features/profile/ChangePasswordForm'
import { DeleteAccountForm } from '../features/profile/DeleteAccountForm'
import { useMyPhone, useProfile } from '../features/profile/hooks'
import { ProfileSettingsForm } from '../features/profile/ProfileSettingsForm'

const TABS = ['listings', 'favorites', 'garage', 'settings'] as const
type Tab = (typeof TABS)[number]

export function AccountPage() {
  const { t } = useTranslation()
  usePageMeta(t('account.metaTitle'))
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'settings'

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">{t('account.title')}</h1>

      {params.get('notice') === 'password-changed' && (
        <div className="mb-4">
          <Alert kind="success">{t('auth.resetDone')}</Alert>
        </div>
      )}

      <nav aria-label={t('account.title')} className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-slate-200">
          {TABS.map((item) => (
            <li key={item}>
              <button
                type="button"
                aria-current={tab === item ? 'page' : undefined}
                onClick={() => setParams({ tab: item })}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
                  tab === item
                    ? 'border-brand-700 text-brand-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t(`account.tabs.${item}`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'settings' ? (
        <SettingsTab />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          {t('account.tabComingSoon')}
        </p>
      )}
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
        <p className="mb-4 text-sm text-slate-600">
          {t('account.email')}: <span className="font-medium text-slate-900">{email}</span>
          {' · '}
          <Link to={`/u/${user.id}`} className="text-brand-700 hover:underline">
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
      className={`rounded-xl border bg-white p-5 shadow-sm ${danger ? 'border-red-200' : 'border-slate-200'}`}
    >
      <h2 className={`mb-4 text-lg font-semibold ${danger ? 'text-red-800' : ''}`}>{title}</h2>
      {children}
    </section>
  )
}

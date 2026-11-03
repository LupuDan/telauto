import { Lock, Trash2, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../../app/usePageMeta'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../auth/authContext'
import { useLocalities } from '../reference/hooks'
import { ChangePasswordForm } from '../profile/ChangePasswordForm'
import { DeleteAccountForm } from '../profile/DeleteAccountForm'
import { useMyPhone, useProfile } from '../profile/hooks'
import { ProfileSettingsForm } from '../profile/ProfileSettingsForm'
import { MenuList, MenuRow, ScreenHeader } from './parts'

/** "Setări": short screens instead of one long form (plan de design, 6.6). "Șterge contul" is last, in red. */
export function SettingsMenu() {
  const { t } = useTranslation()
  usePageMeta(`${t('account.settings.title')} – Telauto.md`)
  return (
    <div className="mx-auto max-w-xl lg:mx-0">
      <ScreenHeader title={t('account.settings.title')} back="/account" />
      <div className="space-y-4">
        <MenuList label={t('account.settings.title')}>
          <MenuRow to="/account/settings/profile" Icon={UserRound} label={t('account.settings.profile')} />
          <MenuRow to="/account/settings/security" Icon={Lock} label={t('account.settings.security')} />
        </MenuList>
        <MenuList>
          <MenuRow to="/account/settings/delete" Icon={Trash2} label={t('account.settings.delete')} danger />
        </MenuList>
      </div>
    </div>
  )
}

/** Profil: photo, display name, locality, phone. */
export function ProfileScreen() {
  const { t } = useTranslation()
  usePageMeta(`${t('account.settings.profile')} – Telauto.md`)
  const { user } = useAuth()
  const profile = useProfile(user?.id)
  const phone = useMyPhone(user?.id)
  // the locality list must be there before the form starts, otherwise the saved locality is not shown
  const localities = useLocalities()

  let content
  if (!user || profile.isPending || phone.isPending || localities.isPending) content = <LoadingState />
  else if (profile.isError || phone.isError || !profile.data) {
    content = (
      <ErrorState
        error={profile.error ?? phone.error}
        onRetry={() => {
          void profile.refetch()
          void phone.refetch()
        }}
      />
    )
  } else content = <ProfileSettingsForm userId={user.id} profile={profile.data} phone={phone.data} />

  return (
    <div className="mx-auto max-w-xl lg:mx-0">
      <ScreenHeader title={t('account.settings.profile')} back="/account/settings" backOnDesktop />
      {content}
    </div>
  )
}

/** Securitate: the e-mail of the account and the password change. */
export function SecurityScreen() {
  const { t } = useTranslation()
  usePageMeta(`${t('account.settings.security')} – Telauto.md`)
  const { user } = useAuth()
  const email = user?.email ?? ''
  return (
    <div className="mx-auto max-w-xl lg:mx-0">
      <ScreenHeader title={t('account.settings.security')} back="/account/settings" backOnDesktop />
      <div className="space-y-6">
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="type-h2 text-ink">{t('account.email')}</h2>
          <p className="mt-1 break-all text-ink">{email}</p>
        </section>
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-4 type-h2 text-ink">{t('account.passwordSection')}</h2>
          <ChangePasswordForm email={email} />
        </section>
      </div>
    </div>
  )
}

/** Șterge contul: explains what is deleted and asks for the word ȘTERGE (RU: УДАЛИТЬ). */
export function DeleteAccountScreen() {
  const { t } = useTranslation()
  usePageMeta(`${t('account.settings.delete')} – Telauto.md`)
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-xl lg:mx-0">
      <ScreenHeader title={t('account.settings.delete')} back="/account/settings" backOnDesktop />
      <section className="rounded-card border border-danger-200 bg-surface p-4">
        {user && <DeleteAccountForm userId={user.id} email={user.email ?? ''} />}
      </section>
    </div>
  )
}

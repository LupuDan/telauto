import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { inputClass } from '../../components/ui/fieldStyles'
import { formatDate } from '../../lib/format'
import { useAuth } from '../auth/authContext'
import { useAdminUsers, useSetUserBlocked } from './api'
import { ActionError, Card, ConfirmButton, EmptyBox } from './ui'

/** Search by name or email; block / unblock. Blocked users cannot publish or write, their listings disappear. */
export function UsersTab() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const users = useAdminUsers(query)
  const block = useSetUserBlocked()

  // search 300 ms after the last key press
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <div className="space-y-3">
      <label htmlFor="admin-user-search" className="block text-sm font-medium text-slate-700">
        {t('admin.users.searchLabel')}
      </label>
      <input
        id="admin-user-search"
        type="search"
        value={text}
        maxLength={100}
        onChange={(event) => setText(event.target.value)}
        placeholder={t('admin.users.searchPlaceholder')}
        className={inputClass(false)}
      />
      <ActionError error={block.error} />

      {users.isPending ? (
        <LoadingState />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : users.data.length === 0 ? (
        <EmptyBox>{t('admin.users.empty')}</EmptyBox>
      ) : (
        <ul className="space-y-3">
          {users.data.map((row) => (
            <Card key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/u/${row.id}`} className="font-semibold break-words hover:underline">
                    {row.display_name || t('profile.unnamed')}
                  </Link>
                  {row.role === 'admin' && (
                    <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">admin</span>
                  )}
                  {row.is_blocked && (
                    <span className="ml-2 rounded bg-danger-50 px-1.5 py-0.5 text-xs font-semibold text-danger">
                      {t('profile.blocked')}
                    </span>
                  )}
                  <p className="text-sm break-all text-slate-600">{row.email}</p>
                  <p className="text-xs text-slate-500">
                    {t('admin.users.since', { date: formatDate(row.created_at, i18n.resolvedLanguage) })} ·{' '}
                    {t('admin.users.activeListings', { count: row.active_listings })}
                    {row.open_reports > 0 && (
                      <span className="font-semibold text-danger"> · {t('admin.reports.count', { count: row.open_reports })}</span>
                    )}
                  </p>
                </div>
                {row.id !== user?.id && row.role !== 'admin' && (
                  row.is_blocked ? (
                    <Button
                      variant="secondary"
                      loading={block.isPending}
                      onClick={() => block.mutate({ userId: row.id, blocked: false })}
                    >
                      {t('admin.actions.unblock')}
                    </Button>
                  ) : (
                    <ConfirmButton
                      confirmText={t('admin.confirm.block')}
                      loading={block.isPending}
                      onConfirm={() => block.mutate({ userId: row.id, blocked: true })}
                    >
                      {t('admin.actions.block')}
                    </ConfirmButton>
                  )
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}

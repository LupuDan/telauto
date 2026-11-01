import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { ReportDialog, type ReportTarget } from './ReportDialog'

/**
 * "Raportează" for a listing (big button on the listing page) or a message (small link in the chat).
 * Visitors are sent to the login page first.
 */
export function ReportButton({ target, variant = 'button' }: { target: ReportTarget; variant?: 'button' | 'link' }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  function handleClick() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    setOpen(true)
  }

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-slate-300 px-1 py-1 text-xs font-medium text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ⚑
          </span>
          <span>{t('listing.actions.report')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="text-[11px] text-slate-400 underline-offset-2 hover:text-red-700 hover:underline"
        >
          {t('listing.actions.report')}
        </button>
      )}
      {open && <ReportDialog target={target} onClose={() => setOpen(false)} />}
    </>
  )
}

import { Flag } from 'lucide-react'
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
        // discreet link at the end of the listing page (plan de design, 6.3)
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted underline-offset-2 hover:text-danger hover:underline"
        >
          <Flag aria-hidden="true" className="size-4" strokeWidth={1.75} />
          {t('listing.reportListing')}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="text-[11px] text-slate-400 underline-offset-2 hover:text-danger hover:underline"
        >
          {t('listing.actions.report')}
        </button>
      )}
      {open && <ReportDialog target={target} onClose={() => setOpen(false)} />}
    </>
  )
}

import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { useFavoriteIds, useToggleFavorite } from './api'

type FavoriteButtonProps = {
  listingId: string
  /** "icon": round ♡ over the card photo; "full": button with text on the listing page */
  variant?: 'icon' | 'full'
}

/** "Salvează": logged-in users save a listing; visitors are sent to the login page and come back. */
export function FavoriteButton({ listingId, variant = 'icon' }: FavoriteButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const ids = useFavoriteIds()
  const toggle = useToggleFavorite()
  const saved = ids.data?.has(listingId) ?? false

  function handleClick() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    toggle.mutate({ listingId, save: !saved })
  }

  const label = saved ? t('favorites.remove') : t('favorites.save')
  const heart = (
    <span aria-hidden="true" className={saved ? 'text-red-600' : ''}>
      {saved ? '♥' : '♡'}
    </span>
  )

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className="flex size-10 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-slate-700 shadow hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {heart}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      className={`flex min-h-11 flex-col items-center justify-center rounded-lg border px-1 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand-600 ${
        saved ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="text-lg leading-none">{heart}</span>
      <span>{saved ? t('favorites.saved') : t('favorites.save')}</span>
    </button>
  )
}

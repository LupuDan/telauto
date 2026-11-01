import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { translateKey } from '../../i18n/translate'
import { formatMonthYear, localizedName } from '../../lib/format'
import { useAuth } from '../auth/authContext'
import { errorToKey } from '../auth/authErrors'
import { useLocalities } from '../reference/hooks'
import { useListingContact, type ListingDetails } from './api'

/** Seller, "Show phone" (logged-in users only), IMEI/VIN and the actions of later phases. */
export function SellerBox({ listing }: { listing: ListingDetails }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const localities = useLocalities()
  const contact = useListingContact(listing.id)
  const isOwner = user?.id === listing.userId
  const seller = listing.seller
  const sellerName = seller?.displayName || t('profile.unnamed')
  const sellerLocality = localities.data?.find((item) => item.id === seller?.localityId)
  const loginHref = `/login?next=${encodeURIComponent(`/a/${listing.id}`)}`
  const privateLabel = listing.hasImei ? 'IMEI' : listing.hasVin ? 'VIN' : null

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label={t('listing.sellerTitle')}>
        <Link to={`/u/${listing.userId}`} className="flex items-center gap-3 rounded-lg hover:bg-slate-50">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700"
          >
            {sellerName.charAt(0).toLocaleUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">{sellerName}</span>
            {seller && (
              <span className="block text-xs text-slate-500">
                {t('profile.memberSince', { date: formatMonthYear(seller.createdAt, i18n.resolvedLanguage) })}
                {sellerLocality ? ` · ${localizedName(sellerLocality, i18n.resolvedLanguage)}` : ''}
              </span>
            )}
          </span>
        </Link>

        {isOwner ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">{t('listing.ownListing')}</p>
            <Link
              to={`/a/${listing.id}/edit`}
              className="flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              {t('myListings.edit')}
            </Link>
            <Link to="/account" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
              {t('listingForm.backToMyListings')}
            </Link>
          </div>
        ) : !user ? (
          <div className="space-y-2">
            <Link
              to={loginHref}
              className="flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 text-center text-sm font-semibold text-white hover:bg-brand-800"
            >
              {t('listing.loginToSeePhone')}
            </Link>
            <p className="text-xs text-slate-500">
              {privateLabel ? t('listing.loginHintPrivate', { field: privateLabel }) : t('listing.loginHint')}
            </p>
          </div>
        ) : contact.data ? (
          <div className="space-y-2" aria-live="polite">
            {contact.data.phone ? (
              <a
                href={`tel:${contact.data.phone}`}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-brand-700 px-4 text-lg font-bold text-brand-800 hover:bg-brand-50"
              >
                <span aria-hidden="true">📞</span>
                {contact.data.phone}
              </a>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t('listing.noPhone')}</p>
            )}
            {contact.data.imei && <PrivateValue label="IMEI" value={contact.data.imei} />}
            {contact.data.vin && <PrivateValue label="VIN" value={contact.data.vin} />}
          </div>
        ) : (
          <div className="space-y-2">
            <Button fullWidth loading={contact.isPending} onClick={() => contact.mutate()}>
              {privateLabel ? t('listing.showPhonePrivate', { field: privateLabel }) : t('listing.showPhone')}
            </Button>
            {contact.isError && <Alert kind="error">{translateKey(t, errorToKey(contact.error))}</Alert>}
          </div>
        )}

        {!isOwner && (
          <div className="grid grid-cols-3 gap-2">
            {(['message', 'save', 'report'] as const).map((action) => (
              <button
                key={action}
                type="button"
                disabled
                title={t('listing.comingSoon')}
                className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-slate-200 px-1 py-1 text-xs font-medium text-slate-400"
              >
                <span>{translateKey(t, `listing.actions.${action}`)}</span>
                <span className="text-[10px]">{t('listing.comingSoon')}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h2 className="mb-1 font-semibold">{t('listing.safetyTitle')}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('listing.safety1')}</li>
          <li>{t('listing.safety2')}</li>
          <li>{t('listing.safety3')}</li>
        </ul>
      </aside>
    </div>
  )
}

function PrivateValue({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono font-semibold break-all text-slate-900 select-all">{value}</span>
    </p>
  )
}

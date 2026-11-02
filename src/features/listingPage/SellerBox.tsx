import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { translateKey } from '../../i18n/translate'
import { formatMonthYear, localizedName } from '../../lib/format'
import { useAuth } from '../auth/authContext'
import { errorToKey } from '../auth/authErrors'
import { FavoriteButton } from '../favorites/FavoriteButton'
import { MessageButton } from '../messages/MessageButton'
import { ReportButton } from '../reports/ReportButton'
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
      <section className="space-y-4 rounded-card border border-line bg-surface p-4 shadow-sm" aria-label={t('listing.sellerTitle')}>
        <Link to={`/u/${listing.userId}`} className="flex items-center gap-3 rounded-field hover:bg-paper">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand"
          >
            {sellerName.charAt(0).toLocaleUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{sellerName}</span>
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
              className="flex min-h-11 items-center justify-center rounded-field bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t('myListings.edit')}
            </Link>
            <Link to="/account" className="block text-center text-sm font-semibold text-brand hover:underline">
              {t('listingForm.backToMyListings')}
            </Link>
          </div>
        ) : !user ? (
          <div className="space-y-2">
            <Link
              to={loginHref}
              className="flex min-h-11 items-center justify-center rounded-field bg-brand px-4 text-center text-sm font-semibold text-white hover:bg-brand-700"
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
                className="flex min-h-11 items-center justify-center gap-2 rounded-field border-2 border-brand px-4 text-lg font-semibold text-brand-700 hover:bg-brand-50"
              >
                <span aria-hidden="true">📞</span>
                {contact.data.phone}
              </a>
            ) : (
              <p className="rounded-field bg-paper p-3 text-sm text-slate-600">{t('listing.noPhone')}</p>
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
            <MessageButton listingId={listing.id} />
            <FavoriteButton listingId={listing.id} variant="full" />
            <ReportButton target={{ listingId: listing.id }} />
          </div>
        )}
      </section>

      <aside className="rounded-card border border-tag bg-tag-50 p-4 text-sm text-ink">
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
    <p className="flex items-center justify-between gap-2 rounded-field bg-paper px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono font-semibold break-all text-ink select-all">{value}</span>
    </p>
  )
}

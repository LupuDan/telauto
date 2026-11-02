import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TrustField } from '../../lib/categories'

/**
 * "IMEI indicat" / "VIN indicat": green tick and text, thin green outline (plan de design, section 5).
 * The wording is exact: the site does not check the value, it only shows that the seller entered it.
 */
export function TrustBadge({ field }: { field: TrustField }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success px-2 py-0.5 type-micro text-success">
      <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      {field === 'imei' ? t('listing.imeiBadge') : t('listing.vinBadge')}
    </span>
  )
}

export function TrustBadges({ fields, className = '' }: { fields: readonly TrustField[]; className?: string }) {
  if (fields.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {fields.map((field) => (
        <TrustBadge key={field} field={field} />
      ))}
    </div>
  )
}

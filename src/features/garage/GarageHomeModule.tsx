import { Car } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClass } from '../../components/ui/buttonStyles'
import { useAuth } from '../auth/authContext'
import { compatiblePartsHref, useVehicles, vehicleTitle } from './api'

/**
 * "Garajul meu" panel on the home page (homeModule of the auto categories, plan de design 6.1).
 * Same shape as every category module: white panel, title, one sentence, one button.
 * With a car in the garage it shows the car and "Vezi piesele potrivite".
 */
export function GarageHomeModule() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const vehicles = useVehicles()
  const car = vehicles.data?.[0]
  const carName = car ? vehicleTitle(car, t('listingForm.compatibilityAllModels')) : ''

  return (
    <section
      aria-labelledby="garage-module-heading"
      className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
        <Car aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="garage-module-heading" className="type-h2 text-ink">
          {t('garage.moduleTitle')}
        </h2>
        <p className="mt-0.5 text-muted">
          {car ? t('garage.moduleWithCar', { car: carName }) : t('garage.moduleEmpty')}
        </p>
      </div>
      {car ? (
        <Link to={compatiblePartsHref(car)} className={buttonClass('primary')}>
          {t('garage.seeMatchingParts')}
        </Link>
      ) : (
        <Link to={user ? '/account/garage' : '/login?next=%2Faccount%2Fgarage'} className={buttonClass('secondary')}>
          {t('garage.addCar')}
        </Link>
      )}
    </section>
  )
}

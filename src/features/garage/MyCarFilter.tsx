import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { inputClass } from '../../components/ui/fieldStyles'
import { useAuth } from '../auth/authContext'
import type { SearchFilters } from '../search/filters'
import { useVehicles, vehicleTitle, type Vehicle } from './api'

/**
 * "Doar piese pentru mașina mea" above the auto parts results (plan, section 7).
 * Shown only to logged-in users who have cars in "Garajul meu".
 */
export function MyCarFilter({
  filters,
  onChange,
}: {
  filters: SearchFilters
  onChange: (vehicle: Vehicle | null) => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const vehicles = useVehicles()
  const id = useId()

  if (!user || !vehicles.data || vehicles.data.length === 0) return null

  const allModels = t('listingForm.compatibilityAllModels')
  const selected = vehicles.data.find(
    (vehicle) =>
      String(vehicle.makeId) === filters.compatMake &&
      (vehicle.modelId === null ? '' : String(vehicle.modelId)) === filters.compatModel &&
      String(vehicle.year) === filters.compatYear,
  )

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3 sm:flex-row sm:items-center">
      <label htmlFor={id} className="text-sm font-semibold text-brand-800">
        <span aria-hidden="true">🚗 </span>
        {t('garage.onlyMyCar')}
      </label>
      <select
        id={id}
        value={selected?.id ?? ''}
        onChange={(event) => onChange(vehicles.data.find((vehicle) => vehicle.id === event.target.value) ?? null)}
        className={`${inputClass(false)} sm:w-auto sm:flex-1`}
      >
        <option value="">{t('garage.allParts')}</option>
        {vehicles.data.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.label ? `${vehicle.label} – ` : ''}
            {vehicleTitle(vehicle, allModels)}
          </option>
        ))}
      </select>
      <Link to="/account?tab=garage" className="text-sm font-semibold text-brand-700 hover:underline">
        {t('garage.manage')}
      </Link>
    </div>
  )
}

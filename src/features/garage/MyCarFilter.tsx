import { Car } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { inputClass } from '../../components/ui/fieldStyles'
import { useAuth } from '../auth/authContext'
import type { SearchFilters } from '../search/filters'
import { useVehicles, vehicleTitle, type Vehicle } from './api'

/**
 * "Doar pentru mașina mea" above the auto parts results (plan de design, 6.2): a switch plus the
 * choice of the car from the garage. When on, the panel is pale blue and the car's name is visible.
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
  const active = Boolean(selected)
  const name = (vehicle: Vehicle) => `${vehicle.label ? `${vehicle.label} – ` : ''}${vehicleTitle(vehicle, allModels)}`

  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-3 sm:flex-row sm:items-center ${
        active ? 'border-brand-100 bg-brand-50' : 'border-line bg-surface'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={active}
        id={`${id}-switch`}
        onClick={() => onChange(active ? null : vehicles.data[0])}
        className="flex min-h-11 items-center gap-3 text-left"
      >
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? 'bg-brand' : 'bg-line-strong'}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
              active ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-medium text-ink">{t('garage.onlyMyCar')}</span>
          {selected && (
            <span className="flex items-center gap-1 text-sm text-brand">
              <Car aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{name(selected)}</span>
            </span>
          )}
        </span>
      </button>

      {vehicles.data.length > 1 && (
        <>
          <label htmlFor={`${id}-car`} className="sr-only">
            {t('garage.moduleTitle')}
          </label>
          <select
            id={`${id}-car`}
            value={selected?.id ?? ''}
            onChange={(event) => onChange(vehicles.data.find((vehicle) => vehicle.id === event.target.value) ?? null)}
            className={inputClass(false, 'w-full sm:ml-auto sm:w-auto sm:max-w-xs')}
          >
            <option value="">{t('garage.allParts')}</option>
            {vehicles.data.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {name(vehicle)}
              </option>
            ))}
          </select>
        </>
      )}
      <Link
        to="/account/garage"
        className={`inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline ${
          vehicles.data.length > 1 ? '' : 'sm:ml-auto'
        }`}
      >
        {t('garage.manage')}
      </Link>
    </div>
  )
}

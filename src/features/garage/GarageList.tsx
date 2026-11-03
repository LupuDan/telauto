import { zodResolver } from '@hookform/resolvers/zod'
import { Car, Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'
import { CategoryIcon } from '../../components/CategoryIcon'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { SelectField } from '../../components/ui/SelectField'
import { Sheet } from '../../components/ui/Sheet'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
import { categoryBySlug } from '../../lib/categories'
import { isValidYear, MIN_YEAR, maxYear } from '../../lib/validators'
import { errorToKey } from '../auth/authErrors'
import { useReferenceOptions } from '../reference/hooks'
import {
  compatiblePartsHref,
  MAX_VEHICLES,
  useDeleteVehicle,
  useSaveVehicle,
  useVehicles,
  vehicleTitle,
  type Vehicle,
} from './api'

const vehicleSchema = z.object({
  makeId: z.string().regex(/^\d+$/, 'validation.required'),
  modelId: z.string(),
  year: z.string().refine((value) => isValidYear(Number(value)), 'validation.year'),
})
type VehicleFormValues = z.infer<typeof vehicleSchema>

/**
 * "Contul meu → Garajul meu" (plan de design, 6.6): the saved cars as 56 px rows (category icon,
 * make, model, year), each with "Vezi piesele potrivite"; "⋯" opens "Editează" and "Șterge".
 * "Adaugă o mașină" opens a panel from the bottom with three fields: make, model and year.
 */
export function GarageList() {
  const { t } = useTranslation()
  const vehicles = useVehicles()
  const remove = useDeleteVehicle()
  const [editing, setEditing] = useState<Vehicle | 'new' | null>(null)
  const [actionsFor, setActionsFor] = useState<Vehicle | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const autoIcon = categoryBySlug('autovehicule')?.icon

  if (vehicles.isPending) return <LoadingState />
  if (vehicles.isError) return <ErrorState error={vehicles.error} onRetry={() => void vehicles.refetch()} />

  const list = vehicles.data
  const allModels = t('listingForm.compatibilityAllModels')
  const closeActions = () => {
    setActionsFor(null)
    setConfirmDelete(false)
    remove.reset()
  }

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <EmptyState
          text={t('garage.moduleEmpty')}
          action={
            <Button onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
              {t('garage.addCar')}
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-muted">{t('garage.intro')}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {list.map((vehicle) => {
              const title = vehicleTitle(vehicle, allModels)
              return (
                <li key={vehicle.id} className="flex min-h-14 items-center gap-3 py-1 pr-1 pl-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
                    {autoIcon ? (
                      <CategoryIcon name={autoIcon} className="size-5" />
                    ) : (
                      <Car aria-hidden="true" className="size-5" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{title}</p>
                    {/* user text: plain text */}
                    {vehicle.label && <p className="truncate text-sm text-muted">{vehicle.label}</p>}
                    <Link
                      to={compatiblePartsHref(vehicle)}
                      className="inline-flex min-h-9 items-center text-sm font-medium text-brand hover:underline"
                    >
                      {t('garage.seeMatchingParts')}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionsFor(vehicle)}
                    aria-label={t('garage.actionsFor', { car: title })}
                    className="flex size-11 shrink-0 items-center justify-center rounded-field text-ink hover:bg-paper"
                  >
                    <Ellipsis aria-hidden="true" className="size-5" strokeWidth={2} />
                  </button>
                </li>
              )
            })}
          </ul>
          {list.length < MAX_VEHICLES ? (
            <Button variant="secondary" onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
              {t('garage.addCar')}
            </Button>
          ) : (
            <Alert kind="info">{t('errors.garageLimit')}</Alert>
          )}
        </>
      )}

      {/* "⋯": Editează / Șterge (deleting asks once more, inside the same panel) */}
      <Sheet open={actionsFor !== null} onClose={closeActions} title={actionsFor ? vehicleTitle(actionsFor, allModels) : ''}>
        {actionsFor &&
          (confirmDelete ? (
            <div className="space-y-4">
              <p className="text-ink">{t('garage.deleteConfirm')}</p>
              {remove.isError && <Alert kind="error">{translateKey(t, errorToKey(remove.error))}</Alert>}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="danger"
                  fullWidth
                  loading={remove.isPending}
                  onClick={() => remove.mutate(actionsFor.id, { onSuccess: closeActions })}
                >
                  {t('myListings.deleteYes')}
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
                  {t('myListings.deleteNo')}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="-mx-4 -my-4 divide-y divide-line">
              <li>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-ink hover:bg-paper"
                  onClick={() => {
                    const vehicle = actionsFor
                    closeActions()
                    setEditing(vehicle)
                  }}
                >
                  <Pencil aria-hidden="true" className="size-5 text-muted" strokeWidth={1.75} />
                  {t('myListings.edit')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-danger hover:bg-paper"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  {t('myListings.delete')}
                </button>
              </li>
            </ul>
          ))}
      </Sheet>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing && editing !== 'new' ? t('garage.editTitle') : t('garage.addTitle')}
      >
        {editing && (
          <VehicleForm
            key={editing === 'new' ? 'new' : editing.id}
            vehicle={editing === 'new' ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  )
}

function VehicleForm({ vehicle, onDone }: { vehicle?: Vehicle; onDone: () => void }) {
  const { t } = useTranslation()
  const save = useSaveVehicle()
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      makeId: vehicle ? String(vehicle.makeId) : '',
      modelId: vehicle?.modelId ? String(vehicle.modelId) : '',
      year: vehicle ? String(vehicle.year) : '',
    },
  })
  const makeId = useWatch({ control, name: 'makeId' })
  const makes = useReferenceOptions('vehicleMake')
  const models = useReferenceOptions('vehicleModel', /^\d+$/.test(makeId) ? Number(makeId) : null)
  const err = (message?: string) => (message ? translateKey(t, message) : undefined)

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      {
        id: vehicle?.id,
        input: {
          makeId: Number(values.makeId),
          modelId: values.modelId ? Number(values.modelId) : null,
          year: Number(values.year),
          // the form has three fields (plan 6.6); a name given earlier is kept as it was
          label: vehicle?.label ?? '',
        },
      },
      { onSuccess: onDone },
    ),
  )

  const makeField = register('makeId')

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {save.isError && <Alert kind="error">{translateKey(t, errorToKey(save.error))}</Alert>}

      <SelectField
        label={t('listingForm.compatibilityMake')}
        error={err(errors.makeId?.message)}
        {...makeField}
        onChange={(event) => {
          void makeField.onChange(event)
          setValue('modelId', '')
        }}
      >
        <option value="">{t('listingForm.choose')}</option>
        {makes.data?.map((make) => (
          <option key={make.id} value={String(make.id)}>
            {make.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={t('listingForm.compatibilityModel')}
        disabled={!makeId}
        {...register('modelId')}
      >
        <option value="">{makeId ? t('listingForm.compatibilityAllModels') : t('listingForm.chooseParentFirst')}</option>
        {models.data?.map((model) => (
          <option key={model.id} value={String(model.id)}>
            {model.name}
          </option>
        ))}
      </SelectField>
      <p className="-mt-2 text-sm text-muted">{t('garage.modelHint')}</p>
      <TextField
        label={t('garage.year')}
        inputMode="numeric"
        maxLength={4}
        placeholder={`${MIN_YEAR}–${maxYear()}`}
        error={err(errors.year?.message)}
        {...register('year')}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="submit" fullWidth loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" fullWidth onClick={onDone}>
          {t('garage.cancel')}
        </Button>
      </div>
    </form>
  )
}

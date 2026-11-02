import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
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
  label: z.string().trim().max(40, 'validation.tooLong'),
})
type VehicleFormValues = z.infer<typeof vehicleSchema>

/** "Contul meu → Garajul meu": cars of the user, used by the "Only parts for my car" filter. */
export function GarageList() {
  const { t } = useTranslation()
  const vehicles = useVehicles()
  const remove = useDeleteVehicle()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (vehicles.isPending) return <LoadingState />
  if (vehicles.isError) return <ErrorState error={vehicles.error} onRetry={() => void vehicles.refetch()} />

  const list = vehicles.data
  const allModels = t('listingForm.compatibilityAllModels')

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{t('garage.intro')}</p>
      {remove.isError && <Alert kind="error">{translateKey(t, errorToKey(remove.error))}</Alert>}

      {list.length === 0 && editing !== 'new' && (
        <p className="rounded-card border border-dashed border-line-strong bg-surface p-6 text-center text-slate-500">
          {t('garage.empty')}
        </p>
      )}

      {list.length > 0 && (
        <ul className="space-y-3">
          {list.map((vehicle) =>
            editing === vehicle.id ? (
              <li key={vehicle.id}>
                <VehicleForm vehicle={vehicle} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={vehicle.id} className="rounded-card border border-line bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* user text: plain text */}
                    {vehicle.label && <p className="truncate text-sm text-slate-500">{vehicle.label}</p>}
                    <p className="font-semibold text-ink">
                      <span aria-hidden="true">🚗 </span>
                      {vehicleTitle(vehicle, allModels)}
                    </p>
                  </div>
                  <Link
                    to={compatiblePartsHref(vehicle)}
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    {t('garage.showParts')}
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {confirmDelete === vehicle.id ? (
                    <>
                      <span className="self-center text-sm text-slate-700">{t('garage.deleteConfirm')}</span>
                      <Button
                        variant="danger"
                        loading={remove.isPending}
                        onClick={() => remove.mutate(vehicle.id, { onSuccess: () => setConfirmDelete(null) })}
                      >
                        {t('myListings.deleteYes')}
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                        {t('myListings.deleteNo')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => setEditing(vehicle.id)}>
                        {t('myListings.edit')}
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmDelete(vehicle.id)}>
                        {t('myListings.delete')}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === 'new' ? (
        <VehicleForm onDone={() => setEditing(null)} />
      ) : list.length < MAX_VEHICLES ? (
        <Button onClick={() => setEditing('new')}>+ {t('garage.add')}</Button>
      ) : (
        <Alert kind="info">{t('errors.garageLimit')}</Alert>
      )}
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
      label: vehicle?.label ?? '',
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
          label: values.label,
        },
      },
      { onSuccess: onDone },
    ),
  )

  const makeField = register('makeId')

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-card border border-brand-100 bg-brand-50/40 p-4"
      aria-label={vehicle ? t('garage.editTitle') : t('garage.addTitle')}
    >
      <h2 className="font-semibold">{vehicle ? t('garage.editTitle') : t('garage.addTitle')}</h2>
      {save.isError && <Alert kind="error">{translateKey(t, errorToKey(save.error))}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={`${t('listingForm.compatibilityMake')} *`}
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
        <SelectField label={t('listingForm.compatibilityModel')} disabled={!makeId} {...register('modelId')}>
          <option value="">
            {makeId ? t('listingForm.compatibilityAllModels') : t('listingForm.chooseParentFirst')}
          </option>
          {models.data?.map((model) => (
            <option key={model.id} value={String(model.id)}>
              {model.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label={`${t('garage.year')} *`}
          inputMode="numeric"
          maxLength={4}
          placeholder={`${MIN_YEAR}–${maxYear()}`}
          error={err(errors.year?.message)}
          {...register('year')}
        />
        <TextField
          label={t('garage.label')}
          hint={t('garage.labelHint')}
          maxLength={40}
          error={err(errors.label?.message)}
          {...register('label')}
        />
      </div>
      <p className="text-xs text-slate-500">{t('garage.modelHint')}</p>

      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('garage.cancel')}
        </Button>
      </div>
    </form>
  )
}

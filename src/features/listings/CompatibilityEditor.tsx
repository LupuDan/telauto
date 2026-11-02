import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
import { MIN_YEAR, maxYear } from '../../lib/validators'
import { useReferenceOptions } from '../reference/hooks'
import { EMPTY_COMPATIBILITY, type ListingFormValues } from './schema'

const MAX_ROWS = 20

/** Auto parts: which cars the part fits (make, optional model, years). At least one row is required. */
export function CompatibilityEditor() {
  const { t } = useTranslation()
  const {
    control,
    formState: { errors },
  } = useFormContext<ListingFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'compatibility' })

  const listError = errors.compatibility?.message ?? errors.compatibility?.root?.message

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-base font-semibold">{t('listingForm.compatibilityTitle')} *</legend>
      <p className="text-sm text-muted">{t('listingForm.compatibilityHint')}</p>
      {listError && <Alert kind="error">{translateKey(t, listError)}</Alert>}

      {fields.map((row, index) => (
        <CompatibilityRow key={row.id} index={index} onRemove={() => remove(index)} />
      ))}

      {fields.length < MAX_ROWS && (
        <Button
          variant="secondary"
          onClick={() => append({ ...EMPTY_COMPATIBILITY, yearTo: String(maxYear() - 1) })}
        >
          + {t('listingForm.compatibilityAdd')}
        </Button>
      )}
    </fieldset>
  )
}

function CompatibilityRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { t } = useTranslation()
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<ListingFormValues>()
  const makeId = useWatch({ control, name: `compatibility.${index}.makeId` })
  const makes = useReferenceOptions('vehicleMake')
  const models = useReferenceOptions('vehicleModel', /^\d+$/.test(makeId) ? Number(makeId) : null)
  const rowErrors = errors.compatibility?.[index]
  const err = (message?: string) => (message ? translateKey(t, message) : undefined)

  return (
    <div className="rounded-field border border-line bg-paper p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem_6rem]">
        <SelectField
          label={t('listingForm.compatibilityMake')}
          error={err(rowErrors?.makeId?.message)}
          {...register(`compatibility.${index}.makeId`, {
            onChange: () => setValue(`compatibility.${index}.modelId`, ''),
          })}
        >
          <option value="">{t('listingForm.choose')}</option>
          {(makes.data ?? []).map((make) => (
            <option key={make.id} value={String(make.id)}>
              {make.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('listingForm.compatibilityModel')}
          disabled={!makeId}
          {...register(`compatibility.${index}.modelId`)}
        >
          <option value="">{t('listingForm.compatibilityAllModels')}</option>
          {(models.data ?? []).map((model) => (
            <option key={model.id} value={String(model.id)}>
              {model.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('listingForm.compatibilityYearFrom')}
          inputMode="numeric"
          placeholder={String(MIN_YEAR + 50)}
          error={err(rowErrors?.yearFrom?.message)}
          {...register(`compatibility.${index}.yearFrom`)}
        />
        <TextField
          label={t('listingForm.compatibilityYearTo')}
          inputMode="numeric"
          error={err(rowErrors?.yearTo?.message)}
          {...register(`compatibility.${index}.yearTo`)}
        />
      </div>
      <div className="mt-2 text-right">
        <Button variant="ghost" onClick={onRemove} className="text-danger">
          {t('listingForm.compatibilityRemove')}
        </Button>
      </div>
    </div>
  )
}

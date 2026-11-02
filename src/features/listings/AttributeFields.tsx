import { useEffect } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ChipGroup } from '../../components/ui/ChipGroup'
import { Combobox } from '../../components/ui/Combobox'
import { FieldError, FieldLabel } from '../../components/ui/FieldMessage'
import { inputClass } from '../../components/ui/fieldStyles'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
import {
  isFieldVisible,
  OTHER_VALUE,
  type CategoryConfig,
  type FieldDef,
  type ReferenceFieldDef,
} from '../../lib/categories'
import { formatNumber } from '../../lib/format'
import { maxYear } from '../../lib/validators'
import { useReferenceOptions } from '../reference/hooks'
import type { ListingFormValues } from './schema'

/** Lists with at most this many options are pressable pills (plan de design, section 5: ChipGroup). */
const MAX_CHIPS = 5

/**
 * The category-specific fields, generated from src/lib/categories.ts (plan de design, 6.4):
 * required fields have no asterisk, optional ones get "(opțional)" after the label.
 */
export function AttributeFields({ category }: { category: CategoryConfig }) {
  const { control } = useFormContext<ListingFormValues>()
  const values = useWatch({ control, name: 'attributes' }) ?? {}

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {category.fields
        .filter((field) => isFieldVisible(field, values))
        .map((field) => (
          <div key={field.key} className={wide(field) ? 'sm:col-span-2' : undefined}>
            <AttributeField field={field} category={category} />
          </div>
        ))}
    </div>
  )
}

/** Pills and long texts take the whole row. */
function wide(field: FieldDef) {
  return (
    field.type === 'textarea' ||
    field.type === 'yesno' ||
    (field.type === 'select' && field.options.length <= MAX_CHIPS)
  )
}

function useAttributeError(key: string) {
  const { t } = useTranslation()
  const {
    formState: { errors },
  } = useFormContext<ListingFormValues>()
  const message = (errors.attributes as Record<string, { message?: string }> | undefined)?.[key]?.message
  return message ? translateKey(t, message) : undefined
}

/** "Kilometraj (km)" -> "Kilometraj": the unit is shown inside the field. */
function fieldLabel(t: ReturnType<typeof useTranslation>['t'], field: FieldDef) {
  const label = translateKey(t, `fields.${field.key}.label`)
  return field.type === 'number' && field.unit ? label.replace(/\s*\([^)]*\)$/, '') : label
}

function AttributeField({ field, category }: { field: FieldDef; category: CategoryConfig }) {
  const { t, i18n } = useTranslation()
  const { register, control } = useFormContext<ListingFormValues>()
  const error = useAttributeError(field.key)
  const name = `attributes.${field.key}` as const
  const label = fieldLabel(t, field)
  const optional = !field.required

  switch (field.type) {
    case 'reference':
      return <ReferenceField field={field} category={category} />

    case 'select':
    case 'yesno': {
      const options =
        field.type === 'select'
          ? field.options.map((option) => ({
              value: option,
              label: translateKey(t, `fields.${field.key}.options.${option}`),
            }))
          : [
              { value: 'yes', label: t('common.yes') },
              { value: 'no', label: t('common.no') },
            ]
      if (options.length <= MAX_CHIPS) {
        return (
          <Controller
            control={control}
            name={name}
            render={({ field: input }) => (
              <ChipGroup
                label={label}
                optional={optional}
                options={options}
                value={input.value ?? ''}
                onChange={(next) => input.onChange(String(next))}
                error={error}
              />
            )}
          />
        )
      }
      return (
        <SelectField label={label} optional={optional} error={error} {...register(name)}>
          <option value="">{t('listingForm.choose')}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      )
    }

    case 'number': {
      const max = typeof field.max === 'function' ? field.max() : field.max
      const show = (value: number) => (field.key === 'year' ? String(value) : formatNumber(value, i18n.resolvedLanguage))
      return (
        <TextField
          label={label}
          optional={optional}
          unit={field.unit}
          inputMode={field.integer ? 'numeric' : 'decimal'}
          placeholder={field.key === 'year' ? String(maxYear() - 6) : undefined}
          hint={t('listingForm.rangeHint', { min: show(field.min), max: show(max) })}
          error={error}
          {...register(name)}
        />
      )
    }

    case 'date':
      return <TextField type="date" label={label} optional={optional} error={error} {...register(name)} />

    case 'textarea':
      return (
        <div>
          <FieldLabel htmlFor={`attr-${field.key}`} label={label} optional={optional} />
          <textarea
            id={`attr-${field.key}`}
            rows={4}
            maxLength={field.maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `attr-${field.key}-error` : undefined}
            className={inputClass(Boolean(error))}
            {...register(name)}
          />
          {error && <FieldError id={`attr-${field.key}-error`}>{error}</FieldError>}
        </div>
      )

    case 'text':
      return <TextField label={label} optional={optional} maxLength={field.maxLength} error={error} {...register(name)} />
  }
}

/** Make / model: list with search; "Altul (scrie)" opens a text box. */
function ReferenceField({ field, category }: { field: ReferenceFieldDef; category: CategoryConfig }) {
  const { t } = useTranslation()
  const { register, setValue, control } = useFormContext<ListingFormValues>()
  const error = useAttributeError(field.key)
  const otherError = useAttributeError(field.otherKey ?? '')

  const parentValue = useWatch({ control, name: `attributes.${field.dependsOn ?? '__none'}` as const }) ?? ''
  const ownValue = useWatch({ control, name: `attributes.${field.key}` as const }) ?? ''
  const parentId = /^\d+$/.test(parentValue) ? Number(parentValue) : null
  const parentIsOther = parentValue === OTHER_VALUE

  const options = useReferenceOptions(field.source, parentId)
  const dependents = category.fields.filter((other) => other.type === 'reference' && other.dependsOn === field.key)

  // the brand/make is "other" -> the model can only be typed in
  const forceOther = Boolean(field.dependsOn && parentIsOther)
  const waitingForParent = Boolean(field.dependsOn && !parentValue)

  useEffect(() => {
    if (forceOther && ownValue !== OTHER_VALUE) {
      setValue(`attributes.${field.key}`, OTHER_VALUE)
    }
  }, [forceOther, ownValue, setValue, field.key])

  return (
    <div className="space-y-3">
      {!forceOther && (
        <Controller
          control={control}
          name={`attributes.${field.key}`}
          render={({ field: input }) => (
            <Combobox
              label={fieldLabel(t, field)}
              optional={!field.required}
              name={input.name}
              value={input.value ?? ''}
              onBlur={input.onBlur}
              onChange={(next) => {
                input.onChange(next)
                for (const dependent of dependents) {
                  setValue(`attributes.${dependent.key}`, '')
                  if (dependent.type === 'reference' && dependent.otherKey) {
                    setValue(`attributes.${dependent.otherKey}`, '')
                  }
                }
              }}
              options={(options.data ?? []).map((option) => ({ value: String(option.id), label: option.name }))}
              extraOption={field.otherKey ? { value: OTHER_VALUE, label: t('listingForm.otherOption') } : undefined}
              placeholder={waitingForParent ? t('listingForm.chooseParentFirst') : t('listingForm.choose')}
              disabled={waitingForParent}
              loading={!waitingForParent && options.isPending}
              error={error}
            />
          )}
        />
      )}

      {field.otherKey && (forceOther || ownValue === OTHER_VALUE) && (
        <TextField
          label={translateKey(t, `fields.${field.otherKey}.label`)}
          maxLength={60}
          error={otherError}
          {...register(`attributes.${field.otherKey}`)}
        />
      )}
    </div>
  )
}

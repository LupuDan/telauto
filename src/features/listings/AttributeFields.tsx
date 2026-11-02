import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { inputClass } from '../../components/ui/fieldStyles'
import { translateKey } from '../../i18n/translate'
import {
  isFieldVisible,
  OTHER_VALUE,
  type CategoryConfig,
  type FieldDef,
  type ReferenceFieldDef,
} from '../../lib/categories'
import { maxYear } from '../../lib/validators'
import { useReferenceOptions } from '../reference/hooks'
import type { ListingFormValues } from './schema'

/** Renders the category-specific fields from src/lib/categories.ts. */
export function AttributeFields({ category }: { category: CategoryConfig }) {
  const { control } = useFormContext<ListingFormValues>()
  const values = useWatch({ control, name: 'attributes' }) ?? {}

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {category.fields
        .filter((field) => isFieldVisible(field, values))
        .map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <AttributeField field={field} category={category} />
          </div>
        ))}
    </div>
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

function fieldLabel(t: ReturnType<typeof useTranslation>['t'], field: FieldDef) {
  const label = translateKey(t, `fields.${field.key}.label`)
  return field.required ? `${label} *` : label
}

function AttributeField({ field, category }: { field: FieldDef; category: CategoryConfig }) {
  const { t } = useTranslation()
  const { register } = useFormContext<ListingFormValues>()
  const error = useAttributeError(field.key)
  const name = `attributes.${field.key}` as const

  switch (field.type) {
    case 'reference':
      return <ReferenceField field={field} category={category} />

    case 'select':
      return (
        <SelectField label={fieldLabel(t, field)} error={error} {...register(name)}>
          <option value="">{t('listingForm.choose')}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {translateKey(t, `fields.${field.key}.options.${option}`)}
            </option>
          ))}
        </SelectField>
      )

    case 'yesno':
      return (
        <SelectField label={fieldLabel(t, field)} error={error} {...register(name)}>
          <option value="">{t('listingForm.notSpecified')}</option>
          <option value="yes">{t('common.yes')}</option>
          <option value="no">{t('common.no')}</option>
        </SelectField>
      )

    case 'number': {
      const max = typeof field.max === 'function' ? field.max() : field.max
      return (
        <TextField
          label={fieldLabel(t, field)}
          inputMode={field.integer ? 'numeric' : 'decimal'}
          placeholder={field.key === 'year' ? String(maxYear() - 6) : undefined}
          hint={t('listingForm.rangeHint', { min: field.min, max })}
          error={error}
          {...register(name)}
        />
      )
    }

    case 'date':
      return <TextField type="date" label={fieldLabel(t, field)} error={error} {...register(name)} />

    case 'textarea':
      return (
        <div>
          <label htmlFor={`attr-${field.key}`} className="mb-1 block text-sm font-medium text-slate-700">
            {fieldLabel(t, field)}
          </label>
          <textarea
            id={`attr-${field.key}`}
            rows={4}
            maxLength={field.maxLength}
            aria-invalid={error ? true : undefined}
            className={inputClass(Boolean(error))}
            {...register(name)}
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>
      )

    case 'text':
      return <TextField label={fieldLabel(t, field)} maxLength={field.maxLength} error={error} {...register(name)} />
  }
}

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

  const { onChange, ...rest } = register(`attributes.${field.key}`, {
    onChange: () => {
      for (const dependent of dependents) {
        setValue(`attributes.${dependent.key}`, '')
        if (dependent.type === 'reference' && dependent.otherKey) setValue(`attributes.${dependent.otherKey}`, '')
      }
    },
  })

  return (
    <div className="space-y-2">
      {forceOther ? null : (
        <SelectField
          label={fieldLabel(t, field)}
          error={error}
          disabled={waitingForParent || options.isPending}
          onChange={onChange}
          {...rest}
        >
          <option value="">
            {waitingForParent
              ? t('listingForm.chooseParentFirst')
              : options.isPending
                ? t('common.loading')
                : t('listingForm.choose')}
          </option>
          {(options.data ?? []).map((option) => (
            <option key={option.id} value={String(option.id)}>
              {option.name}
            </option>
          ))}
          {field.otherKey && <option value={OTHER_VALUE}>{t('listingForm.otherOption')}</option>}
        </SelectField>
      )}

      {field.otherKey && (forceOther || ownValue === OTHER_VALUE) && (
        <TextField
          label={`${translateKey(t, `fields.${field.otherKey}.label`)}${field.required ? ' *' : ''}`}
          maxLength={60}
          error={otherError}
          {...register(`attributes.${field.otherKey}`)}
        />
      )}
    </div>
  )
}

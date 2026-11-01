import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { inputClass } from '../../components/ui/fieldStyles'
import { translateKey } from '../../i18n/translate'
import {
  CATEGORY_SLUGS,
  type CategoryConfig,
  type FieldDef,
  type ReferenceSource,
} from '../../lib/categories'
import { localizedName } from '../../lib/format'
import { MIN_YEAR, maxYear } from '../../lib/validators'
import { useLocalities, useReferenceOptions } from '../reference/hooks'
import { EMPTY_FILTERS, filterableFields, type SearchFilters } from './filters'

type FilterPanelProps = {
  category: CategoryConfig | undefined
  filters: SearchFilters
  /** categorySlug is only set on the all-categories search page when a category is chosen */
  onApply: (filters: SearchFilters, categorySlug?: string) => void
  onClose?: () => void
}

/**
 * General filters + the filters of the category (generated from src/lib/categories.ts).
 * Changes are kept locally until "Show results" is pressed, so the page does not reload on every keystroke.
 */
export function FilterPanel({ category, filters, onApply, onClose }: FilterPanelProps) {
  const { t, i18n } = useTranslation()
  const localities = useLocalities()
  const [draft, setDraft] = useState<SearchFilters>(filters)
  const [categorySlug, setCategorySlug] = useState('')

  const set = (patch: Partial<SearchFilters>) => setDraft((current) => ({ ...current, ...patch }))

  function setAttribute(field: FieldDef, value: string) {
    setDraft((current) => {
      const attributes = { ...current.attributes }
      if (value) attributes[field.key] = value
      else delete attributes[field.key]
      // changing the brand/make clears the model
      for (const child of filterableFields(category)) {
        if (child.type === 'reference' && child.dependsOn === field.key) delete attributes[child.key]
      }
      return { ...current, attributes }
    })
  }

  function setRange(key: string, bound: 'min' | 'max', value: string) {
    setDraft((current) => {
      const range = { ...(current.ranges[key] ?? { min: '', max: '' }), [bound]: value }
      const ranges = { ...current.ranges }
      if (range.min || range.max) ranges[key] = range
      else delete ranges[key]
      return { ...current, ranges }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({ ...draft, page: 1 }, categorySlug || undefined)
  }

  function handleReset() {
    const empty = { ...EMPTY_FILTERS, q: draft.q, sort: draft.sort }
    setDraft(empty)
    setCategorySlug('')
    onApply(empty)
  }

  const conditionGroup = category?.conditionLabels ?? 'default'

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('search.filtersTitle')}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('search.filtersTitle')}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-lg text-2xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={t('search.closeFilters')}
          >
            ×
          </button>
        )}
      </div>

      <TextInput
        label={t('search.keywords')}
        value={draft.q}
        maxLength={100}
        type="search"
        onChange={(q) => set({ q })}
      />

      {!category && (
        <SelectField
          label={t('search.category')}
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
        >
          <option value="">{t('search.allCategories')}</option>
          {CATEGORY_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {t(`categories.${slug}`)}
            </option>
          ))}
        </SelectField>
      )}

      <SelectField
        label={t('listingForm.locality')}
        value={draft.locality}
        onChange={(event) => set({ locality: event.target.value })}
      >
        <option value="">{t('search.allLocalities')}</option>
        {localities.data?.map((locality) => (
          <option key={locality.id} value={String(locality.id)}>
            {localizedName(locality, i18n.resolvedLanguage)}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={t('listingForm.condition')}
        value={draft.condition}
        onChange={(event) => set({ condition: event.target.value })}
      >
        <option value="">{t('search.any')}</option>
        <option value="new">{t(`listingForm.conditionOptions.${conditionGroup}.new`)}</option>
        <option value="used">{t(`listingForm.conditionOptions.${conditionGroup}.used`)}</option>
      </SelectField>

      {/* "from" and "to" share the width; the currency is a small MDL | EUR switch next to the title */}
      <fieldset>
        <div className="mb-1 flex items-center justify-between gap-2">
          <legend className="text-sm font-medium text-slate-700">{t('listingForm.price')}</legend>
          <div role="group" aria-label={t('listingForm.currency')} className="flex rounded-lg border border-slate-300 p-0.5">
            {(['MDL', 'EUR'] as const).map((currency) => (
              <button
                key={currency}
                type="button"
                aria-pressed={draft.currency === currency}
                onClick={() => set({ currency })}
                className={`rounded-md px-2 py-0.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  draft.currency === currency ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <RangeInputs
            label={`${t('listingForm.price')} (${draft.currency})`}
            min={draft.priceMin}
            max={draft.priceMax}
            decimal
            onChange={(bound, value) => set(bound === 'min' ? { priceMin: value } : { priceMax: value })}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">{t('search.priceHint')}</p>
      </fieldset>

      {filterableFields(category).map((field) =>
        field.filter === 'range' ? (
          <fieldset key={field.key}>
            <legend className="mb-1 block text-sm font-medium text-slate-700">
              {translateKey(t, `fields.${field.key}.label`)}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <RangeInputs
                label={translateKey(t, `fields.${field.key}.label`)}
                min={draft.ranges[field.key]?.min ?? ''}
                max={draft.ranges[field.key]?.max ?? ''}
                decimal={field.type === 'number' && !field.integer}
                onChange={(bound, value) => setRange(field.key, bound, value)}
              />
            </div>
          </fieldset>
        ) : (
          <ChoiceFilter
            key={field.key}
            field={field}
            value={draft.attributes[field.key] ?? ''}
            parentValue={
              field.type === 'reference' && field.dependsOn ? (draft.attributes[field.dependsOn] ?? '') : undefined
            }
            onChange={(value) => setAttribute(field, value)}
          />
        ),
      )}

      {category?.hasCompatibility && (
        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold text-slate-700">{t('search.compatibleWith')}</legend>
          <ReferenceSelect
            label={t('listingForm.compatibilityMake')}
            source="vehicleMake"
            value={draft.compatMake}
            emptyLabel={t('search.any')}
            onChange={(compatMake) => set({ compatMake, compatModel: '', compatYear: compatMake ? draft.compatYear : '' })}
          />
          <ReferenceSelect
            label={t('listingForm.compatibilityModel')}
            source="vehicleModel"
            parentValue={draft.compatMake}
            value={draft.compatModel}
            emptyLabel={t('listingForm.compatibilityAllModels')}
            onChange={(compatModel) => set({ compatModel })}
          />
          <TextInput
            label={t('search.compatibleYear')}
            value={draft.compatYear}
            inputMode="numeric"
            maxLength={4}
            disabled={!draft.compatMake}
            placeholder={`${MIN_YEAR}–${maxYear()}`}
            onChange={(compatYear) => set({ compatYear: compatYear.replace(/\D/g, '') })}
          />
        </fieldset>
      )}

      {/* -bottom-4 + pb-4: the bar also covers the bottom padding of the scrolling panel */}
      <div className="sticky -bottom-4 flex gap-2 bg-surface pt-2 pb-4">
        <Button type="submit" className="flex-1">
          {t('search.apply')}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          {t('search.reset')}
        </Button>
      </div>
    </form>
  )
}

function TextInput({
  label,
  onChange,
  ...rest
}: { label: string; onChange: (value: string) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange'
>) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input id={id} className={inputClass(false)} onChange={(event) => onChange(event.target.value)} {...rest} />
    </div>
  )
}

function RangeInputs({
  label,
  min,
  max,
  decimal = false,
  onChange,
}: {
  label: string
  min: string
  max: string
  decimal?: boolean
  onChange: (bound: 'min' | 'max', value: string) => void
}) {
  const { t } = useTranslation()
  const clean = (value: string) => value.replace(decimal ? /[^\d.,\s]/g : /[^\d\s]/g, '')
  return (
    <>
      <input
        aria-label={`${label}: ${t('search.from')}`}
        placeholder={t('search.from')}
        inputMode={decimal ? 'decimal' : 'numeric'}
        maxLength={12}
        value={min}
        onChange={(event) => onChange('min', clean(event.target.value))}
        className={`${inputClass(false)} min-w-0`}
      />
      <input
        aria-label={`${label}: ${t('search.to')}`}
        placeholder={t('search.to')}
        inputMode={decimal ? 'decimal' : 'numeric'}
        maxLength={12}
        value={max}
        onChange={(event) => onChange('max', clean(event.target.value))}
        className={`${inputClass(false)} min-w-0`}
      />
    </>
  )
}

function ChoiceFilter({
  field,
  value,
  parentValue,
  onChange,
}: {
  field: FieldDef
  value: string
  parentValue?: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const label = translateKey(t, `fields.${field.key}.label`)

  if (field.type === 'reference') {
    return (
      <ReferenceSelect
        label={label}
        source={field.source}
        parentValue={field.dependsOn ? parentValue : undefined}
        value={value}
        emptyLabel={t('search.any')}
        onChange={onChange}
      />
    )
  }

  return (
    <SelectField label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{t('search.any')}</option>
      {field.type === 'select' &&
        field.options.map((option) => (
          <option key={option} value={option}>
            {translateKey(t, `fields.${field.key}.options.${option}`)}
          </option>
        ))}
      {field.type === 'yesno' && (
        <>
          <option value="yes">{t('common.yes')}</option>
          <option value="no">{t('common.no')}</option>
        </>
      )}
    </SelectField>
  )
}

function ReferenceSelect({
  label,
  source,
  parentValue,
  value,
  emptyLabel,
  onChange,
}: {
  label: string
  source: ReferenceSource
  /** set for models: the chosen brand/make ('' = none chosen yet) */
  parentValue?: string
  value: string
  emptyLabel: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const needsParent = parentValue !== undefined
  const parentId = needsParent && parentValue ? Number(parentValue) : null
  const options = useReferenceOptions(source, parentId)
  const waitingForParent = needsParent && !parentValue

  return (
    <SelectField
      label={label}
      value={value}
      disabled={waitingForParent}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{waitingForParent ? t('listingForm.chooseParentFirst') : emptyLabel}</option>
      {options.data?.map((option) => (
        <option key={option.id} value={String(option.id)}>
          {option.name}
        </option>
      ))}
    </SelectField>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { ChipGroup } from '../../components/ui/ChipGroup'
import { Combobox } from '../../components/ui/Combobox'
import { RangeInput } from '../../components/ui/RangeInput'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
import { CATEGORY_SLUGS, type CategoryConfig, type FieldDef, type ReferenceSource } from '../../lib/categories'
import { currencyUnit, localizedName } from '../../lib/format'
import { MIN_YEAR, maxYear } from '../../lib/validators'
import { useLocalities, useReferenceOptions } from '../reference/hooks'
import { EMPTY_FILTERS, filterableFields, type SearchFilters } from './filters'

/** Lists with at most this many options are shown as pills (plan de design, section 5: ChipGroup). */
const MAX_CHIPS = 5

type FilterPanelProps = {
  category: CategoryConfig | undefined
  filters: SearchFilters
  /** categorySlug is only set on the all-categories search page when a category is chosen */
  onApply: (filters: SearchFilters, categorySlug?: string) => void
  /** id of the form, so a button outside it (fixed bar of the phone panel) can submit it */
  formId: string
  /** the phone panel shows the number of results of the filters being edited */
  onDraftChange?: (draft: SearchFilters, categorySlug: string) => void
  /** computers: "Aplică" and "Resetează" at the bottom of the column */
  showButtons?: boolean
}

/**
 * General filters + the filters of the category (generated from src/lib/categories.ts).
 * Changes are kept locally until "Aplică" / "Arată N anunțuri" is pressed, so the page does not
 * reload on every keystroke.
 */
export function FilterPanel({ category, filters, onApply, formId, onDraftChange, showButtons = false }: FilterPanelProps) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage
  const localities = useLocalities()
  const [draft, setDraft] = useState<SearchFilters>(filters)
  const [categorySlug, setCategorySlug] = useState('')

  useEffect(() => {
    onDraftChange?.(draft, categorySlug)
  }, [draft, categorySlug, onDraftChange])

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

  function setRange(key: string, range: { from: string; to: string }, decimal: boolean) {
    const clean = (value: string) => value.replace(decimal ? /[^\d.,\s]/g : /[^\d\s]/g, '').slice(0, 12)
    setDraft((current) => {
      const ranges = { ...current.ranges }
      const next = { min: clean(range.from), max: clean(range.to) }
      if (next.min || next.max) ranges[key] = next
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
  const cleanPrice = (value: string) => value.replace(/[^\d.,\s]/g, '').slice(0, 12)

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5" aria-label={t('search.filtersTitle')}>
      <TextField
        label={t('search.keywords')}
        value={draft.q}
        maxLength={100}
        type="search"
        onChange={(event) => set({ q: event.target.value })}
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
            {localizedName(locality, lng)}
          </option>
        ))}
      </SelectField>

      <div>
        <RangeInput
          label={t('listingForm.price')}
          unit={currencyUnit(draft.currency, lng)}
          unitInLabel
          inputMode="decimal"
          from={draft.priceMin}
          to={draft.priceMax}
          onChange={({ from, to }) => set({ priceMin: cleanPrice(from), priceMax: cleanPrice(to) })}
        />
        {/* the currency of the price filter: "lei | €" */}
        <div role="group" aria-label={t('listingForm.currency')} className="mt-2 flex gap-2">
          {(['MDL', 'EUR'] as const).map((currency) => (
            <button
              key={currency}
              type="button"
              aria-pressed={draft.currency === currency}
              onClick={() => set({ currency })}
              className={`min-h-11 min-w-11 rounded-full border px-3 text-sm lg:min-h-9 ${
                draft.currency === currency
                  ? 'border-brand bg-brand-50 font-medium text-brand'
                  : 'border-line-strong text-ink hover:bg-paper'
              }`}
            >
              {currencyUnit(currency, lng)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-sm text-muted">{t('search.priceHint')}</p>
      </div>

      <ChipGroup
        label={t('listingForm.condition')}
        options={[
          { value: 'new', label: t(`listingForm.conditionOptions.${conditionGroup}.new`) },
          { value: 'used', label: t(`listingForm.conditionOptions.${conditionGroup}.used`) },
        ]}
        value={draft.condition}
        onChange={(condition) => set({ condition: String(condition) })}
      />

      {filterableFields(category).map((field) =>
        field.filter === 'range' ? (
          <RangeInput
            key={field.key}
            label={translateKey(t, `fields.${field.key}.label`)}
            unit={field.type === 'number' ? field.unit : undefined}
            unitInLabel
            inputMode={field.type === 'number' && !field.integer ? 'decimal' : 'numeric'}
            from={draft.ranges[field.key]?.min ?? ''}
            to={draft.ranges[field.key]?.max ?? ''}
            onChange={(range) => setRange(field.key, range, field.type === 'number' && !field.integer)}
          />
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
        <fieldset className="space-y-4 rounded-card border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{t('search.compatibleWith')}</legend>
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
          <TextField
            label={t('search.compatibleYear')}
            value={draft.compatYear}
            inputMode="numeric"
            maxLength={4}
            disabled={!draft.compatMake}
            placeholder={`${MIN_YEAR}–${maxYear()}`}
            onChange={(event) => set({ compatYear: event.target.value.replace(/\D/g, '') })}
          />
        </fieldset>
      )}

      {showButtons && (
        <div className="sticky bottom-0 -mx-4 -mb-4 flex gap-2 border-t border-line bg-surface px-4 py-3">
          <Button type="submit" size="compact" className="flex-1">
            {t('search.applyShort')}
          </Button>
          <Button variant="secondary" size="compact" onClick={handleReset}>
            {t('search.reset')}
          </Button>
        </div>
      )}
    </form>
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

  const options =
    field.type === 'select'
      ? field.options.map((option) => ({ value: option, label: translateKey(t, `fields.${field.key}.options.${option}`) }))
      : [
          { value: 'yes', label: t('common.yes') },
          { value: 'no', label: t('common.no') },
        ]

  if (options.length <= MAX_CHIPS) {
    return <ChipGroup label={label} options={options} value={value} onChange={(next) => onChange(String(next))} />
  }

  return (
    <SelectField label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{t('search.any')}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
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
    <Combobox
      label={label}
      value={value}
      onChange={onChange}
      allowEmpty
      disabled={waitingForParent}
      loading={!waitingForParent && options.isPending}
      placeholder={waitingForParent ? t('listingForm.chooseParentFirst') : emptyLabel}
      options={(options.data ?? []).map((option) => ({ value: String(option.id), label: option.name }))}
    />
  )
}

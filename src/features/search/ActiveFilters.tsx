import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { translateKey } from '../../i18n/translate'
import type { CategoryConfig, ReferenceSource } from '../../lib/categories'
import { currencyUnit, formatNumber, localizedName } from '../../lib/format'
import { parseNumber } from '../../lib/validators'
import { useLocalities, useReferenceOptions } from '../reference/hooks'
import { filterableFields, type RangeValue, type SearchFilters } from './filters'

type Chip = { id: string; label: ReactNode; text: string; next: SearchFilters }

/**
 * Active filters as pale blue pills with "×", plus "Șterge filtrele" (plan de design, 6.2).
 * Every pill is a link to the same results without that filter.
 */
export function ActiveFilters({
  filters,
  category,
  hrefFor,
  clearHref,
}: {
  filters: SearchFilters
  category: CategoryConfig | undefined
  hrefFor: (filters: SearchFilters) => string
  clearHref: string
}) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage
  const localities = useLocalities()
  const base = { ...filters, page: 1 }
  const chips: Chip[] = []

  const number = (value: string, group = true) => {
    const parsed = parseNumber(value)
    return Number.isFinite(parsed) && group ? formatNumber(parsed, lng) : value.trim()
  }
  const range = ({ min, max }: RangeValue, unit?: string, group = true) => {
    const text = min && max
      ? `${number(min, group)}–${number(max, group)}`
      : min
        ? `${t('search.from')} ${number(min, group)}`
        : `${t('search.to')} ${number(max, group)}`
    return unit ? `${text} ${unit}` : text
  }

  if (filters.q) chips.push({ id: 'q', label: `„${filters.q}”`, text: filters.q, next: { ...base, q: '' } })
  if (filters.locality) {
    const locality = localities.data?.find((item) => String(item.id) === filters.locality)
    const name = locality ? localizedName(locality, lng) : '…'
    chips.push({ id: 'loc', label: name, text: name, next: { ...base, locality: '' } })
  }
  if (filters.priceMin || filters.priceMax) {
    const text = range({ min: filters.priceMin, max: filters.priceMax }, currencyUnit(filters.currency, lng))
    chips.push({ id: 'price', label: text, text, next: { ...base, priceMin: '', priceMax: '' } })
  }
  if (filters.condition) {
    const text = t(`listingForm.conditionOptions.${category?.conditionLabels ?? 'default'}.${filters.condition as 'new' | 'used'}`)
    chips.push({ id: 'cond', label: text, text, next: { ...base, condition: '' } })
  }

  for (const field of filterableFields(category)) {
    const value = filters.attributes[field.key]
    const fieldLabel = translateKey(t, `fields.${field.key}.label`)
    if (value) {
      const attributes = { ...filters.attributes }
      delete attributes[field.key]
      // removing a brand also removes its model
      for (const child of filterableFields(category)) {
        if (child.type === 'reference' && child.dependsOn === field.key) delete attributes[child.key]
      }
      let label: ReactNode = value
      let text = value
      if (field.type === 'select') label = text = translateKey(t, `fields.${field.key}.options.${value}`)
      else if (field.type === 'yesno') label = text = `${fieldLabel}: ${value === 'yes' ? t('common.yes') : t('common.no')}`
      else if (field.type === 'reference') {
        const parent = field.dependsOn ? filters.attributes[field.dependsOn] : undefined
        label = <ReferenceName source={field.source} id={value} parentId={parent} />
        text = fieldLabel
      }
      chips.push({ id: `a.${field.key}`, label, text, next: { ...base, attributes } })
    }
    const rangeValue = filters.ranges[field.key]
    if (rangeValue) {
      const ranges = { ...filters.ranges }
      delete ranges[field.key]
      const unit = field.type === 'number' ? field.unit : undefined
      const text = range(rangeValue, unit, field.key !== 'year')
      chips.push({ id: `r.${field.key}`, label: text, text: `${fieldLabel} ${text}`, next: { ...base, ranges } })
    }
  }

  if (filters.compatMake) {
    chips.push({
      id: 'compat',
      label: (
        <>
          {t('search.compatibleWith')}: <ReferenceName source="vehicleMake" id={filters.compatMake} />{' '}
          {filters.compatModel && (
            <ReferenceName source="vehicleModel" id={filters.compatModel} parentId={filters.compatMake} />
          )}{' '}
          {filters.compatYear}
        </>
      ),
      text: t('search.compatibleWith'),
      next: { ...base, compatMake: '', compatModel: '', compatYear: '' },
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t('search.activeFilters')} role="group">
      {chips.map((chip) => (
        <Link
          key={chip.id}
          to={hrefFor(chip.next)}
          aria-label={t('search.removeFilter', { name: chip.text })}
          className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-full bg-brand-50 py-1 pr-2 pl-3 text-sm text-brand hover:bg-brand-100 lg:min-h-9"
        >
          <span className="truncate tabular">{chip.label}</span>
          <X aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
        </Link>
      ))}
      <Link to={clearHref} className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-brand hover:underline lg:min-h-9">
        {t('search.clearAll')}
      </Link>
    </div>
  )
}

function ReferenceName({ source, id, parentId }: { source: ReferenceSource; id: string; parentId?: string }) {
  const options = useReferenceOptions(source, parentId ? Number(parentId) : null)
  return <>{options.data?.find((option) => String(option.id) === id)?.name ?? '…'}</>
}

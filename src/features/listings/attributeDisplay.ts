import type { TFunction } from 'i18next'
import { translateKey } from '../../i18n/translate'
import type { CategoryConfig, FieldDef, StoredAttributes } from '../../lib/categories'
import { formatDate, formatNumber } from '../../lib/format'

/**
 * Text for an attribute value (select, yes/no, number, date, text).
 * Reference fields (brand, model) need a lookup and are handled by the components.
 * mode "card" uses the short form from fields.<key>.card when it exists (e.g. "180 000 km").
 */
export function formatAttributeValue(
  t: TFunction,
  field: FieldDef,
  value: StoredAttributes[string] | undefined,
  lng: string | undefined,
  mode: 'details' | 'card' = 'details',
): string | null {
  if (value === undefined || value === null || value === '') return null

  switch (field.type) {
    case 'select': {
      const full = translateKey(t, `fields.${field.key}.options.${String(value)}`)
      // on the card a shorter text may exist: fields.<key>.cardOptions.<value>
      return mode === 'card'
        ? translateKey(t, `fields.${field.key}.cardOptions.${String(value)}`, { defaultValue: full })
        : full
    }
    case 'yesno':
      return value === true ? t('common.yes') : value === false ? t('common.no') : null
    case 'number': {
      if (typeof value !== 'number') return null
      const text = field.key === 'year' ? String(value) : formatNumber(value, lng)
      return mode === 'card'
        ? translateKey(t, `fields.${field.key}.card`, { value: text, defaultValue: text })
        : text
    }
    case 'date':
      return typeof value === 'string' ? formatDate(value, lng) : null
    case 'text':
    case 'textarea':
      return String(value)
    case 'reference':
      return null
  }
}

/** Spec pills of the result card (category keySpecs), e.g. ["2015", "180 000 km", "Motorină"]. */
export function cardFacts(
  t: TFunction,
  category: CategoryConfig,
  attributes: StoredAttributes,
  lng: string | undefined,
): string[] {
  return category.keySpecs
    .map((key) => category.fields.find((field) => field.key === key))
    .map((field) => (field ? formatAttributeValue(t, field, attributes[field.key], lng, 'card') : null))
    .filter((text): text is string => Boolean(text))
}

// Single source of truth for categories and their fields (plan, section 6).
// The listing form (phase 4), search filters and the listing details (phase 5) are all generated
// from this file, so a new category or field is added here without rewriting pages.
//
// Labels: fields.<key>.label, options: fields.<key>.options.<value> in src/i18n/*.json.
// Values are stored in listings.attributes (jsonb); IMEI/VIN in listing_private.

import { isValidYear, MIN_YEAR, maxYear, parseNumber } from './validators'

export const CATEGORY_SLUGS = ['telefoane', 'accesorii-telefoane', 'autovehicule', 'piese-auto'] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export function isCategorySlug(value: unknown): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug)
}

export type ReferenceSource = 'phoneBrand' | 'phoneModel' | 'vehicleMake' | 'vehicleModel'

type BaseField = {
  key: string
  required: boolean
  /** show the field only when another field has a given value */
  showIf?: { key: string; equals: string }
  /** how the field is offered as a search filter (phase 5) */
  filter?: 'select' | 'range' | 'reference'
}

export type SelectFieldDef = BaseField & { type: 'select'; options: readonly string[] }
export type NumberFieldDef = BaseField & {
  type: 'number'
  min: number
  /** function for limits that depend on today's date (e.g. year) */
  max: number | (() => number)
  integer: boolean
}
export type TextFieldDef = BaseField & { type: 'text' | 'textarea'; maxLength: number }
export type YesNoFieldDef = BaseField & { type: 'yesno' }
export type DateFieldDef = BaseField & { type: 'date' }
export type ReferenceFieldDef = BaseField & {
  type: 'reference'
  source: ReferenceSource
  /** key of the parent field (model depends on brand/make) */
  dependsOn?: string
  /** allows "Other" + free text stored under otherKey */
  otherKey?: string
}

export type FieldDef =
  | SelectFieldDef
  | NumberFieldDef
  | TextFieldDef
  | YesNoFieldDef
  | DateFieldDef
  | ReferenceFieldDef

export type CategoryConfig = {
  slug: CategorySlug
  /** categories.id in the database (seed.sql) */
  id: number
  icon: string
  minPhotos: number
  /** translation group for the condition labels (parts: "new / from dismantling") */
  conditionLabels: 'default' | 'parts'
  privateField?: 'imei' | 'vin'
  hasCompatibility: boolean
  fields: readonly FieldDef[]
}

/** Special value of reference selects meaning "not in the list". */
export const OTHER_VALUE = 'other'

export const CATEGORIES: Record<CategorySlug, CategoryConfig> = {
  telefoane: {
    slug: 'telefoane',
    id: 1,
    icon: '📱',
    minPhotos: 3,
    conditionLabels: 'default',
    privateField: 'imei',
    hasCompatibility: false,
    fields: [
      { key: 'brand_id', type: 'reference', source: 'phoneBrand', required: true, filter: 'reference' },
      {
        key: 'model_id',
        type: 'reference',
        source: 'phoneModel',
        dependsOn: 'brand_id',
        otherKey: 'model_other',
        required: true,
        filter: 'reference',
      },
      {
        key: 'storage_gb',
        type: 'select',
        options: ['16', '32', '64', '128', '256', '512', '1024'],
        required: true,
        filter: 'select',
      },
      { key: 'network_lock', type: 'select', options: ['unlocked', 'locked'], required: true, filter: 'select' },
      { key: 'color', type: 'text', maxLength: 30, required: false },
      { key: 'battery_health', type: 'number', min: 1, max: 100, integer: true, required: false, filter: 'range' },
      { key: 'warranty', type: 'yesno', required: false, filter: 'select' },
      { key: 'warranty_until', type: 'date', required: false, showIf: { key: 'warranty', equals: 'yes' } },
    ],
  },
  'accesorii-telefoane': {
    slug: 'accesorii-telefoane',
    id: 2,
    icon: '🎧',
    minPhotos: 1,
    conditionLabels: 'default',
    hasCompatibility: false,
    fields: [
      {
        key: 'accessory_type',
        type: 'select',
        options: ['case', 'charger', 'headphones', 'screen_protector', 'other'],
        required: true,
        filter: 'select',
      },
      { key: 'brand', type: 'text', maxLength: 40, required: false },
      { key: 'compatible_model', type: 'text', maxLength: 60, required: false },
    ],
  },
  autovehicule: {
    slug: 'autovehicule',
    id: 3,
    icon: '🚗',
    minPhotos: 5,
    conditionLabels: 'default',
    privateField: 'vin',
    hasCompatibility: false,
    fields: [
      {
        key: 'make_id',
        type: 'reference',
        source: 'vehicleMake',
        otherKey: 'make_other',
        required: true,
        filter: 'reference',
      },
      {
        key: 'model_id',
        type: 'reference',
        source: 'vehicleModel',
        dependsOn: 'make_id',
        otherKey: 'model_other',
        required: true,
        filter: 'reference',
      },
      { key: 'year', type: 'number', min: MIN_YEAR, max: () => maxYear(), integer: true, required: true, filter: 'range' },
      { key: 'mileage_km', type: 'number', min: 0, max: 2_000_000, integer: true, required: true, filter: 'range' },
      {
        key: 'fuel',
        type: 'select',
        options: ['petrol', 'diesel', 'lpg_petrol', 'hybrid', 'electric'],
        required: true,
        filter: 'select',
      },
      { key: 'transmission', type: 'select', options: ['manual', 'automatic'], required: true, filter: 'select' },
      {
        key: 'body_type',
        type: 'select',
        options: ['sedan', 'hatchback', 'wagon', 'suv', 'minivan', 'coupe', 'cabriolet', 'pickup', 'van'],
        required: true,
        filter: 'select',
      },
      { key: 'steering', type: 'select', options: ['left', 'right'], required: false, filter: 'select' },
      { key: 'engine_volume_l', type: 'number', min: 0.5, max: 10, integer: false, required: false, filter: 'range' },
      { key: 'color', type: 'text', maxLength: 30, required: false },
      { key: 'registered_md', type: 'yesno', required: false, filter: 'select' },
      { key: 'history', type: 'textarea', maxLength: 1000, required: false },
    ],
  },
  'piese-auto': {
    slug: 'piese-auto',
    id: 4,
    icon: '⚙️',
    minPhotos: 1,
    conditionLabels: 'parts',
    hasCompatibility: true,
    fields: [
      {
        key: 'part_type',
        type: 'select',
        options: [
          'engine',
          'transmission',
          'body',
          'suspension',
          'brakes',
          'electrical',
          'interior',
          'wheels_tires',
          'other',
        ],
        required: true,
        filter: 'select',
      },
      { key: 'part_code', type: 'text', maxLength: 60, required: false },
      { key: 'manufacturer', type: 'text', maxLength: 60, required: false },
    ],
  },
}

export const CATEGORY_ICONS: Record<CategorySlug, string> = Object.fromEntries(
  CATEGORY_SLUGS.map((slug) => [slug, CATEGORIES[slug].icon]),
) as Record<CategorySlug, string>

export function categoryBySlug(slug: string | null | undefined): CategoryConfig | undefined {
  return isCategorySlug(slug) ? CATEGORIES[slug] : undefined
}

export function categoryById(id: number): CategoryConfig | undefined {
  return CATEGORY_SLUGS.map((slug) => CATEGORIES[slug]).find((category) => category.id === id)
}

// ---------------------------------------------------------------------------
// Form values <-> stored attributes
// In the form every attribute is a string (that is what <input>/<select> give).
// ---------------------------------------------------------------------------

export type AttributeFormValues = Record<string, string>
export type StoredAttributes = Record<string, string | number | boolean>

export function isFieldVisible(field: FieldDef, values: AttributeFormValues): boolean {
  return !field.showIf || values[field.showIf.key] === field.showIf.equals
}

function fieldMax(field: NumberFieldDef): number {
  return typeof field.max === 'function' ? field.max() : field.max
}

/** Returns { fieldKey: translationKey } for every invalid attribute. */
export function validateAttributes(category: CategoryConfig, values: AttributeFormValues): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of category.fields) {
    if (!isFieldVisible(field, values)) continue
    const raw = (values[field.key] ?? '').trim()

    if (raw === '') {
      if (field.required) errors[field.key] = 'validation.required'
      continue
    }

    switch (field.type) {
      case 'select':
        if (!field.options.includes(raw)) errors[field.key] = 'validation.required'
        break
      case 'yesno':
        if (raw !== 'yes' && raw !== 'no') errors[field.key] = 'validation.required'
        break
      case 'number': {
        const value = parseNumber(raw)
        const max = fieldMax(field)
        if (Number.isNaN(value) || (field.integer && !Number.isInteger(value))) {
          errors[field.key] = field.integer ? 'validation.integer' : 'validation.number'
        } else if (field.key === 'year' ? !isValidYear(value) : value < field.min || value > max) {
          errors[field.key] = 'validation.range'
        }
        break
      }
      case 'text':
      case 'textarea':
        if (raw.length > field.maxLength) errors[field.key] = 'validation.tooLong'
        break
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) errors[field.key] = 'validation.date'
        break
      case 'reference':
        if (raw === OTHER_VALUE) {
          if (!field.otherKey) {
            errors[field.key] = 'validation.required'
          } else {
            const other = (values[field.otherKey] ?? '').trim()
            if (other === '') errors[field.otherKey] = 'validation.required'
            else if (other.length > 60) errors[field.otherKey] = 'validation.tooLong'
          }
        } else if (!/^\d+$/.test(raw)) {
          errors[field.key] = 'validation.required'
        }
        break
    }
  }
  return errors
}

/** Converts valid form values into what is saved in listings.attributes. */
export function buildAttributes(category: CategoryConfig, values: AttributeFormValues): StoredAttributes {
  const result: StoredAttributes = {}
  for (const field of category.fields) {
    if (!isFieldVisible(field, values)) continue
    const raw = (values[field.key] ?? '').trim()
    if (raw === '') continue

    switch (field.type) {
      case 'number':
        result[field.key] = parseNumber(raw)
        break
      case 'yesno':
        result[field.key] = raw === 'yes'
        break
      case 'select':
        // storage_gb is a number so it can be compared in filters
        result[field.key] = field.key === 'storage_gb' ? Number(raw) : raw
        break
      case 'reference':
        if (raw === OTHER_VALUE) {
          if (field.otherKey) result[field.otherKey] = (values[field.otherKey] ?? '').trim()
        } else {
          result[field.key] = Number(raw)
        }
        break
      default:
        result[field.key] = raw
    }
  }
  return result
}

/** Opposite of buildAttributes(), used when editing a listing. */
export function attributesToForm(category: CategoryConfig, stored: StoredAttributes): AttributeFormValues {
  const values: AttributeFormValues = {}
  for (const field of category.fields) {
    const value = stored[field.key]
    if (field.type === 'reference' && field.otherKey && typeof stored[field.otherKey] === 'string') {
      values[field.key] = OTHER_VALUE
      values[field.otherKey] = String(stored[field.otherKey])
    } else if (field.type === 'yesno') {
      values[field.key] = value === true ? 'yes' : value === false ? 'no' : ''
    } else {
      values[field.key] = value === undefined || value === null ? '' : String(value)
    }
  }
  return values
}

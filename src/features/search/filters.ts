// Search filters <-> address (URL) <-> database call.
// Filters live in the address (e.g. #/c/autovehicule?f.fuel=diesel&f.year.min=2010),
// so a search can be shared as a link and the browser "Back" button works.

import type { CategoryConfig, FieldDef } from '../../lib/categories'
import { isValidPrice, isValidYear, parseNumber, parsePrice } from '../../lib/validators'

export const SORT_OPTIONS = ['new', 'cheap', 'expensive'] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export const PAGE_SIZE = 24
const MAX_PAGE = 400

export type RangeValue = { min: string; max: string }

export type SearchFilters = {
  q: string
  locality: string
  condition: string
  priceMin: string
  priceMax: string
  currency: 'MDL' | 'EUR'
  sort: SortOption
  page: number
  /** select / yes-no / reference filters: field key -> value as in the form ("diesel", "yes", "12") */
  attributes: Record<string, string>
  /** number range filters: field key -> { min, max } */
  ranges: Record<string, RangeValue>
  compatMake: string
  compatModel: string
  compatYear: string
}

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  locality: '',
  condition: '',
  priceMin: '',
  priceMax: '',
  currency: 'MDL',
  sort: 'new',
  page: 1,
  attributes: {},
  ranges: {},
  compatMake: '',
  compatModel: '',
  compatYear: '',
}

const DIGITS = /^\d{1,9}$/

export function filterableFields(category: CategoryConfig | undefined): FieldDef[] {
  return category ? category.fields.filter((field) => field.filter) : []
}

function isValidChoice(field: FieldDef, value: string): boolean {
  switch (field.type) {
    case 'select':
      return field.options.includes(value)
    case 'yesno':
      return value === 'yes' || value === 'no'
    case 'reference':
      return DIGITS.test(value)
    default:
      return false
  }
}

function cleanNumber(value: string | null): string {
  if (!value) return ''
  return Number.isFinite(parseNumber(value)) ? value.trim() : ''
}

function cleanPrice(value: string | null): string {
  if (!value) return ''
  return isValidPrice(parsePrice(value)) ? value.trim() : ''
}

/** Reads filters from the address. Unknown or invalid values are ignored. */
export function parseFilters(params: URLSearchParams, category: CategoryConfig | undefined): SearchFilters {
  const sort = params.get('sort')
  const page = Number(params.get('page'))
  const condition = params.get('cond') ?? ''
  const locality = params.get('loc') ?? ''

  const filters: SearchFilters = {
    ...EMPTY_FILTERS,
    q: (params.get('q') ?? '').trim().slice(0, 100),
    locality: DIGITS.test(locality) ? locality : '',
    condition: condition === 'new' || condition === 'used' ? condition : '',
    priceMin: cleanPrice(params.get('pmin')),
    priceMax: cleanPrice(params.get('pmax')),
    currency: params.get('cur') === 'EUR' ? 'EUR' : 'MDL',
    sort: SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : 'new',
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    attributes: {},
    ranges: {},
  }

  for (const field of filterableFields(category)) {
    if (field.filter === 'range') {
      const min = cleanNumber(params.get(`f.${field.key}.min`))
      const max = cleanNumber(params.get(`f.${field.key}.max`))
      if (min || max) filters.ranges[field.key] = { min, max }
    } else {
      const value = params.get(`f.${field.key}`) ?? ''
      if (isValidChoice(field, value)) filters.attributes[field.key] = value
    }
  }
  // a model filter without its brand/make makes no sense
  for (const field of filterableFields(category)) {
    if (field.type === 'reference' && field.dependsOn && !filters.attributes[field.dependsOn]) {
      delete filters.attributes[field.key]
    }
  }

  if (category?.hasCompatibility) {
    const make = params.get('cmake') ?? ''
    const model = params.get('cmodel') ?? ''
    const year = params.get('cyear') ?? ''
    if (DIGITS.test(make)) {
      filters.compatMake = make
      filters.compatModel = DIGITS.test(model) ? model : ''
      filters.compatYear = isValidYear(Number(year)) ? year : ''
    }
  }
  return filters
}

/** Writes filters to the address (only what is set, so links stay short). */
export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: string, value: string) => {
    if (value) params.set(key, value)
  }
  set('q', filters.q.trim())
  set('loc', filters.locality)
  set('cond', filters.condition)
  set('pmin', filters.priceMin)
  set('pmax', filters.priceMax)
  if ((filters.priceMin || filters.priceMax) && filters.currency !== 'MDL') params.set('cur', filters.currency)
  for (const [key, value] of Object.entries(filters.attributes)) set(`f.${key}`, value)
  for (const [key, range] of Object.entries(filters.ranges)) {
    set(`f.${key}.min`, range.min)
    set(`f.${key}.max`, range.max)
  }
  set('cmake', filters.compatMake)
  set('cmodel', filters.compatModel)
  set('cyear', filters.compatYear)
  if (filters.sort !== 'new') params.set('sort', filters.sort)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

/** Number of filters set in the panel (shown on the mobile "Filters" button). */
export function countActiveFilters(filters: SearchFilters): number {
  return (
    [filters.locality, filters.condition, filters.priceMin || filters.priceMax, filters.compatMake, filters.compatYear]
      .filter(Boolean).length +
    Object.keys(filters.attributes).length +
    Object.keys(filters.ranges).length
  )
}

export type SearchArgs = {
  p_category_id?: number
  p_query?: string
  p_locality_id?: number
  p_condition?: string
  p_price_min?: number
  p_price_max?: number
  p_currency?: string
  p_attributes?: Record<string, string | number | boolean>
  p_ranges?: Record<string, [number | null, number | null]>
  p_compat_make_id?: number
  p_compat_model_id?: number
  p_compat_year?: number
  p_user_id?: string
  p_exclude_id?: string
  p_sort?: SortOption
  p_limit?: number
  p_offset?: number
}

/** Converts the filters into the arguments of search_listings() (supabase/migrations/0013_search.sql). */
export function filtersToSearchArgs(filters: SearchFilters, category: CategoryConfig | undefined): SearchArgs {
  const args: SearchArgs = {
    p_sort: filters.sort,
    p_limit: PAGE_SIZE,
    p_offset: (filters.page - 1) * PAGE_SIZE,
  }
  if (category) args.p_category_id = category.id
  if (filters.q) args.p_query = filters.q
  if (filters.locality) args.p_locality_id = Number(filters.locality)
  if (filters.condition) args.p_condition = filters.condition
  if (filters.priceMin) args.p_price_min = parsePrice(filters.priceMin)
  if (filters.priceMax) args.p_price_max = parsePrice(filters.priceMax)
  if (filters.priceMin || filters.priceMax) args.p_currency = filters.currency

  const attributes: Record<string, string | number | boolean> = {}
  const ranges: Record<string, [number | null, number | null]> = {}
  for (const field of filterableFields(category)) {
    const value = filters.attributes[field.key]
    const range = filters.ranges[field.key]
    if (value) {
      // same types as buildAttributes() in src/lib/categories.ts, otherwise nothing would match
      if (field.type === 'reference' || field.key === 'storage_gb') attributes[field.key] = Number(value)
      else if (field.type === 'yesno') attributes[field.key] = value === 'yes'
      else attributes[field.key] = value
    }
    if (range) {
      const min = parseNumber(range.min)
      const max = parseNumber(range.max)
      ranges[field.key] = [Number.isFinite(min) ? min : null, Number.isFinite(max) ? max : null]
    }
  }
  if (Object.keys(attributes).length) args.p_attributes = attributes
  if (Object.keys(ranges).length) args.p_ranges = ranges

  if (filters.compatMake) args.p_compat_make_id = Number(filters.compatMake)
  if (filters.compatModel) args.p_compat_model_id = Number(filters.compatModel)
  if (filters.compatYear) args.p_compat_year = Number(filters.compatYear)
  return args
}

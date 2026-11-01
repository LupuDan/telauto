import { z } from 'zod'
import { categoryBySlug, OTHER_VALUE, validateAttributes } from '../../lib/categories'
import {
  isValidImei,
  isValidPrice,
  isValidVin,
  isValidYear,
  parseNumber,
  parsePrice,
} from '../../lib/validators'

// All form values are strings (inputs/selects) and are converted when saved (see api.ts).
// Messages are translation keys.

const compatibilityRow = z.object({
  makeId: z.string(),
  modelId: z.string(),
  yearFrom: z.string(),
  yearTo: z.string(),
})
export type CompatibilityFormRow = z.infer<typeof compatibilityRow>

export const listingSchema = z
  .object({
    categorySlug: z.string().min(1, 'validation.chooseCategory'),
    title: z.string().trim().min(3, 'validation.titleMin').max(100, 'validation.titleMax'),
    description: z.string().trim().max(5000, 'validation.tooLong'),
    price: z.string().refine((value) => isValidPrice(parsePrice(value)), 'validation.price'),
    currency: z.enum(['MDL', 'EUR']),
    negotiable: z.boolean(),
    condition: z.string().refine((value): boolean => value === 'new' || value === 'used', 'validation.required'),
    localityId: z.string().regex(/^\d+$/, 'validation.required'),
    attributes: z.record(z.string(), z.string()),
    imei: z.string(),
    vin: z.string(),
    compatibility: z.array(compatibilityRow).max(20, 'validation.compatibilityMax'),
  })
  .superRefine((values, ctx) => {
    const category = categoryBySlug(values.categorySlug)
    if (!category) return

    for (const [key, message] of Object.entries(validateAttributes(category, values.attributes))) {
      ctx.addIssue({ code: 'custom', path: ['attributes', key], message })
    }

    if (category.privateField === 'imei' && values.imei.trim() !== '' && !isValidImei(values.imei)) {
      ctx.addIssue({ code: 'custom', path: ['imei'], message: 'validation.imei' })
    }
    if (category.privateField === 'vin' && values.vin.trim() !== '' && !isValidVin(values.vin)) {
      ctx.addIssue({ code: 'custom', path: ['vin'], message: 'validation.vin' })
    }

    if (category.hasCompatibility) {
      if (values.compatibility.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['compatibility'], message: 'validation.compatibilityRequired' })
      }
      values.compatibility.forEach((row, index) => {
        if (!/^\d+$/.test(row.makeId) || row.makeId === OTHER_VALUE) {
          ctx.addIssue({ code: 'custom', path: ['compatibility', index, 'makeId'], message: 'validation.required' })
        }
        const from = parseNumber(row.yearFrom)
        const to = parseNumber(row.yearTo)
        if (!isValidYear(from)) {
          ctx.addIssue({ code: 'custom', path: ['compatibility', index, 'yearFrom'], message: 'validation.year' })
        }
        if (!isValidYear(to)) {
          ctx.addIssue({ code: 'custom', path: ['compatibility', index, 'yearTo'], message: 'validation.year' })
        } else if (isValidYear(from) && from > to) {
          ctx.addIssue({ code: 'custom', path: ['compatibility', index, 'yearTo'], message: 'validation.yearOrder' })
        }
      })
    }
  })

export type ListingFormValues = z.infer<typeof listingSchema>

export const EMPTY_LISTING: ListingFormValues = {
  categorySlug: '',
  title: '',
  description: '',
  price: '',
  currency: 'MDL',
  negotiable: false,
  condition: '',
  localityId: '',
  attributes: {},
  imei: '',
  vin: '',
  compatibility: [],
}

export const EMPTY_COMPATIBILITY: CompatibilityFormRow = { makeId: '', modelId: '', yearFrom: '', yearTo: '' }

/** Which form fields belong to which wizard step (photos are checked separately). */
export const STEP_FIELDS = {
  category: ['categorySlug'],
  photos: [],
  details: ['title', 'description', 'price', 'currency', 'condition', 'localityId'],
  characteristics: ['attributes', 'imei', 'vin', 'compatibility'],
  publish: [],
} as const satisfies Record<string, readonly (keyof ListingFormValues)[]>

export type WizardStep = keyof typeof STEP_FIELDS
export const WIZARD_STEPS = Object.keys(STEP_FIELDS) as WizardStep[]

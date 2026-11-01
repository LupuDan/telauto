// Single source of truth for categories (plan, section 6).
// Phase 4 extends this file with the per-category field definitions used to
// generate the listing form, the search filters and the listing details.

export const CATEGORY_SLUGS = [
  'telefoane',
  'accesorii-telefoane',
  'autovehicule',
  'piese-auto',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const CATEGORY_ICONS: Record<CategorySlug, string> = {
  telefoane: '📱',
  'accesorii-telefoane': '🎧',
  autovehicule: '🚗',
  'piese-auto': '⚙️',
}

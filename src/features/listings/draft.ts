import { EMPTY_LISTING, type ListingFormValues } from './schema'

// "Ciorna se salvează local în browser" (plan, section 7). Photos are not saved (files cannot be stored here).
const KEY = 'telauto.listingDraft.v1'

export function loadLocalDraft(): ListingFormValues | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ListingFormValues>
    return { ...EMPTY_LISTING, ...parsed, attributes: { ...(parsed.attributes ?? {}) } }
  } catch {
    return null
  }
}

export function saveLocalDraft(values: ListingFormValues) {
  try {
    localStorage.setItem(KEY, JSON.stringify(values))
  } catch {
    // storage full or unavailable: the draft is simply not kept
  }
}

export function clearLocalDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

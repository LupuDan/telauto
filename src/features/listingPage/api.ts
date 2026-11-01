import { useMutation, useQuery } from '@tanstack/react-query'
import type { StoredAttributes } from '../../lib/categories'
import { supabase } from '../../lib/supabase'
import type { ListingStatus } from '../listings/api'

export type CompatibilityRow = {
  makeId: number
  makeName: string
  modelId: number | null
  modelName: string | null
  yearFrom: number
  yearTo: number
}

export type ListingDetails = {
  id: string
  userId: string
  categoryId: number
  title: string
  description: string
  price: number
  currency: string
  negotiable: boolean
  condition: string
  localityId: number
  attributes: StoredAttributes
  status: ListingStatus
  views: number
  createdAt: string
  expiresAt: string
  /** expires_at already passed when the listing was read */
  expired: boolean
  photos: string[]
  compatibility: CompatibilityRow[]
  seller: { displayName: string; createdAt: string; localityId: number | null } | null
  hasImei: boolean
  hasVin: boolean
}

/**
 * Reads one listing. Row Level Security decides what comes back: visitors get only active listings,
 * authors also get their own drafts/sold/expired ones. IMEI, VIN and phone are never part of this.
 */
export async function fetchListing(id: string): Promise<ListingDetails | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `id, user_id, category_id, title, description, price, currency, negotiable, condition, locality_id,
       attributes, status, views, created_at, expires_at,
       listing_images (storage_path, position),
       listing_compatibility (make_id, model_id, year_from, year_to, vehicle_makes (name)),
       profiles!listings_user_id_fkey (display_name, created_at, locality_id)`,
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const modelIds = data.listing_compatibility.map((row) => row.model_id).filter((value): value is number => value !== null)
  const [models, badges] = await Promise.all([
    modelIds.length
      ? supabase.from('vehicle_models').select('id, name').in('id', modelIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[], error: null }),
    supabase.rpc('get_listing_badges', { p_listing_id: id }),
  ])
  if (models.error) throw models.error
  if (badges.error) throw badges.error
  const modelName = new Map((models.data ?? []).map((model) => [model.id, model.name]))

  return {
    id: data.id,
    userId: data.user_id,
    categoryId: data.category_id,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency,
    negotiable: data.negotiable,
    condition: data.condition,
    localityId: data.locality_id,
    attributes: (data.attributes ?? {}) as StoredAttributes,
    status: data.status as ListingStatus,
    views: data.views,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    expired: new Date(data.expires_at).getTime() <= Date.now(),
    photos: [...data.listing_images].sort((a, b) => a.position - b.position).map((image) => image.storage_path),
    compatibility: data.listing_compatibility.map((row) => ({
      makeId: row.make_id,
      makeName: row.vehicle_makes?.name ?? '',
      modelId: row.model_id,
      modelName: row.model_id === null ? null : (modelName.get(row.model_id) ?? null),
      yearFrom: row.year_from,
      yearTo: row.year_to,
    })),
    seller: data.profiles
      ? {
          displayName: data.profiles.display_name,
          createdAt: data.profiles.created_at,
          localityId: data.profiles.locality_id,
        }
      : null,
    hasImei: badges.data?.[0]?.has_imei ?? false,
    hasVin: badges.data?.[0]?.has_vin ?? false,
  }
}

export type ListingContact = { phone: string | null; imei: string | null; vin: string | null }

/** "Arată telefonul": only for logged-in users (get_listing_contact() refuses visitors). */
export async function fetchListingContact(id: string): Promise<ListingContact> {
  const { data, error } = await supabase.rpc('get_listing_contact', { p_listing_id: id })
  if (error) throw error
  const row = data[0]
  return { phone: row?.phone ?? null, imei: row?.imei ?? null, vin: row?.vin ?? null }
}

const VIEWED_KEY = 'telauto.viewed'

/** Counts one view per listing per browser tab session (the author's own views are not counted). */
export async function countView(id: string): Promise<void> {
  try {
    const viewed = new Set<string>(JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? '[]'))
    if (viewed.has(id)) return
    viewed.add(id)
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed].slice(-200)))
  } catch {
    // private mode / storage full: still count the view
  }
  await supabase.rpc('increment_listing_views', { p_listing_id: id })
}

export const listingPageKeys = {
  detail: (id: string) => ['listing', id] as const,
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingPageKeys.detail(id ?? ''),
    queryFn: () => fetchListing(id ?? ''),
    enabled: Boolean(id),
    // always re-read when the page opens (the author may have just edited it)
    staleTime: 0,
  })
}

export function useListingContact(id: string) {
  return useMutation({ mutationFn: () => fetchListingContact(id) })
}

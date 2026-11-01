import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { StoredAttributes } from '../../lib/categories'
import { supabase } from '../../lib/supabase'
import type { SearchArgs } from './filters'

/** One result card (search_listings() in supabase/migrations/0013_search.sql). */
export type ListingSummary = {
  id: string
  userId: string
  categoryId: number
  title: string
  price: number
  currency: string
  negotiable: boolean
  condition: string
  localityId: number
  attributes: StoredAttributes
  createdAt: string
  coverPath: string | null
  hasImei: boolean
  hasVin: boolean
}

export type SearchResult = { items: ListingSummary[]; total: number }

export async function searchListings(args: SearchArgs): Promise<SearchResult> {
  const { data, error } = await supabase.rpc('search_listings', args)
  if (error) throw error
  return {
    total: data[0]?.total_count ?? 0,
    items: data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      title: row.title,
      price: row.price,
      currency: row.currency,
      negotiable: row.negotiable,
      condition: row.condition,
      localityId: row.locality_id,
      attributes: (row.attributes ?? {}) as StoredAttributes,
      createdAt: row.created_at,
      coverPath: row.cover_path,
      hasImei: row.has_imei,
      hasVin: row.has_vin,
    })),
  }
}

export const searchKeys = {
  all: ['search'] as const,
  list: (args: SearchArgs) => ['search', args] as const,
}

/** Keeps the previous page on screen while the next one loads (no flashing). */
export function useSearchListings(args: SearchArgs, enabled = true) {
  return useQuery({
    queryKey: searchKeys.list(args),
    queryFn: () => searchListings(args),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 10_000,
  })
}

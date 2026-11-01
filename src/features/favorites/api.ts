import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { StoredAttributes } from '../../lib/categories'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import type { ListingSummary } from '../search/api'

// Favorites: table public.favorites (0005). Row Level Security: everyone sees only their own rows.

export const favoriteKeys = {
  ids: (userId: string) => ['favorites', userId, 'ids'] as const,
  list: (userId: string) => ['favorites', userId, 'list'] as const,
}

async function fetchFavoriteIds(): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('listing_id')
  if (error) throw error
  return data.map((row) => row.listing_id)
}

/** Ids of the saved listings, used by every ♡ button (one request for the whole page). */
export function useFavoriteIds() {
  const { user } = useAuth()
  return useQuery({
    queryKey: favoriteKeys.ids(user?.id ?? ''),
    queryFn: fetchFavoriteIds,
    enabled: Boolean(user),
    select: (ids) => new Set(ids),
  })
}

export function useToggleFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: async ({ listingId, save }: { listingId: string; save: boolean }) => {
      const { error } = save
        ? await supabase.from('favorites').upsert(
            { user_id: userId, listing_id: listingId },
            { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
          )
        : await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId)
      if (error) throw error
    },
    // the heart changes at once; if saving fails it goes back
    onMutate: async ({ listingId, save }) => {
      const key = favoriteKeys.ids(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, (ids = []) =>
        save ? [...new Set([...ids, listingId])] : ids.filter((id) => id !== listingId),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(favoriteKeys.ids(userId), context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
    },
  })
}

export type FavoriteItem =
  | { listingId: string; available: true; listing: ListingSummary }
  | { listingId: string; available: false; title: string | null }

/**
 * Saved listings, newest saved first. A listing that was sold, expired or hidden is still listed
 * (as "unavailable") so the user can remove it; listings the user may no longer read come back as null.
 */
async function fetchFavorites(): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `listing_id, created_at,
       listings (id, user_id, category_id, title, price, currency, negotiable, condition, locality_id,
                 attributes, created_at, status, expires_at, listing_images (storage_path, position))`,
    )
    .order('created_at', { ascending: false })
  if (error) throw error

  const now = Date.now()
  return data.map((row): FavoriteItem => {
    const l = row.listings
    if (!l) return { listingId: row.listing_id, available: false, title: null }
    if (l.status !== 'active' || new Date(l.expires_at).getTime() <= now) {
      return { listingId: row.listing_id, available: false, title: l.title }
    }
    const cover = [...l.listing_images].sort((a, b) => a.position - b.position)[0]
    return {
      listingId: row.listing_id,
      available: true,
      listing: {
        id: l.id,
        userId: l.user_id,
        categoryId: l.category_id,
        title: l.title,
        price: l.price,
        currency: l.currency,
        negotiable: l.negotiable,
        condition: l.condition,
        localityId: l.locality_id,
        attributes: (l.attributes ?? {}) as StoredAttributes,
        createdAt: l.created_at,
        coverPath: cover?.storage_path ?? null,
        // the badges are shown on the listing page; not needed in this list
        hasImei: false,
        hasVin: false,
      },
    }
  })
}

export function useFavorites() {
  const { user } = useAuth()
  return useQuery({
    queryKey: favoriteKeys.list(user?.id ?? ''),
    queryFn: fetchFavorites,
    enabled: Boolean(user),
    staleTime: 0,
  })
}

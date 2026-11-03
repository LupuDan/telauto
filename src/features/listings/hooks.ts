import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  deleteListing,
  fetchListingForEdit,
  fetchMyListings,
  publishListing,
  reactivateListing,
  setListingStatus,
} from './api'

export const listingKeys = {
  mine: (userId: string) => ['my-listings', userId] as const,
  edit: (listingId: string) => ['listing-edit', listingId] as const,
}

export function useMyListings(userId: string | undefined) {
  return useQuery({
    queryKey: listingKeys.mine(userId ?? ''),
    queryFn: () => fetchMyListings(userId!),
    enabled: Boolean(userId),
  })
}

export function useListingForEdit(listingId: string | undefined) {
  return useQuery({
    queryKey: listingKeys.edit(listingId ?? ''),
    queryFn: () => fetchListingForEdit(listingId!),
    enabled: Boolean(listingId),
    staleTime: 0,
  })
}

type Action = { type: 'sold' | 'active' | 'reactivate' | 'publish' | 'delete'; listingId: string }

/** Buttons in "Anunțurile mele". */
export function useListingAction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ type, listingId }: Action) => {
      switch (type) {
        case 'sold':
          return setListingStatus(listingId, 'sold')
        case 'active':
          return setListingStatus(listingId, 'active')
        case 'reactivate':
          return reactivateListing(listingId)
        case 'publish':
          return publishListing(listingId)
        case 'delete':
          return deleteListing(listingId)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listingKeys.mine(userId) }),
  })
}

/** How many people saved each of my listings (number only; database function my_listing_saves, 0017). */
export function useMyListingSaves(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-listing-saves', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_listing_saves')
      if (error) throw error
      return new Map(data.map((row) => [row.listing_id, row.saves]))
    },
    enabled: Boolean(userId),
  })
}

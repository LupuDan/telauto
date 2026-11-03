import { useState } from 'react'
import { HAS_GARAGE } from '../../lib/categories'
import { useAuth } from '../auth/authContext'
import { useFavorites } from '../favorites/api'
import { useVehicles } from '../garage/api'
import { useMyListings } from '../listings/hooks'
import { groupOf, isExpiringSoon } from '../listings/myListingGroups'

export { HAS_GARAGE }

/** Numbers of the main account screen; undefined while they load. */
export function useAccountSummary() {
  const { user } = useAuth()
  const listings = useMyListings(user?.id)
  const favorites = useFavorites()
  const vehicles = useVehicles()
  const [now] = useState(() => Date.now())

  return {
    active: listings.data?.filter((listing) => groupOf(listing, now) === 'active').length,
    expiring: listings.data?.filter((listing) => isExpiringSoon(listing, now)).length,
    favorites: favorites.data?.length,
    vehicles: HAS_GARAGE ? vehicles.data?.length : undefined,
  }
}

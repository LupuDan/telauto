import type { MyListing } from './api'

/** "Expiră curând": an active listing that expires in the next 3 days (plan de design, 6.6). */
export const EXPIRING_SOON_DAYS = 3
const DAY = 24 * 60 * 60 * 1000

export type ListingGroup = 'active' | 'draft' | 'sold' | 'expired' | 'hidden'

export function groupOf(listing: Pick<MyListing, 'status' | 'expires_at'>, now: number): ListingGroup {
  if (listing.status === 'draft') return 'draft'
  if (listing.status === 'sold') return 'sold'
  if (listing.status === 'hidden' || listing.status === 'rejected') return 'hidden'
  return new Date(listing.expires_at).getTime() <= now ? 'expired' : 'active'
}

export function isExpiringSoon(listing: Pick<MyListing, 'status' | 'expires_at'>, now: number): boolean {
  return groupOf(listing, now) === 'active' && new Date(listing.expires_at).getTime() - now <= EXPIRING_SOON_DAYS * DAY
}

/** Whole days left until the listing expires (at least 1 while it is still active). */
export function daysLeft(expiresAt: string, now: number): number {
  return Math.max(1, Math.ceil((new Date(expiresAt).getTime() - now) / DAY))
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Admin panel. The database decides who is admin (is_admin() in every policy and admin_* function, 0015),
// so these requests simply fail for everyone else.

export const adminKeys = {
  all: ['admin'] as const,
  counts: () => ['admin', 'counts'] as const,
  reports: () => ['admin', 'reports'] as const,
  flagged: () => ['admin', 'flagged'] as const,
  hidden: () => ['admin', 'hidden'] as const,
  users: (q: string) => ['admin', 'users', q] as const,
}

export function useAdminCounts() {
  return useQuery({
    queryKey: adminKeys.counts(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_counts')
      if (error) throw error
      return data[0] ?? { open_reports: 0, flagged_messages: 0, hidden_listings: 0 }
    },
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type ReportRow = {
  id: string
  reason: string
  details: string
  createdAt: string
  reporterName: string | null
}

export type ListingReportGroup = {
  kind: 'listing'
  listingId: string
  title: string
  status: string
  authorId: string | null
  authorName: string | null
  authorBlocked: boolean
  reports: ReportRow[]
}

export type MessageReportGroup = {
  kind: 'message'
  messageId: string
  body: string
  sentAt: string
  senderId: string | null
  senderName: string | null
  senderBlocked: boolean
  reports: ReportRow[]
}

async function fetchOpenReports(): Promise<(ListingReportGroup | MessageReportGroup)[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(
      `id, reason, details, created_at, listing_id, message_id,
       reporter:profiles!reports_reporter_id_fkey (display_name),
       listings (id, title, status, user_id, author:profiles!listings_user_id_fkey (display_name, is_blocked)),
       messages (id, body, created_at, sender_id, sender:profiles!messages_sender_id_fkey (display_name, is_blocked))`,
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error

  const groups = new Map<string, ListingReportGroup | MessageReportGroup>()
  for (const row of data) {
    const report: ReportRow = {
      id: row.id,
      reason: row.reason,
      details: row.details,
      createdAt: row.created_at,
      reporterName: row.reporter?.display_name ?? null,
    }
    if (row.listings) {
      const key = `l:${row.listings.id}`
      const group = groups.get(key) ?? {
        kind: 'listing' as const,
        listingId: row.listings.id,
        title: row.listings.title,
        status: row.listings.status,
        authorId: row.listings.user_id,
        authorName: row.listings.author?.display_name ?? null,
        authorBlocked: row.listings.author?.is_blocked ?? false,
        reports: [],
      }
      group.reports.push(report)
      groups.set(key, group)
    } else if (row.messages) {
      const key = `m:${row.messages.id}`
      const group = groups.get(key) ?? {
        kind: 'message' as const,
        messageId: row.messages.id,
        body: row.messages.body,
        sentAt: row.messages.created_at,
        senderId: row.messages.sender_id,
        senderName: row.messages.sender?.display_name ?? null,
        senderBlocked: row.messages.sender?.is_blocked ?? false,
        reports: [],
      }
      group.reports.push(report)
      groups.set(key, group)
    }
  }
  // most reported first
  return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length)
}

export function useOpenReports() {
  return useQuery({ queryKey: adminKeys.reports(), queryFn: fetchOpenReports, staleTime: 0 })
}

// ---------------------------------------------------------------------------
// Flagged messages (suspicious words / links), last 30 days
// ---------------------------------------------------------------------------

export type FlaggedMessage = {
  id: string
  body: string
  createdAt: string
  senderId: string | null
  senderName: string | null
  senderBlocked: boolean
}

export function useFlaggedMessages() {
  return useQuery({
    queryKey: adminKeys.flagged(),
    queryFn: async (): Promise<FlaggedMessage[]> => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id, sender:profiles!messages_sender_id_fkey (display_name, is_blocked)')
        .eq('is_flagged', true)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data.map((row) => ({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        senderId: row.sender_id,
        senderName: row.sender?.display_name ?? null,
        senderBlocked: row.sender?.is_blocked ?? false,
      }))
    },
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Hidden / rejected listings
// ---------------------------------------------------------------------------

export type HiddenListing = {
  id: string
  title: string
  status: 'hidden' | 'rejected'
  updatedAt: string
  authorId: string
  authorName: string | null
}

export function useHiddenListings() {
  return useQuery({
    queryKey: adminKeys.hidden(),
    queryFn: async (): Promise<HiddenListing[]> => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, status, updated_at, user_id, author:profiles!listings_user_id_fkey (display_name)')
        .in('status', ['hidden', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status as 'hidden' | 'rejected',
        updatedAt: row.updated_at,
        authorId: row.user_id,
        authorName: row.author?.display_name ?? null,
      }))
    },
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function useAdminUsers(query: string) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_search_users', { p_query: query, p_limit: 50 })
      if (error) throw error
      return data
    },
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Actions (every action refreshes the whole panel)
// ---------------------------------------------------------------------------

function useAdminAction<T>(action: (input: T) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      // listings and search results may have changed
      void queryClient.invalidateQueries({ queryKey: ['search'] })
      void queryClient.invalidateQueries({ queryKey: ['listing'] })
    },
  })
}

export type ModerationAction = 'hide' | 'reject' | 'restore'

export function useModerateListing() {
  return useAdminAction(async ({ listingId, action }: { listingId: string; action: ModerationAction }) => {
    const { error } = await supabase.rpc('admin_moderate_listing', { p_listing_id: listingId, p_action: action })
    if (error) throw error
  })
}

export function useResolveMessageReports() {
  return useAdminAction(async (messageId: string) => {
    const { error } = await supabase.rpc('admin_resolve_message_reports', { p_message_id: messageId })
    if (error) throw error
  })
}

export function useSetUserBlocked() {
  return useAdminAction(async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
    const { error } = await supabase.rpc('admin_set_user_blocked', { p_user_id: userId, p_blocked: blocked })
    if (error) throw error
  })
}

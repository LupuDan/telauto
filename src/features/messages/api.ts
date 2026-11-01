import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'

// Messaging (tables in 0006, list functions in 0014). RLS: only the two participants read a conversation.

export const MAX_MESSAGE_LENGTH = 2000

export type ConversationSummary = {
  id: string
  listingId: string | null
  listingTitle: string | null
  listingPrice: number | null
  listingCurrency: string | null
  listingCover: string | null
  listingAvailable: boolean
  otherUserId: string | null
  otherName: string | null
  iAmSeller: boolean
  lastMessageAt: string
  lastBody: string | null
  lastFromMe: boolean
  unreadCount: number
  canReply: boolean
}

export type Message = {
  id: string
  senderId: string | null
  body: string
  createdAt: string
  readAt: string | null
  isFlagged: boolean
}

type MessageRow = {
  id: string
  sender_id: string | null
  body: string
  created_at: string
  read_at: string | null
  is_flagged: boolean
}

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  senderId: row.sender_id,
  body: row.body,
  createdAt: row.created_at,
  readAt: row.read_at,
  isFlagged: row.is_flagged,
})

export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => ['messages', 'conversations'] as const,
  conversation: (id: string) => ['messages', 'conversation', id] as const,
  messages: (id: string) => ['messages', 'list', id] as const,
  unread: () => ['messages', 'unread'] as const,
}

async function fetchConversations(conversationId?: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc(
    'get_my_conversations',
    conversationId ? { p_conversation_id: conversationId } : {},
  )
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingPrice: row.listing_price,
    listingCurrency: row.listing_currency,
    listingCover: row.listing_cover,
    listingAvailable: row.listing_available,
    otherUserId: row.other_user_id,
    otherName: row.other_name,
    iAmSeller: row.i_am_seller,
    lastMessageAt: row.last_message_at,
    lastBody: row.last_body,
    lastFromMe: row.last_from_me,
    unreadCount: row.unread_count,
    canReply: row.can_reply,
  }))
}

const MESSAGE_COLUMNS = 'id, sender_id, body, created_at, read_at, is_flagged'

/** The last 500 messages, oldest first. */
async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data.map(toMessage).reverse()
}

export function useConversations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: () => fetchConversations(),
    enabled: Boolean(user),
    staleTime: 0,
  })
}

export function useConversation(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: messageKeys.conversation(id ?? ''),
    queryFn: async () => (await fetchConversations(id)).at(0) ?? null,
    enabled: Boolean(user && id),
  })
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.messages(conversationId ?? ''),
    queryFn: () => fetchMessages(conversationId ?? ''),
    enabled: Boolean(conversationId),
    staleTime: Infinity, // kept fresh by Realtime (useLiveConversation)
    // safety net in case a live event is lost (weak mobile connection, sleeping tab)
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: messageKeys.unread(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_unread_messages')
      if (error) throw error
      return data
    },
    enabled: Boolean(user),
    staleTime: 0,
    refetchInterval: 60_000,
  })
}

/** Adds or replaces a message in the cached list (messages from Realtime may arrive twice). */
function upsertMessage(list: Message[] | undefined, message: Message): Message[] {
  const current = list ?? []
  const index = current.findIndex((item) => item.id === message.id)
  if (index === -1) return [...current, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const next = [...current]
  next[index] = message
  return next
}

export function useSendMessage(conversationId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user?.id ?? '', body: body.trim() })
        .select(MESSAGE_COLUMNS)
        .single()
      if (error) throw error
      return toMessage(data)
    },
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(messageKeys.messages(conversationId), (list) => upsertMessage(list, message))
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    },
  })
}

/** "Scrie mesaj": opens (or reuses) the conversation about a listing; returns its id. */
export function useStartConversation() {
  return useMutation({
    mutationFn: async (listingId: string) => {
      const { data, error } = await supabase.rpc('start_conversation', { p_listing_id: listingId })
      if (error) throw error
      return data
    },
  })
}

async function markRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
}

/**
 * Live chat for one open conversation: new messages and "read" ticks arrive through Supabase Realtime
 * (which applies the same RLS rules). Messages from the other person are marked as read while the page is open.
 */
export function useLiveConversation(conversationId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  useEffect(() => {
    if (!conversationId || !userId) return
    const refreshCounters = () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread() })
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    }
    const markIfVisible = () => {
      if (document.visibilityState === 'visible') void markRead(conversationId).then(refreshCounters)
    }
    markIfVisible()

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          const message = toMessage(payload.new as MessageRow)
          queryClient.setQueryData<Message[]>(messageKeys.messages(conversationId), (list) =>
            upsertMessage(list, message),
          )
          if (payload.eventType === 'INSERT' && message.senderId !== userId) markIfVisible()
        },
      )
      .subscribe((status) => {
        // after a lost connection, read again what may have been missed
        if (status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey: messageKeys.messages(conversationId) })
        }
      })

    document.addEventListener('visibilitychange', markIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', markIfVisible)
      void supabase.removeChannel(channel)
    }
  }, [conversationId, userId, queryClient])
}

/** Keeps the ✉ counter and the conversation list up to date (used once, in the header). */
export function useLiveUnreadCounter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread() })
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    }
    const channel = supabase
      .channel(`inbox:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refresh)
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface ConversationListItem {
  id: string
  partner: { id: string; name: string; avatarUrl: string | null }
  lastMessageText: string | null
  lastMessageAt: string | null
  unreadCount: number
  status: string
}

export interface MessageItem {
  id: string
  senderRole: string
  type: string
  content: string
  proposalId?: string | null
  readAt: string | null
  createdAt: string
  attachments?: unknown[] | null
}

export function useConversations(page = 1) {
  return useSWR<{
    conversations: ConversationListItem[]
    total: number
    page: number
    totalPages: number
  }>(`/api/messages/conversations?page=${page}`, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })
}

export function useConversation(id: string | null, page = 1) {
  return useSWR<{
    conversation: {
      id: string
      partner: { id: string; name: string; avatarUrl: string | null }
      status: string
    }
    messages: MessageItem[]
    total: number
    page: number
    totalPages: number
  }>(id ? `/api/messages/conversations/${id}?page=${page}` : null, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })
}

export function useUnreadMessageCount() {
  return useSWR<{ unreadCount: number }>('/api/messages/unread-count', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })
}

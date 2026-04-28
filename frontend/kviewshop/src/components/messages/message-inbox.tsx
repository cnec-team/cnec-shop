'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useConversations, useConversation, type ConversationListItem, type MessageItem } from '@/hooks/use-conversations'
import { Users, Send, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageInboxProps {
  role: 'brand' | 'creator'
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return '오늘'
  if (d.toDateString() === yesterday.toDateString()) return '어제'
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`
}

function ConversationListItem({
  item,
  isActive,
  onClick,
}: {
  item: ConversationListItem
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50',
        isActive && 'bg-stone-100'
      )}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 shrink-0">
        {item.partner.avatarUrl ? (
          <img src={item.partner.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <Users className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-stone-900 truncate">{item.partner.name}</p>
          {item.lastMessageAt && (
            <span className="text-[10px] text-stone-400 shrink-0 ml-2">{formatTime(item.lastMessageAt)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500 truncate">{item.lastMessageText || '대화를 시작하세요'}</p>
          {item.unreadCount > 0 && (
            <span className="shrink-0 ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message, role }: { message: MessageItem; role: 'brand' | 'creator' }) {
  const isMine = (role === 'brand' && message.senderRole === 'BRAND') ||
                 (role === 'creator' && message.senderRole === 'CREATOR')
  const isSystem = message.senderRole === 'SYSTEM'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-stone-400 bg-stone-50 rounded-full px-3 py-1">{message.content}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex mb-2', isMine ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col max-w-[70%]', isMine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
            isMine
              ? 'bg-stone-900 text-white rounded-br-md'
              : 'bg-stone-100 text-stone-900 rounded-bl-md'
          )}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px] text-stone-400">{formatMessageTime(message.createdAt)}</span>
          {isMine && message.readAt && (
            <span className="text-[10px] text-blue-500">읽음</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function MessageInbox({ role }: MessageInboxProps) {
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('c')

  const [activeId, setActiveId] = useState<string | null>(initialConvId)
  const [showList, setShowList] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: listData, mutate: mutateList } = useConversations()
  const { data: detailData, mutate: mutateDetail } = useConversation(activeId)

  const conversations = listData?.conversations ?? []
  const messages = detailData?.messages ?? []
  const partner = detailData?.conversation?.partner

  // 스크롤 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // 모바일에서 대화 선택 시 리스트 숨기기
  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
    setShowList(false)
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim() || !activeId || sending) return
    setSending(true)

    // Optimistic update
    const optimisticMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      senderRole: role === 'brand' ? 'BRAND' : 'CREATOR',
      type: 'TEXT',
      content: inputValue.trim(),
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    mutateDetail(
      prev => prev ? {
        ...prev,
        messages: [...prev.messages, optimisticMsg],
      } : prev,
      { revalidate: false }
    )
    setInputValue('')

    try {
      const res = await fetch(`/api/messages/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticMsg.content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || '메시지 전송에 실패했습니다')
      }
      mutateDetail()
      mutateList()
    } catch {
      toast.error('메시지 전송 중 오류가 발생했습니다')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 날짜 구분선 계산
  let lastDateStr = ''

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* 대화 목록 */}
      <div
        className={cn(
          'w-full md:w-[320px] md:border-r border-stone-200 flex flex-col shrink-0',
          !showList && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">메시지</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 px-6">
            <MessageSquare className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">아직 대화가 없습니다</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {conversations.map(conv => (
              <ConversationListItem
                key={conv.id}
                item={conv}
                isActive={conv.id === activeId}
                onClick={() => selectConversation(conv.id)}
              />
            ))}
          </ScrollArea>
        )}
      </div>

      {/* 대화 상세 */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          showList && !activeId && 'hidden md:flex'
        )}
      >
        {activeId && partner ? (
          <>
            {/* 헤더 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
              <button
                onClick={() => { setShowList(true); setActiveId(null) }}
                className="md:hidden p-1 -ml-1 text-stone-500 hover:text-stone-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-100 shrink-0">
                {partner.avatarUrl ? (
                  <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Users className="w-4 h-4" />
                  </div>
                )}
              </div>
              <p className="font-medium text-sm text-stone-900">{partner.name}</p>
            </div>

            {/* 메시지 영역 */}
            <ScrollArea className="flex-1 px-4 py-4">
              {messages.map((msg) => {
                const dateStr = formatDateSeparator(msg.createdAt)
                let showDate = false
                if (dateStr !== lastDateStr) {
                  lastDateStr = dateStr
                  showDate = true
                }
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] text-stone-400 bg-stone-50 rounded-full px-3 py-0.5">{dateStr}</span>
                      </div>
                    )}
                    <MessageBubble message={msg} role={role} />
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* 입력 */}
            <div className="border-t border-stone-100 p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="resize-none min-h-[40px] max-h-[120px] text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  className="shrink-0 rounded-lg h-10 w-10"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">대화를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

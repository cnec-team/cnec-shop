'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, Mail, MessageSquare, Instagram, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  creatorName: string
  creatorId: string
  canSendDM?: boolean
  canSendEmail?: boolean
  canSendAlimtalk?: boolean
}

export function PartnershipAssistant({ creatorName, creatorId, canSendDM, canSendEmail, canSendAlimtalk }: Props) {
  const channelCount = (canSendDM ? 1 : 0) + (canSendEmail ? 1 : 0) + (canSendAlimtalk ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* 제안 도우미 */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#0f1a3d] to-[#1a2d5c] p-5 overflow-hidden">
        <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/40" />
        <h3 className="text-base font-bold text-white mb-2">공동구매 제안하기</h3>
        <p className="text-sm text-white/80 mb-4">
          {creatorName} 님에게 공동구매 초대 또는 상품 추천을 보내보세요.
          인앱 알림, 이메일, 알림톡, DM 등 가용한 채널로 동시에 발송돼요.
        </p>
        <Button asChild size="sm" className="rounded-lg gap-1.5 bg-white text-blue-900 hover:bg-white/90">
          <Link href={`/brand/creators/${creatorId}?action=propose`}>
            <Send className="w-4 h-4" />
            제안 보내기
          </Link>
        </Button>
      </div>

      {/* 연락 채널 요약 */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-stone-900 mb-3">사용 가능한 연락 채널</h4>
        <div className="space-y-2">
          <ChannelRow
            icon={<Instagram className="w-4 h-4" />}
            label="인스타 DM"
            active={!!canSendDM}
            description={canSendDM ? '인스타그램 다이렉트 메시지' : 'IG 아이디 미등록'}
          />
          <ChannelRow
            icon={<Mail className="w-4 h-4" />}
            label="이메일"
            active={!!canSendEmail}
            description={canSendEmail ? '등록된 이메일로 발송' : '이메일 미등록'}
          />
          <ChannelRow
            icon={<MessageSquare className="w-4 h-4" />}
            label="카카오 알림톡"
            active={!!canSendAlimtalk}
            description={canSendAlimtalk ? '전화번호로 자동 발송' : '전화번호 미인증'}
          />
        </div>
        {channelCount === 0 && (
          <p className="text-xs text-stone-400 mt-2">사용 가능한 채널이 없어요. 공동구매 제안 시 인스타 DM으로 발송할 수 있어요.</p>
        )}
      </div>
    </div>
  )
}

function ChannelRow({ icon, label, active, description }: { icon: React.ReactNode; label: string; active: boolean; description: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className={active ? 'text-green-600' : 'text-stone-300'}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-stone-700">{label}</p>
        <p className="text-[11px] text-stone-400">{description}</p>
      </div>
      <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-stone-200'}`} />
    </div>
  )
}

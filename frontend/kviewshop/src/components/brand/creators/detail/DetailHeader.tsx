'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Sparkles, Star, CheckCircle2, Calendar, Users, Instagram, Mail, MessageSquare, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  creator: any
  matchScore: number
}

function matchGrade(score: number) {
  if (score >= 85) return { label: '탁월', color: 'text-green-500' }
  if (score >= 70) return { label: '우수', color: 'text-green-500' }
  if (score >= 55) return { label: '적합', color: 'text-blue-500' }
  if (score >= 40) return { label: '보통', color: 'text-amber-500' }
  return { label: '낮음', color: 'text-stone-500' }
}

export function DetailHeader({ creator, matchScore }: Props) {
  const grade = matchGrade(matchScore)
  const circumference = 2 * Math.PI * 38
  const offset = circumference * (1 - matchScore / 100)
  const profileImg = creator.igProfileImageR2Url || creator.igProfilePicUrl
  const name = creator.displayName || creator.instagramHandle || creator.igUsername || ''
  const handle = creator.instagramHandle || creator.igUsername || ''

  const handleEmailClick = () => {
    // cnecEmail1/2/3에서 첫 번째 유효 이메일 찾기
    const email = creator.cnecEmail1 || creator.cnecEmail2 || creator.cnecEmail3
    if (email) {
      window.open(`mailto:${email}?subject=[크넥] ${name} 님께 협업 제안`, '_blank')
    } else {
      toast.error('등록된 이메일이 없습니다')
    }
  }

  const handleDmClick = () => {
    const igHandle = creator.igUsername || creator.instagramHandle
    if (igHandle) {
      window.open(`https://ig.me/m/${igHandle}`, '_blank')
    } else {
      toast.error('인스타그램 계정 정보가 없습니다')
    }
  }

  const handleAlimtalkClick = () => {
    toast.info('알림톡은 공동구매 제안 시 자동 발송됩니다')
  }

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500" />
      <div className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden border-2 border-stone-200 bg-stone-100">
              {profileImg ? (
                <Image src={profileImg} alt={name} width={88} height={88} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <Users className="w-8 h-8" />
                </div>
              )}
            </div>
            {creator.igVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                <CheckCircle2 className="w-5 h-5 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
              {creator.igTier && (
                <span className="rounded-sm bg-stone-900 text-white text-xs font-bold px-2 py-0.5 tracking-wide">{creator.igTier}</span>
              )}
              {creator.cnecIsPartner && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2.5 py-1">
                  <Sparkles className="w-3 h-3" />
                  크넥 파트너
                </span>
              )}
              {creator.showStarRating && creator.starRating !== null && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {creator.starRating.toFixed(1)}
                  <span className="text-stone-500 font-normal">· 협업 {creator.cnecCompletedPayments}회</span>
                </span>
              )}
            </div>
            <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mt-1">
              @{handle}
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* 크리에이터 소개 */}
            {creator.igBio && (
              <p className="text-sm text-stone-700 mt-2 line-clamp-3 whitespace-pre-line leading-relaxed">{creator.igBio}</p>
            )}

            <div className="flex items-center flex-wrap gap-2 mt-3 text-sm text-stone-600">
              {creator.igCategory && (
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium">{creator.igCategory}</span>
              )}
              {creator.igDataImportedAt && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  데이터 수집 {Math.floor((Date.now() - new Date(creator.igDataImportedAt).getTime()) / (1000 * 60 * 60 * 24))}일 전
                </span>
              )}
            </div>

            {/* 연락 수단 — 클릭 가능한 액션 버튼 */}
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                {creator.canSendDM && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleDmClick}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer"
                      >
                        <Instagram className="w-4 h-4 text-stone-700" />
                        DM 보내기
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">인스타그램 다이렉트 메시지 페이지로 이동</TooltipContent>
                  </Tooltip>
                )}
                {creator.canSendEmail && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleEmailClick}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-blue-700" />
                        이메일 보내기
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">등록된 이메일 주소로 메일 앱 열기</TooltipContent>
                  </Tooltip>
                )}
                {creator.canSendAlimtalk && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleAlimtalkClick}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-green-700" />
                        알림톡 가능
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">전화번호 인증 완료. 공동구매 제안 시 카카오 알림톡이 자동 발송돼요.</TooltipContent>
                  </Tooltip>
                )}
                {!creator.isContactable && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
                    연락 수단 미등록
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* AI MATCH 원형 + CTA */}
          <div className="flex items-center gap-5 shrink-0">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="relative w-20 h-20" role="img" aria-label={`AI 매칭 점수 ${matchScore}점`}>
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor" className="text-stone-200" strokeWidth="8" />
                        <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor" className={grade.color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-stone-900 tabular-nums">{matchScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">AI 매칭</p>
                      <p className={cn('text-sm font-bold', grade.color)}>{grade.label}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px] text-xs">
                  시청자 정합·콘텐츠 품질·브랜드 톤·가성비를 종합한 AI 매칭 점수. 85+ 탁월 / 70+ 우수 / 55+ 적합.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button asChild size="lg" className="rounded-lg gap-1.5">
              <Link href={`/brand/creators/${creator.id}?action=propose`}>
                공동구매 제안하기
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

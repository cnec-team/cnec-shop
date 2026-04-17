'use client'

import { Mail, Phone, Instagram, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ContactBadgesProps {
  hasBrandEmail?: boolean
  brandContactEmail?: string | null
  hasPhone?: boolean
  cnecJoinStatus?: string
  igUsername?: string | null
}

export function ContactBadges({
  hasBrandEmail,
  brandContactEmail,
  hasPhone,
  cnecJoinStatus,
  igUsername,
}: ContactBadgesProps) {
  const showEmail = hasBrandEmail && brandContactEmail
  const showPhone = hasPhone && cnecJoinStatus === 'VERIFIED'
  const showIg = !!igUsername
  const hasAny = showEmail || showPhone || showIg

  if (!hasAny) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'text-xs gap-1 px-1.5 py-0',
          'border-orange-300 text-orange-600 bg-orange-50',
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        연락 수단 없음
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {showEmail && (
        <Badge
          variant="outline"
          className={cn(
            'text-xs gap-1 px-1.5 py-0',
            'border-green-300 text-green-700 bg-green-50',
          )}
        >
          <Mail className="h-3 w-3" />
        </Badge>
      )}
      {showPhone && (
        <Badge
          variant="outline"
          className={cn(
            'text-xs gap-1 px-1.5 py-0',
            'border-blue-300 text-blue-700 bg-blue-50',
          )}
        >
          <Phone className="h-3 w-3" />
        </Badge>
      )}
      {showIg && (
        <Badge
          variant="outline"
          className={cn(
            'text-xs gap-1 px-1.5 py-0',
            'border-purple-300 text-purple-700 bg-purple-50',
          )}
        >
          <Instagram className="h-3 w-3" />
        </Badge>
      )}
    </div>
  )
}

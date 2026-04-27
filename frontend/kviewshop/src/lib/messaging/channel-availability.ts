export interface CreatorChannelAvailability {
  inApp: boolean
  email: boolean
  kakao: boolean
  dm: boolean
}

interface CreatorForChannel {
  cnecJoinStatus?: string | null
  hasBrandEmail?: boolean
  brandContactEmail?: string | null
  hasPhone?: boolean
  igUsername?: string | null
  cnecVerificationStatus?: string | null
}

export function getCreatorChannels(creator: CreatorForChannel): CreatorChannelAvailability {
  const verStatus = (creator.cnecVerificationStatus ?? '').toUpperCase()
  return {
    inApp: !!creator.cnecJoinStatus && creator.cnecJoinStatus !== 'NOT_JOINED',
    email: !!creator.hasBrandEmail && creator.brandContactEmail !== null,
    kakao: !!creator.hasPhone && (verStatus === 'VERIFIED' || verStatus === 'COMPLETED'),
    dm: creator.igUsername !== null && creator.igUsername !== undefined,
  }
}

interface CanSendProposalResult {
  ok: boolean
  reason?: string
  requiredAction?: string
}

export function canProposalBeSent(
  creator: CreatorForChannel,
  useDm: boolean,
  brandHasInstagramLinked: boolean,
): CanSendProposalResult {
  const channels = getCreatorChannels(creator)

  // inApp/email/kakao 중 하나라도 가능하면 OK
  if (channels.inApp || channels.email || channels.kakao) {
    return { ok: true }
  }

  // 모든 기본 채널 불가
  if (!useDm) {
    return {
      ok: false,
      reason: 'NO_CHANNEL',
      requiredAction: 'CHECK_DM',
    }
  }

  if (!brandHasInstagramLinked) {
    return {
      ok: false,
      reason: 'BRAND_IG_NOT_LINKED',
      requiredAction: 'LINK_INSTAGRAM',
    }
  }

  if (!channels.dm) {
    return {
      ok: false,
      reason: 'NO_CREATOR_IG',
    }
  }

  // DM만 가능
  return { ok: true }
}

import pRetry from 'p-retry'

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN ?? ''
const APIFY_ACTOR_ID = process.env.APIFY_INSTAGRAM_ACTOR_ID ?? 'apify/instagram-profile-scraper'
const APIFY_BASE_URL = 'https://api.apify.com/v2'

export interface ApifyProfileData {
  username: string
  fullName: string
  biography: string
  followersCount: number
  followsCount: number
  postsCount: number
  isVerified: boolean
  profilePicUrl: string
  profilePicUrlHD: string
  externalUrl: string | null
  igtvVideoCount: number
  latestPosts: Array<{
    likesCount: number
    commentsCount: number
    caption: string
    timestamp: string
    url: string
    displayUrl: string
  }>
}

interface ActorRunResult {
  data: {
    id: string
    status: string
    defaultDatasetId: string
  }
}

async function startActorRun(usernames: string[]): Promise<string> {
  const res = await fetch(`${APIFY_BASE_URL}/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernames,
      resultsLimit: 12,
    }),
  })
  if (!res.ok) {
    throw new Error(`Apify actor start failed: ${res.status}`)
  }
  const result: ActorRunResult = await res.json()
  return result.data.id
}

async function waitForRun(runId: string, timeoutMs = 60000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${APIFY_API_TOKEN}`)
    if (!res.ok) throw new Error(`Apify run status check failed: ${res.status}`)
    const data: ActorRunResult = await res.json()
    if (data.data.status === 'SUCCEEDED') return data.data.defaultDatasetId
    if (data.data.status === 'FAILED' || data.data.status === 'ABORTED') {
      throw new Error(`Apify run ${data.data.status}`)
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Apify run timed out')
}

async function getDatasetItems(datasetId: string): Promise<ApifyProfileData[]> {
  const res = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&format=json`,
  )
  if (!res.ok) throw new Error(`Apify dataset fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchInstagramProfiles(usernames: string[]): Promise<ApifyProfileData[]> {
  if (!APIFY_API_TOKEN) {
    console.error('[apify] APIFY_API_TOKEN not set')
    return []
  }
  if (usernames.length === 0) return []

  return pRetry(
    async () => {
      const runId = await startActorRun(usernames)
      const datasetId = await waitForRun(runId)
      return getDatasetItems(datasetId)
    },
    {
      retries: 3,
      minTimeout: 2000,
      factor: 2,
      onFailedAttempt: (err) =>
        console.warn(`[apify] attempt ${err.attemptNumber} failed:`, err),
    },
  )
}

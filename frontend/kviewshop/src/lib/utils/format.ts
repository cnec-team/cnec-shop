export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1)
    return val.endsWith('.0') ? `${Math.floor(count / 1_000_000)}M` : `${val}M`
  }
  if (count >= 1_000) {
    const val = (count / 1_000).toFixed(1)
    return val.endsWith('.0') ? `${Math.floor(count / 1_000)}K` : `${val}K`
  }
  return String(count)
}

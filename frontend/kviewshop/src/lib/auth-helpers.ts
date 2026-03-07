import { auth } from './auth'

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

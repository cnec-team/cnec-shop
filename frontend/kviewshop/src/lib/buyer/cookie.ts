import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function getOrCreateGuestCookieKey(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get('guest_key')?.value;
  if (existing) return existing;

  const newKey = randomUUID();
  cookieStore.set('guest_key', newKey, {
    maxAge: 60 * 60 * 24 * 30, // 30일
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  });
  return newKey;
}

export async function getGuestCookieKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('guest_key')?.value ?? null;
}

export async function clearGuestCookieKey(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('guest_key');
}

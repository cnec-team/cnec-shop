'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/auth';

export function useUser() {
  const { data: session, status } = useSession();
  const {
    user,
    brand,
    creator,
    buyer,
    isLoading: storeLoading,
    setUser,
    setBrand,
    setCreator,
    setBuyer,
    setLoading,
  } = useAuthStore();
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setBrand(null);
      setCreator(null);
      setBuyer(null);
      setLoading(false);
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData(session.user.id);
    }
  }, [status, session?.user?.id]);

  const fetchUserData = async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.user) setUser(data.user);
      if (data.brand) setBrand(data.brand);
      if (data.creator) setCreator(data.creator);
      if (data.buyer) setBuyer(data.buyer);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    setUser(null);
    setBrand(null);
    setCreator(null);
    setBuyer(null);
  };

  return {
    user,
    brand,
    creator,
    buyer,
    isLoading: status === 'loading' || storeLoading,
    isAuthenticated: status === 'authenticated',
    signOut,
    refetch: session?.user?.id ? () => fetchUserData(session.user.id) : undefined,
  };
}

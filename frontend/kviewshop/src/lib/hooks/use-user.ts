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
  const fetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setBrand(null);
      setCreator(null);
      setBuyer(null);
      setLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (status === 'authenticated' && session?.user?.id && !fetchedRef.current) {
      fetchUserData(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  const fetchUserData = async (userId: string) => {
    if (fetchingRef.current || fetchedRef.current) return;
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
      fetchedRef.current = true;
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
    fetchedRef.current = false;
  };

  const refetch = session?.user?.id
    ? () => {
        fetchedRef.current = false;
        fetchUserData(session.user.id);
      }
    : undefined;

  return {
    user,
    brand,
    creator,
    buyer,
    isLoading: status === 'loading' || storeLoading,
    isAuthenticated: status === 'authenticated',
    signOut,
    refetch,
  };
}

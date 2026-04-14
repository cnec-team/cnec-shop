'use client';

import { useEffect, useCallback } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/auth';

// Module-level flags shared across all useUser instances (prevents duplicate fetches)
let _fetched = false;
let _fetching = false;

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

  const fetchUserData = useCallback(async () => {
    if (_fetching || _fetched) return;
    _fetching = true;
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
      _fetched = true;
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      _fetching = false;
      setLoading(false);
    }
  }, [setUser, setBrand, setCreator, setBuyer, setLoading]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setUser(null);
      setBrand(null);
      setCreator(null);
      setBuyer(null);
      setLoading(false);
      _fetched = false;
      return;
    }

    if (status === 'authenticated' && session?.user?.id && !_fetched) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    setUser(null);
    setBrand(null);
    setCreator(null);
    setBuyer(null);
    _fetched = false;
  }, [setUser, setBrand, setCreator, setBuyer]);

  const refetch = useCallback(() => {
    _fetched = false;
    _fetching = false;
    fetchUserData();
  }, [fetchUserData]);

  return {
    user,
    brand,
    creator,
    buyer,
    isLoading: status === 'loading' || storeLoading,
    isAuthenticated: status === 'authenticated',
    signOut,
    refetch: session?.user?.id ? refetch : undefined,
  };
}

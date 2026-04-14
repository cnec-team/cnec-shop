'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/auth';

// Module-level singleton: one fetch for the entire app, shared across all useUser instances
let _fetchPromise: Promise<void> | null = null;
let _fetched = false;
let _lastStatus: string | null = null;

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

  // Ref for setters so useEffect never depends on them (prevents re-render loops)
  const settersRef = useRef({ setUser, setBrand, setCreator, setBuyer, setLoading });
  settersRef.current = { setUser, setBrand, setCreator, setBuyer, setLoading };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Only clear once per transition to avoid repeated store updates
      if (_lastStatus !== 'unauthenticated') {
        _lastStatus = 'unauthenticated';
        _fetched = false;
        _fetchPromise = null;
        const s = settersRef.current;
        s.setUser(null);
        s.setBrand(null);
        s.setCreator(null);
        s.setBuyer(null);
        s.setLoading(false);
      }
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      _lastStatus = 'authenticated';

      // Already fetched or currently fetching — skip
      if (_fetched || _fetchPromise) return;

      settersRef.current.setLoading(true);

      _fetchPromise = fetch('/api/auth/me')
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          const s = settersRef.current;
          if (data.user) s.setUser(data.user);
          if (data.brand) s.setBrand(data.brand);
          if (data.creator) s.setCreator(data.creator);
          if (data.buyer) s.setBuyer(data.buyer);
          _fetched = true;
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
        })
        .finally(() => {
          _fetchPromise = null;
          settersRef.current.setLoading(false);
        });
    }
    // Only depend on session primitives — NOT on store setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    _fetched = false;
    _fetchPromise = null;
    _lastStatus = null;
    setUser(null);
    setBrand(null);
    setCreator(null);
    setBuyer(null);
  }, [setUser, setBrand, setCreator, setBuyer]);

  const refetch = useCallback(() => {
    _fetched = false;
    _fetchPromise = null;
    const s = settersRef.current;
    s.setLoading(true);

    _fetchPromise = fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const cur = settersRef.current;
        if (data.user) cur.setUser(data.user);
        if (data.brand) cur.setBrand(data.brand);
        if (data.creator) cur.setCreator(data.creator);
        if (data.buyer) cur.setBuyer(data.buyer);
        _fetched = true;
      })
      .catch((error) => {
        console.error('Error refetching user data:', error);
      })
      .finally(() => {
        _fetchPromise = null;
        settersRef.current.setLoading(false);
      });
  }, []);

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

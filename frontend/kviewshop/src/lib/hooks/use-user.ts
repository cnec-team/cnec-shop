'use client';

import { useEffect, useState, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function useUser() {
  const { user, brand, creator, buyer, isLoading, setUser, setBrand, setCreator, setBuyer, setLoading } =
    useAuthStore();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const supabase = getClient();
    let cancelled = false;

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          setSupabaseUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (!cancelled) setLoading(false);
      }
      initializedRef.current = true;
    };

    initSession();

    // Listen for auth changes - skip initial event if we already handled it
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (!initializedRef.current) return;

      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setBrand(null);
        setCreator(null);
        setBuyer(null);
        setLoading(false);
      }
    });

    // Safety timeout - ensure loading is false after 5 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const supabase = getClient();
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user record:', userError);
        setLoading(false);
        return;
      }
      if (!userData) {
        setLoading(false);
        return;
      }
      setUser(userData);

      // Fetch role-specific data
      if (userData.role === 'brand_admin') {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!brandError && brandData) setBrand(brandData);
      } else if (userData.role === 'creator') {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!creatorError && creatorData) setCreator(creatorData);
      } else if (userData.role === 'buyer') {
        const { data: buyerData, error: buyerError } = await supabase
          .from('buyers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!buyerError && buyerData) setBuyer(buyerData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getClient();
    await supabase.auth.signOut();
    setSupabaseUser(null);
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
    supabaseUser,
    isLoading,
    signOut,
    refetch: supabaseUser ? () => fetchUserData(supabaseUser.id) : undefined,
  };
}

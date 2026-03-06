import type { SupabaseClient } from '@supabase/supabase-js';
import type { PointType } from '@/types/database';
import { POINT_AMOUNTS } from '@/types/database';

/**
 * Award points to a creator. Server-side only (uses service_role client).
 * Skips if the same (creator, type, related_id) already exists (dedup).
 */
export async function awardPoints(
  supabase: SupabaseClient,
  creatorId: string,
  pointType: PointType,
  description?: string,
  relatedId?: string,
): Promise<{ success: boolean; balance?: number; error?: string }> {
  // Dedup: check if this exact award already exists
  if (relatedId) {
    const { data: existing } = await supabase
      .from('creator_points')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('point_type', pointType)
      .eq('related_id', relatedId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, balance: undefined }; // Already awarded
    }
  } else {
    // For one-time events (SIGNUP_BONUS, PERSONA_COMPLETE, FIRST_PRODUCT, FIRST_SALE)
    const oneTimeTypes: PointType[] = ['SIGNUP_BONUS', 'PERSONA_COMPLETE', 'FIRST_PRODUCT', 'FIRST_SALE'];
    if (oneTimeTypes.includes(pointType)) {
      const { data: existing } = await supabase
        .from('creator_points')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('point_type', pointType)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, balance: undefined }; // Already awarded
      }
    }
  }

  const amount = getPointAmount(pointType);
  if (amount === 0) {
    return { success: false, error: 'Unknown point type' };
  }

  const { data, error } = await supabase.rpc('award_points', {
    p_creator_id: creatorId,
    p_type: pointType,
    p_amount: amount,
    p_description: description || null,
    p_related_id: relatedId || null,
  });

  if (error) {
    console.error('Failed to award points:', error);
    return { success: false, error: error.message };
  }

  return {
    success: data?.success ?? false,
    balance: data?.balance,
    error: data?.error,
  };
}

function getPointAmount(type: PointType): number {
  switch (type) {
    case 'SIGNUP_BONUS': return POINT_AMOUNTS.SIGNUP_BONUS;
    case 'PERSONA_COMPLETE': return POINT_AMOUNTS.PERSONA_COMPLETE;
    case 'FIRST_PRODUCT': return POINT_AMOUNTS.FIRST_PRODUCT;
    case 'FIRST_SALE': return POINT_AMOUNTS.FIRST_SALE;
    case 'REFERRAL_INVITE': return POINT_AMOUNTS.REFERRAL_INVITE;
    case 'REFERRAL_SALE': return POINT_AMOUNTS.REFERRAL_SALE;
    case 'WEEKLY_ACTIVE': return POINT_AMOUNTS.WEEKLY_ACTIVE;
    default: return 0;
  }
}

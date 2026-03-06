import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    const now = new Date();
    let startDate: string;

    if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString();
    } else {
      // monthly: start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    // Get top 20 creators by CONFIRMED order total in the period
    const { data: rankings, error } = await supabase
      .from('orders')
      .select('creator_id, total_amount')
      .eq('status', 'CONFIRMED')
      .gte('paid_at', startDate);

    if (error) {
      console.error('Ranking query error:', error);
      return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
    }

    // Aggregate by creator
    const salesMap = new Map<string, number>();
    for (const order of rankings ?? []) {
      const current = salesMap.get(order.creator_id) ?? 0;
      salesMap.set(order.creator_id, current + Number(order.total_amount));
    }

    // Sort and take top 20
    const sorted = Array.from(salesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    if (sorted.length === 0) {
      return NextResponse.json({ period, rankings: [] });
    }

    // Fetch creator display info
    const creatorIds = sorted.map(([id]) => id);
    const { data: creators } = await supabase
      .from('creators')
      .select('id, display_name, profile_image_url')
      .in('id', creatorIds);

    const creatorMap = new Map((creators ?? []).map(c => [c.id, c]));

    const rankingList = sorted.map(([creatorId, totalSales], index) => {
      const c = creatorMap.get(creatorId);
      return {
        rank: index + 1,
        creatorId,
        displayName: c?.display_name ?? '크리에이터',
        profileImage: c?.profile_image_url ?? null,
        totalSales,
      };
    });

    return NextResponse.json({ period, rankings: rankingList });
  } catch (error) {
    console.error('Ranking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List all SNS campaigns
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sns_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

// POST: Create a new SNS campaign
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { country, campaign_type, event_name, period_weeks, start_date, end_date, description } = body;

  if (!country || !event_name) {
    return NextResponse.json({ error: 'country and event_name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sns_campaigns')
    .insert({
      country,
      campaign_type: campaign_type || '기획',
      event_name,
      period_weeks: period_weeks || 4,
      start_date,
      end_date,
      description,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

// DELETE: Delete an SNS campaign
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });

  const { error } = await supabase.from('sns_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

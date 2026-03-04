import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch SNS campaigns with uploads
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const country = searchParams.get('country');
  const campaignType = searchParams.get('campaign_type');
  const eventName = searchParams.get('event_name');
  const status = searchParams.get('status');

  // Build query for campaigns
  let query = supabase.from('sns_campaigns').select('*').order('created_at', { ascending: false });

  if (country) query = query.eq('country', country);
  if (campaignType) query = query.eq('campaign_type', campaignType);
  if (eventName) query = query.eq('event_name', eventName);
  if (status) query = query.eq('status', status);

  const { data: campaigns, error: campaignError } = await query;
  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  // Fetch uploads for these campaigns
  const campaignIds = (campaigns || []).map((c) => c.id);
  let uploads: Record<string, unknown>[] = [];

  if (campaignIds.length > 0) {
    const { data: uploadsData, error: uploadsError } = await supabase
      .from('sns_uploads')
      .select('*')
      .in('sns_campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (uploadsError) {
      return NextResponse.json({ error: uploadsError.message }, { status: 500 });
    }
    uploads = uploadsData || [];
  }

  // Attach uploads to campaigns
  const campaignsWithUploads = (campaigns || []).map((campaign) => ({
    ...campaign,
    uploads: uploads.filter((u) => u.sns_campaign_id === campaign.id),
  }));

  return NextResponse.json({ campaigns: campaignsWithUploads });
}

// POST: Create or update SNS upload
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    sns_campaign_id,
    creator_id,
    creator_name,
    platform,
    sns_url,
    video_title,
    upload_status,
    notes,
  } = body;

  if (!sns_campaign_id || !creator_id || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate SNS URL format
  if (sns_url) {
    const isValid = validateSnsUrl(sns_url, platform);
    if (!isValid) {
      return NextResponse.json({ error: `Invalid ${platform} URL format` }, { status: 400 });
    }
  }

  // Upsert: if exists, update; if not, insert
  const { data: existing } = await supabase
    .from('sns_uploads')
    .select('id')
    .eq('sns_campaign_id', sns_campaign_id)
    .eq('creator_id', creator_id)
    .eq('platform', platform)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('sns_uploads')
      .update({
        sns_url,
        video_title,
        upload_status: sns_url ? (upload_status || 'UPLOADED') : 'PENDING',
        notes,
        uploaded_at: sns_url ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ upload: data });
  } else {
    const { data, error } = await supabase
      .from('sns_uploads')
      .insert({
        sns_campaign_id,
        creator_id,
        creator_name: creator_name || '',
        platform,
        sns_url,
        video_title,
        upload_status: sns_url ? 'UPLOADED' : 'PENDING',
        notes,
        uploaded_at: sns_url ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ upload: data }, { status: 201 });
  }
}

// PATCH: Update upload status (verify/reject)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, upload_status, notes, view_count, like_count, comment_count } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing upload id' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (upload_status) updateData.upload_status = upload_status;
  if (notes !== undefined) updateData.notes = notes;
  if (view_count !== undefined) updateData.view_count = view_count;
  if (like_count !== undefined) updateData.like_count = like_count;
  if (comment_count !== undefined) updateData.comment_count = comment_count;
  if (upload_status === 'VERIFIED') updateData.verified_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('sns_uploads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ upload: data });
}

function validateSnsUrl(url: string, platform: string): boolean {
  try {
    const parsed = new URL(url);
    switch (platform) {
      case 'youtube':
        return (
          parsed.hostname.includes('youtube.com') ||
          parsed.hostname.includes('youtu.be') ||
          parsed.hostname.includes('youtube.co')
        );
      case 'instagram':
        return parsed.hostname.includes('instagram.com');
      case 'tiktok':
        return (
          parsed.hostname.includes('tiktok.com') ||
          parsed.hostname.includes('vm.tiktok.com')
        );
      default:
        return true;
    }
  } catch {
    return false;
  }
}

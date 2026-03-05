import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Verify the requesting user matches the target userId
async function verifyUser(request: NextRequest, targetUserId: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const supabase = getSupabase();
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  return user.id === targetUserId;
}

// GET /api/notifications?userId=xxx&unread=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unread') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const authorized = await verifyUser(request, userId);
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Count unread
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount ?? 0,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications
// Body: { notificationId: string } or { markAllRead: true, userId: string }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authUser) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    if (body.markAllRead && body.userId) {
      if (body.userId !== authUser.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', body.userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark all as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.notificationId)
        .eq('user_id', authUser.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request body. Provide notificationId or markAllRead with userId.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

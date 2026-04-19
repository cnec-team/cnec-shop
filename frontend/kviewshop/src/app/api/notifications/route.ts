import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/notifications/logger';

// GET /api/notifications?userId=xxx&unread=true
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unread') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Count unread
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('알림 조회 실패', error);
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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAllRead && body.userId) {
      if (body.userId !== authUser.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      await prisma.notification.updateMany({
        where: { userId: body.userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: { id: body.notificationId, userId: authUser.id },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request body. Provide notificationId or markAllRead with userId.' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('알림 읽음 처리 실패', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

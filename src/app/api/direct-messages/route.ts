import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emitNotification } from '@/lib/socket';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    logger.debug('API /api/direct-messages POST: Request received');
    const { receiverId, text } = payload;

    if (!receiverId || !text) {
      logger.error('API /api/direct-messages POST: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prevent users from messaging themselves
    if (session.user.id === receiverId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    logger.debug('API /api/direct-messages POST: Creating message');

    const message = await prisma.chatMessage.create({
      data: {
        text,
        timestamp: new Date(),
        senderName: session.user.name || 'Anonymous',
        sender: {
          connect: { id: session.user.id }
        },
        receiver: {
          connect: { id: receiverId }
        },
        // initiativeId is undefined for direct messages
      },
    });

    logger.info('API /api/direct-messages POST: Message created successfully');

    // Create notification for the receiver
    try {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'DIRECT_MESSAGE',
          title: 'New Message',
          message: `${session.user.name || 'Someone'} sent you a message`,
          data: {
            senderId: session.user.id,
            senderName: session.user.name,
            messageId: message.id,
          },
        },
      });
      logger.debug('API /api/direct-messages POST: Notification created');
    } catch (notificationError) {
      logger.error('API /api/direct-messages POST: Error creating notification', notificationError);
      // Don't fail the entire request if notification fails
    }

    // Emit real-time notification (temporarily commented out to isolate issue)
    /*
    const notification = {
      id: 'temp-id', // Will be replaced with actual notification
      type: 'DIRECT_MESSAGE',
      title: 'New Message',
      message: `${session.user.name || 'Someone'} sent you a message`,
      data: {
        senderId: session.user.id,
        senderName: session.user.name,
        messageId: message.id,
      },
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    emitNotification(receiverId, notification);
    */

    logger.info('API /api/direct-messages POST: Message saved successfully');
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('API /api/direct-messages POST: Error creating direct message', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Get direct messages between the two users (where initiativeId is null)
    const messages = await prisma.chatMessage.findMany({
      where: {
        initiativeId: null, // Direct messages only
        OR: [
          {
            senderId: session.user.id,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: session.user.id,
          }
        ]
      },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    logger.info(`API /api/direct-messages GET: Fetched ${messages.length} direct messages`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    logger.error('API /api/direct-messages GET: Error fetching direct messages', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emitNotification } from '@/lib/socket';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('API /api/direct-messages POST: Received payload:', payload);
    const { receiverId, text } = payload;

    if (!receiverId || !text) {
      console.error('API /api/direct-messages POST: Missing required fields in payload:', payload);
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

    console.log('API /api/direct-messages POST: Creating message with data:', {
      text,
      timestamp: new Date(),
      senderName: session.user.name || 'Anonymous',
      senderId: session.user.id,
      receiverId: receiverId,
    });

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

    console.log('API /api/direct-messages POST: Message created successfully:', message);

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
      console.log('API /api/direct-messages POST: Notification created successfully');
    } catch (notificationError) {
      console.error('API /api/direct-messages POST: Error creating notification:', notificationError);
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

    console.log('API /api/direct-messages POST: Message saved successfully:', message);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('API /api/direct-messages POST: Error creating direct message:', error);
    console.error('API /api/direct-messages POST: Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
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

    console.log(`API /api/direct-messages GET: Fetched ${messages.length} direct messages between users ${session.user.id} and ${otherUserId}.`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('API /api/direct-messages GET: Error fetching direct messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

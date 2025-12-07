import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// Prisma regenerated with new chat fields

// GET /api/chat/direct/[userId] - Get direct messages between current user and specified user
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    const messages = await prisma.chatMessage.findMany({
      where: {
        isDeleted: false,
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, image: true, username: true }
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderName: true,
            isDeleted: true,
            sender: {
              select: { id: true, name: true, image: true, username: true }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      }
    });

    console.log(`Returning ${messages.length} messages for conversation between ${currentUserId} and ${userId}`);
    console.log('Messages:', messages.map(m => ({ id: m.id, text: m.text.substring(0, 50), isDeleted: m.isDeleted })));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/direct/[userId] - Send a direct message
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;
    const { text, replyToId } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Build the data object
    const messageData: any = {
      text: text.trim(),
      senderId: currentUserId,
      senderName: session.user.name || 'Anonymous',
      receiverId: userId,
    };

    if (replyToId) {
      messageData.replyToId = replyToId;
    }

    const message = await prisma.chatMessage.create({
      data: messageData,
      include: {
        sender: {
          select: { id: true, name: true, image: true, username: true }
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderName: true,
            isDeleted: true,
            sender: {
              select: { id: true, name: true, image: true, username: true }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      }
    });

    // Create notification and send email
    try {
      // Get receiver info including email preferences
      const receiver = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailNotifications: true, username: true },
      });

      // Get sender info for the chat link
      const sender = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { username: true },
      });

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'DIRECT_MESSAGE',
          title: 'New Message',
          message: `${session.user.name || 'Someone'}: ${text.trim().substring(0, 50)}${text.trim().length > 50 ? '...' : ''}`,
          data: {
            senderId: currentUserId,
            senderName: session.user.name,
            messageId: message.id,
          },
        },
      });

      // Send email notification if user has email notifications enabled
      if (receiver?.emailNotifications) {
        try {
          const { sendNotificationEmail } = await import('@/lib/email');
          // Use sender's ID for the chat link (chat route uses IDs, not usernames)
          const receiverIdentifier = receiver?.username || userId;
          const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
          const actionUrl = `${baseUrl}/chat/${currentUserId}`;

          await sendNotificationEmail(
            receiver.email,
            'DIRECT_MESSAGE',
            'New Message',
            `${session.user.name || 'Someone'}: ${text.trim().substring(0, 50)}${text.trim().length > 50 ? '...' : ''}`,
            actionUrl,
            'View Message',
            receiverIdentifier
          );
          console.log('Email notification sent successfully to', receiver.email);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the request if email fails
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending direct message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
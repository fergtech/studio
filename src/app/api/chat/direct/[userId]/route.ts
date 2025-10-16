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

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending direct message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
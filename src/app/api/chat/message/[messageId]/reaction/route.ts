import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST /api/chat/message/[messageId]/reaction - Add/remove reaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { emoji } = await req.json();
    const userId = session.user.id;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.chatMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.chatMessageReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      // Add reaction
      await prisma.chatMessageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    // Return updated message with reactions
    const updatedMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, name: true, image: true, username: true },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderName: true,
            isDeleted: true,
            sender: {
              select: { id: true, name: true, image: true, username: true },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

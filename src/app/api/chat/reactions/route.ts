import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { messageId, userId, emoji } = payload;

    if (!messageId || !userId || !emoji) {
      logger.error('API /api/chat/reactions POST: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      logger.info(`API /api/chat/reactions POST: Reaction removed`);
      return NextResponse.json({ action: 'removed' }, { status: 200 });
    } else {
      // Add reaction
      const reaction = await prisma.chatMessageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      logger.info(`API /api/chat/reactions POST: Reaction added`);
      return NextResponse.json({ action: 'added', reaction }, { status: 201 });
    }
  } catch (error) {
    logger.error('API /api/chat/reactions POST: Error handling reaction', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      logger.error('API /api/chat/reactions GET: Missing messageId');
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    const reactions = await prisma.chatMessageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    logger.info(`API /api/chat/reactions GET: Fetched ${reactions.length} reactions`);
    return NextResponse.json(reactions, { status: 200 });
  } catch (error) {
    logger.error('API /api/chat/reactions GET: Error fetching reactions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    logger.debug('API /api/chat/messages POST: Request received');
    const { initiativeId, senderId, text, senderName } = payload;

    if (!initiativeId || !senderId || !text || !senderName) {
      logger.error('API /api/chat/messages POST: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        text,
        timestamp: new Date(),
        senderName,
        sender: {
          connect: { id: senderId }
        },
        initiative: {
          connect: { id: initiativeId }
        }
      },
    });

    logger.info('API /api/chat/messages POST: Message saved successfully');
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('API /api/chat/messages POST: Error creating chat message', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initiativeId = searchParams.get('initiativeId');

    if (!initiativeId) {
      logger.error('API /api/chat/messages GET: Missing initiativeId query parameter');
      return NextResponse.json({ error: 'Missing initiativeId' }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { initiativeId: String(initiativeId) },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    logger.info(`API /api/chat/messages GET: Fetched ${messages.length} messages`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    logger.error('API /api/chat/messages GET: Error fetching chat messages', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

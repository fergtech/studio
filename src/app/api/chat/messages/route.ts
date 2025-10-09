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
          select: { id: true, name: true, image: true, username: true }
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

    logger.info(`API /api/chat/messages GET: Fetched ${messages.length} messages`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    logger.error('API /api/chat/messages GET: Error fetching chat messages', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await req.json();
    const { messageId, userId, text } = payload;

    if (!messageId || !userId || !text) {
      logger.error('API /api/chat/messages PATCH: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true }
    });

    if (!message) {
      logger.error('API /api/chat/messages PATCH: Message not found');
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId) {
      logger.error('API /api/chat/messages PATCH: Unauthorized - user does not own message');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { text }
    });

    logger.info(`API /api/chat/messages PATCH: Message ${messageId} updated successfully`);
    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    logger.error('API /api/chat/messages PATCH: Error updating chat message', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      logger.error('API /api/chat/messages DELETE: Missing required parameters');
      return NextResponse.json({ error: 'Missing messageId or userId' }, { status: 400 });
    }

    // Verify the message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true }
    });

    if (!message) {
      logger.error('API /api/chat/messages DELETE: Message not found');
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId) {
      logger.error('API /api/chat/messages DELETE: Unauthorized - user does not own message');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    logger.info(`API /api/chat/messages DELETE: Message ${messageId} deleted successfully`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('API /api/chat/messages DELETE: Error deleting chat message', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

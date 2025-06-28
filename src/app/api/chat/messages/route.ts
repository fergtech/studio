import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('API /api/chat/messages POST: Received payload:', payload);
    const { initiativeId, senderId, text, senderName } = payload;

    if (!initiativeId || !senderId || !text || !senderName) {
      console.error('API /api/chat/messages POST: Missing required fields in payload:', payload);
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

    console.log('API /api/chat/messages POST: Message saved successfully:', message);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('API /api/chat/messages POST: Error creating chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initiativeId = searchParams.get('initiativeId');

    if (!initiativeId) {
      console.error('API /api/chat/messages GET: Missing initiativeId query parameter.');
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

    console.log(`API /api/chat/messages GET: Fetched ${messages.length} messages for initiative ${initiativeId}.`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('API /api/chat/messages GET: Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

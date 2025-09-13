import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    initiativeId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { initiativeId } = await params;
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify user has access to this initiative
  const membership = await prisma.initiativeMembership.findFirst({
    where: {
      userId: session.user.id,
      initiativeId: initiativeId
    }
  });

  if (!membership) {
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let lastMessageTime = new Date();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ 
        type: 'connected', 
        initiativeId,
        timestamp: Date.now() 
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Poll for new messages
      const pollInterval = setInterval(async () => {
        try {
          // Fetch new messages since last check
          const messages = await prisma.chatMessage.findMany({
            where: {
              initiativeId: initiativeId,
              timestamp: {
                gt: lastMessageTime
              }
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true
                }
              }
            },
            orderBy: { timestamp: 'asc' },
            take: 50
          });

          if (messages.length > 0) {
            lastMessageTime = messages[messages.length - 1].timestamp;
            
            const data = `data: ${JSON.stringify({ 
              type: 'messages', 
              data: messages,
              initiativeId,
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send heartbeat
          const heartbeat = `data: ${JSON.stringify({ 
            type: 'heartbeat', 
            initiativeId,
            timestamp: Date.now() 
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('SSE chat polling error:', error);
        }
      }, 3000); // Poll every 3 seconds for chat (more frequent)

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    },
  });
}
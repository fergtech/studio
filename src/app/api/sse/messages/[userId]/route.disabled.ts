import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { userId } = await params;
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const currentUserId = session.user.id;
  const encoder = new TextEncoder();
  let lastMessageTime = new Date();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ 
        type: 'connected', 
        chatWithUserId: userId,
        timestamp: Date.now() 
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Poll for new direct messages
      const pollInterval = setInterval(async () => {
        try {
          // Fetch new messages in this conversation since last check
          const messages = await prisma.directMessage.findMany({
            where: {
              OR: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
              ],
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
              },
              receiver: {
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
              type: 'directMessages', 
              data: messages,
              chatWithUserId: userId,
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send heartbeat
          const heartbeat = `data: ${JSON.stringify({ 
            type: 'heartbeat', 
            chatWithUserId: userId,
            timestamp: Date.now() 
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('SSE direct messages polling error:', error);
        }
      }, 3000); // Poll every 3 seconds for direct messages

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
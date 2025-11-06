import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Use Node.js runtime for better compatibility with auth and Prisma
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();
    let lastNotificationCheck = Date.now();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', userId, timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Check for new notifications every 30 seconds
        const pollInterval = setInterval(async () => {
          try {
            // Only fetch notifications newer than last check
            const newNotifications = await prisma.notification.findMany({
              where: {
                userId: userId,
                createdAt: {
                  gte: new Date(lastNotificationCheck)
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            });

            if (newNotifications.length > 0) {
              const data = `data: ${JSON.stringify({ 
                type: 'new_notifications', 
                data: newNotifications,
                timestamp: Date.now(),
                count: newNotifications.length
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
              lastNotificationCheck = Date.now();
            }

            // Send heartbeat every 2 minutes to keep connection alive
            const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
            controller.enqueue(encoder.encode(heartbeat));
            
          } catch (error) {
            console.error('SSE notification polling error:', error);
            // Send error but don't close connection
            const errorData = `data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch notifications' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          }
        }, 30000); // Check every 30 seconds

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });

        // Set up connection timeout (Vercel has 10s limit for edge, but we're using nodejs)
        const timeout = setTimeout(() => {
          clearInterval(pollInterval);
          controller.close();
        }, 8 * 60 * 1000); // Close after 8 minutes to be safe

        request.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // For nginx
      },
    });
  } catch (error) {
    console.error('SSE setup error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
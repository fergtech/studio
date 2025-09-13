import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

// Use Node.js runtime for better compatibility with auth and Prisma
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Get user ID from query parameters for now
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return new Response('Unauthorized - no user ID provided', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Set up polling interval for notifications
      const pollInterval = setInterval(async () => {
        try {
          // For now, send mock notifications to test SSE functionality
          // We'll replace this with real database queries once we fix auth
          const mockNotifications = [
            {
              id: `mock-${Date.now()}`,
              type: 'test',
              title: 'Test Notification',
              message: 'SSE is working!',
              read: false,
              createdAt: new Date().toISOString()
            }
          ];

          // Send mock data occasionally
          if (Date.now() % 30000 < 15000) { // Every 30 seconds, send for 15 seconds
            const data = `data: ${JSON.stringify({ 
              type: 'notifications', 
              data: mockNotifications,
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send heartbeat every 15 seconds
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('SSE notification polling error:', error);
        }
      }, 15000); // Poll every 15 seconds

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
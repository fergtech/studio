import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for enhanced status information
    const body = await request.json().catch(() => ({}));
    const { status = 'online', lastActivity, pageVisible = true } = body;

    // Check if user exists first, then update or skip gracefully
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!existingUser) {
      // User doesn't exist in database (likely due to database reset)
      // Return success to avoid breaking the UI, but don't update
      console.log(`Heartbeat: User ${session.user.id} not found in database (skipping)`);
      return NextResponse.json({ success: true, skipped: true });
    }

    // Update user's activity status with detailed information
    const updateData: any = {
      lastActiveAt: new Date(),
    };

    // Only update additional fields if the user model supports them
    // For now, we'll just use lastActiveAt, but this could be extended
    if (status === 'active') {
      updateData.lastActiveAt = new Date(); // Most recent for active users
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Return enhanced status information for client-side optimization
    return NextResponse.json({ 
      success: true, 
      status: status,
      serverTime: new Date().toISOString(),
      recommendation: {
        // Recommend polling frequency based on status
        notificationPolling: status === 'active' ? 30000 : status === 'online' ? 45000 : 60000,
        heartbeatInterval: status === 'active' ? 15000 : status === 'online' ? 30000 : 60000
      }
    });
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      // Return empty list instead of error to prevent UI issues
      return NextResponse.json({ 
        onlineUserIds: [], 
        count: 0 
      });
    }

    // Find users who were active within the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    const onlineUsers = await prisma.user.findMany({
      where: {
        lastActiveAt: {
          gte: twoMinutesAgo
        }
      },
      select: {
        id: true
      }
    });

    const onlineUserIds = onlineUsers.map(user => user.id);

    return NextResponse.json({ 
      onlineUserIds,
      count: onlineUserIds.length 
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json({ 
      onlineUserIds: [], 
      count: 0 
    }, { status: 500 });
  }
}
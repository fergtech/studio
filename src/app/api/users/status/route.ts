import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Limit to prevent abuse
    if (userIds.length > 50) {
      return NextResponse.json({ error: 'Too many user IDs' }, { status: 400 });
    }

    // Fetch user statuses
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching user statuses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const currentUserId = session.user.id;

    // Get users the current user is following
    const following = await prisma.userFollow.findMany({
      where: { followerId: currentUserId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            dateCreated: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const followingUsers = following.map(f => f.following);

    return NextResponse.json({ users: followingUsers });
  } catch (error) {
    console.error('Error fetching following users:', error);
    return NextResponse.json({ error: 'Failed to fetch following users' }, { status: 500 });
  }
} 
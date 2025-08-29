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

    // Get users who are following the current user
    const followers = await prisma.userFollow.findMany({
      where: { followingId: currentUserId },
      include: {
        follower: {
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

    const followerUsers = followers.map(f => f.follower);

    return NextResponse.json({ users: followerUsers });
  } catch (error) {
    console.error('Error fetching follower users:', error);
    return NextResponse.json({ error: 'Failed to fetch follower users' }, { status: 500 });
  }
} 
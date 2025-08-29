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

    // Get IDs of users the current user is already following
    const following = await prisma.userFollow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    // Get up to 5 users not followed by the current user and not the current user
    const suggestions = await prisma.user.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...followingIds],
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      take: 5,
      orderBy: { dateCreated: 'desc' },
    });

    return NextResponse.json({ users: suggestions });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch user suggestions' }, { status: 500 });
  }
} 
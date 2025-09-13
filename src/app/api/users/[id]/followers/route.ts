import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    const { id: userId } = await params;

    // Confirm user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get total count
    const total = await prisma.userFollow.count({ where: { followingId: userId } });

    // Get paginated followers
    const followers = await prisma.userFollow.findMany({
      where: { followingId: userId },
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
      skip,
      take: limit,
    });

    const followerUsers = followers.map(f => f.follower);

    return NextResponse.json({ users: followerUsers, total, page, limit });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
} 
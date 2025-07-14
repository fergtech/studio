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

    // Get IDs of initiatives the user has already joined
    const memberships = await prisma.initiativeMembership.findMany({
      where: { userId: currentUserId },
      select: { initiativeId: true },
    });
    const joinedIds = memberships.map(m => m.initiativeId);

    // Get up to 5 initiatives the user has not joined
    const suggestions = await prisma.initiative.findMany({
      where: {
        id: { notIn: joinedIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ initiatives: suggestions });
  } catch (error) {
    console.error('Error fetching initiative suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch initiative suggestions' }, { status: 500 });
  }
} 
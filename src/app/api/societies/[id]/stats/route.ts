import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const societyId = params.id;
    // Count society posts by type
    const [generalPosts, ideaPosts, issuePosts] = await Promise.all([
      prisma.societyPost.count({ where: { societyId, type: 'GENERAL' } }),
      prisma.societyPost.count({ where: { societyId, type: 'IDEA' } }),
      prisma.societyPost.count({ where: { societyId, type: 'ISSUE' } }),
    ]);
    // Count initiatives created by members of this society
    const memberIds = (await prisma.societyMembership.findMany({
      where: { societyId },
      select: { userId: true },
    })).map(m => m.userId);
    const initiatives = await prisma.initiative.count({
      where: { creatorId: { in: memberIds } },
    });
    return NextResponse.json({
      generalPosts,
      ideaPosts,
      issuePosts,
      initiatives,
    });
  } catch (error) {
    console.error('Error fetching society stats:', error);
    return NextResponse.json({ error: 'Failed to fetch society stats' }, { status: 500 });
  }
} 
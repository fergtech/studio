import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all voters for a debate with user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;

    // Fetch all votes for this debate with user details
    const votes = await prisma.debateVote.findMany({
      where: {
        topicId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ voters: votes });
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voters' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { side } = body; // 'PRO' or 'CON'

    if (!side || !['PRO', 'CON'].includes(side)) {
      return NextResponse.json(
        { error: 'Side must be either PRO or CON' },
        { status: 400 }
      );
    }

    const topicId = params.id;

    // Check if debate topic exists
    const debateTopic = await prisma.debateTopic.findUnique({
      where: { id: topicId },
    });

    if (!debateTopic) {
      return NextResponse.json(
        { error: 'Debate topic not found' },
        { status: 404 }
      );
    }

    // Upsert vote (create or update existing vote)
    const vote = await prisma.debateVote.upsert({
      where: {
        topicId_userId: {
          topicId,
          userId: session.user.id,
        },
      },
      update: {
        side,
      },
      create: {
        topicId,
        userId: session.user.id,
        side,
      },
    });

    // Get updated vote counts
    const [proCount, conCount] = await Promise.all([
      prisma.debateVote.count({
        where: { topicId, side: 'PRO' },
      }),
      prisma.debateVote.count({
        where: { topicId, side: 'CON' },
      }),
    ]);

    const totalVotes = proCount + conCount;
    const stats = {
      proVotes: proCount,
      conVotes: conCount,
      totalVotes,
      proPercentage: totalVotes > 0 ? Math.round((proCount / totalVotes) * 100) : 0,
      conPercentage: totalVotes > 0 ? Math.round((conCount / totalVotes) * 100) : 0,
    };

    return NextResponse.json({
      vote,
      stats,
    });
  } catch (error) {
    console.error('Error voting on debate:', error);
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topicId = params.id;

    // Remove user's vote
    await prisma.debateVote.deleteMany({
      where: {
        topicId,
        userId: session.user.id,
      },
    });

    // Get updated vote counts
    const [proCount, conCount] = await Promise.all([
      prisma.debateVote.count({
        where: { topicId, side: 'PRO' },
      }),
      prisma.debateVote.count({
        where: { topicId, side: 'CON' },
      }),
    ]);

    const totalVotes = proCount + conCount;
    const stats = {
      proVotes: proCount,
      conVotes: conCount,
      totalVotes,
      proPercentage: totalVotes > 0 ? Math.round((proCount / totalVotes) * 100) : 0,
      conPercentage: totalVotes > 0 ? Math.round((conCount / totalVotes) * 100) : 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: topicId } = await params;

    // Get user's current vote
    const userVote = await prisma.debateVote.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId: session.user.id,
        },
      },
    });

    // Get vote statistics from cached counts (much faster than counting all votes)
    const debate = await prisma.debateTopic.findUnique({
      where: { id: topicId },
      select: { proVoteCount: true, conVoteCount: true },
    });

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const proCount = debate.proVoteCount;
    const conCount = debate.conVoteCount;

    const totalVotes = proCount + conCount;
    const stats = {
      proVotes: proCount,
      conVotes: conCount,
      totalVotes,
      proPercentage: totalVotes > 0 ? Math.round((proCount / totalVotes) * 100) : 0,
      conPercentage: totalVotes > 0 ? Math.round((conCount / totalVotes) * 100) : 0,
    };

    return NextResponse.json({
      userVote: userVote?.side || null,
      stats,
    });
  } catch (error) {
    console.error('Error fetching vote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: topicId } = await params;

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

    // Check existing vote to handle vote switching
    const existingVote = await prisma.debateVote.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId: session.user.id,
        },
      },
    });

    // Use transaction to ensure atomicity
    const [vote, updatedDebate] = await prisma.$transaction(async (tx) => {
      // Calculate counter deltas
      let proIncrement = 0;
      let conIncrement = 0;

      if (!existingVote) {
        // New vote: increment appropriate counter
        if (side === 'PRO') proIncrement = 1;
        else conIncrement = 1;
      } else if (existingVote.side !== side) {
        // Vote switch: decrement old, increment new
        if (side === 'PRO') {
          proIncrement = 1;
          conIncrement = -1;
        } else {
          proIncrement = -1;
          conIncrement = 1;
        }
      }
      // If same side, no counter changes needed

      // Upsert vote
      const voteResult = await tx.debateVote.upsert({
        where: {
          topicId_userId: {
            topicId,
            userId: session.user.id,
          },
        },
        update: { side },
        create: {
          topicId,
          userId: session.user.id,
          side,
        },
      });

      // Update cached counters if needed
      let debate = null;
      if (proIncrement !== 0 || conIncrement !== 0) {
        debate = await tx.debateTopic.update({
          where: { id: topicId },
          data: {
            proVoteCount: { increment: proIncrement },
            conVoteCount: { increment: conIncrement },
          },
          select: { proVoteCount: true, conVoteCount: true },
        });
      } else {
        debate = await tx.debateTopic.findUnique({
          where: { id: topicId },
          select: { proVoteCount: true, conVoteCount: true },
        });
      }

      return [voteResult, debate];
    });

    // Use cached counts from database
    const proCount = updatedDebate!.proVoteCount;
    const conCount = updatedDebate!.conVoteCount;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: topicId } = await params;

    // Get existing vote to know which counter to decrement
    const existingVote = await prisma.debateVote.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId: session.user.id,
        },
      },
    });

    if (!existingVote) {
      // No vote to delete
      const debate = await prisma.debateTopic.findUnique({
        where: { id: topicId },
        select: { proVoteCount: true, conVoteCount: true },
      });

      return NextResponse.json({
        stats: {
          proVotes: debate?.proVoteCount || 0,
          conVotes: debate?.conVoteCount || 0,
          totalVotes: (debate?.proVoteCount || 0) + (debate?.conVoteCount || 0),
          proPercentage: 0,
          conPercentage: 0,
        },
      });
    }

    // Use transaction to ensure atomicity
    const updatedDebate = await prisma.$transaction(async (tx) => {
      // Delete the vote
      await tx.debateVote.delete({
        where: {
          topicId_userId: {
            topicId,
            userId: session.user.id,
          },
        },
      });

      // Decrement appropriate counter
      const decrementField = existingVote.side === 'PRO' ? 'proVoteCount' : 'conVoteCount';
      return await tx.debateTopic.update({
        where: { id: topicId },
        data: {
          [decrementField]: { decrement: 1 },
        },
        select: { proVoteCount: true, conVoteCount: true },
      });
    });

    const proCount = updatedDebate.proVoteCount;
    const conCount = updatedDebate.conVoteCount;

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
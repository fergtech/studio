import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { calculateActivityScore, checkUserUnlockStatus } from '@/lib/gamification';

const prisma = new PrismaClient();

/**
 * GET /api/user/unlock-status
 *
 * Returns the current user's unlock status for Societies and Initiatives
 * based on their activity score and engagement metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user with all relevant counts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        activityScore: true,
        canCreateSociety: true,
        canCreateInitiative: true,
        societyUnlockedAt: true,
        initiativeUnlockedAt: true,

        // Counts for activity score calculation
        _count: {
          select: {
            createdDebateTopics: true,
            createdGeneralPosts: true,
            createdIdeas: true,
            createdIssues: true,
            debateVotes: true,
            debateArguments: true,
            comments: true,
            generalPostLikes: true,
            generalPostShares: true,
            societyMemberships: true,
            initiativeMemberships: true,
            userFollowers: true,
            userFollowing: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate fresh activity score from current engagement
    const calculatedScore = calculateActivityScore({
      debatesCreated: user._count.createdDebateTopics,
      postsCreated: user._count.createdGeneralPosts,
      ideasCreated: user._count.createdIdeas,
      issuesCreated: user._count.createdIssues,
      debateVotes: user._count.debateVotes,
      argumentsPosted: user._count.debateArguments,
      commentsPosted: user._count.comments,
      likes: user._count.generalPostLikes,
      shares: user._count.generalPostShares,
      societiesMember: user._count.societyMemberships,
      initiativesMember: user._count.initiativeMemberships,
      milestonesCompleted: 0, // TODO: Add milestone completion tracking
      followers: user._count.userFollowers,
      following: user._count.userFollowing,
    });

    // Update stored activity score if it changed
    if (calculatedScore !== user.activityScore) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activityScore: calculatedScore },
      });
    }

    // Check unlock status
    const unlockStatus = checkUserUnlockStatus(
      calculatedScore,
      user._count.createdDebateTopics,
      user._count.debateArguments,
      user.canCreateSociety,
      user.canCreateInitiative,
      user.societyUnlockedAt || undefined,
      user.initiativeUnlockedAt || undefined
    );

    // Auto-unlock features if thresholds are newly met
    const updates: any = {};
    if (unlockStatus.canCreateSociety && !user.canCreateSociety) {
      updates.canCreateSociety = true;
      updates.societyUnlockedAt = new Date();
    }
    if (unlockStatus.canCreateInitiative && !user.canCreateInitiative) {
      updates.canCreateInitiative = true;
      updates.initiativeUnlockedAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }

    return NextResponse.json({
      ...unlockStatus,
      activityScore: calculatedScore,
    });

  } catch (error) {
    console.error('Error checking unlock status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

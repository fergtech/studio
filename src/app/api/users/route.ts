import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    console.log('🔍 Smart Suggestions Debug:', {
      currentUserId,
      followingCount: followingIds.length,
      followingIds: followingIds.slice(0, 5), // Show first 5
    });

    // Get top active users (users with most content) not followed by current user
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
        _count: {
          select: {
            createdGeneralPosts: {
              where: { moderationStatus: 'approved' }
            },
            createdIdeas: {
              where: { moderationStatus: 'approved' }
            },
            createdIssues: {
              where: { moderationStatus: 'approved' }
            },
            createdInitiatives: true,
            createdDebateTopics: {
              where: { moderationStatus: 'approved' }
            },
            societies: true,
          },
        },
      },
      take: 20, // Get more to filter and sort
    });

    // Filter out users with zero activity and sort by total activity
    const usersWithActivity = suggestions
      .map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        totalActivity:
          user._count.createdGeneralPosts +
          user._count.createdIdeas +
          user._count.createdIssues +
          user._count.createdInitiatives +
          user._count.createdDebateTopics +
          user._count.societies,
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity); // Sort by most active first

    // ONLY show users with activity (no fallback to new users)
    const activeUsers = usersWithActivity.filter(user => user.totalActivity > 0);

    console.log('📊 Activity Summary:', {
      totalSuggestions: suggestions.length,
      usersWithActivity: usersWithActivity.length,
      activeUsersCount: activeUsers.length,
      topUsers: activeUsers.slice(0, 5).map(u => ({
        name: u.name,
        username: u.username,
        activity: u.totalActivity
      }))
    });

    // Only return top 5 active users (no fallback)
    const result = activeUsers
      .slice(0, 5)
      .map(({ totalActivity, ...user }) => user); // Remove totalActivity from response

    console.log('✅ Returning users:', result.length);

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch user suggestions' }, { status: 500 });
  }
} 
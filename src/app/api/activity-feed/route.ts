import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cachedFetch } from '@/lib/cache';

export interface ActivityFeedItem {
  id: string;
  type: 'post' | 'follow' | 'initiative_join' | 'initiative_create' | 'society_create' | 'goal_complete' | 'milestone_reach' | 'comment' | 'like';
  title: string;
  description: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  timestamp: Date;
  data?: any;
  relatedInitiativeId?: string;
  relatedPostId?: string;
  relatedSocietyId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const preview = searchParams.get('preview') === '1';

    const currentUserId = session.user.id;
    
    // Create cache key based on user and parameters
    const cacheKey = `activity:${currentUserId}:${page}:${limit}:${preview}`;
    
    // Use cached fetch with stale-while-revalidate for optimal social media performance
    const result = await cachedFetch(
      cacheKey,
      async () => {
        // Get user's follow list to filter activities
        const following = await prisma.userFollow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);

        // For preview mode, only show activities from people you follow (not your own)
        const relevantUserIds = preview ? followingIds : [currentUserId, ...followingIds];

        const activities: ActivityFeedItem[] = [];

    // 1. General Posts
    const posts = await prisma.generalPost.findMany({
      where: {
        creatorId: { in: relevantUserIds },
        moderationStatus: 'approved',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    posts.forEach(post => {
      activities.push({
        id: post.id,
        type: 'post',
        title: 'New Post',
        description: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
        userId: post.creatorId,
        user: post.creator,
        timestamp: post.timestamp,
        relatedPostId: post.id,
        data: {
          fullContent: post.content,
          mediaCount: 0, // TODO: Add media count
        },
      });
    });

    // 2. Follow Activities
    const follows = await prisma.userFollow.findMany({
      where: {
        followerId: { in: relevantUserIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    follows.forEach(follow => {
      activities.push({
        id: follow.id,
        type: 'follow',
        title: 'New Follower',
        description: `${follow.follower.name} started following ${follow.following.name}`,
        userId: follow.followerId,
        user: follow.follower,
        timestamp: follow.createdAt,
        data: {
          followedUser: follow.following,
        },
      });
    });

    // 3. Initiative Joins
    const memberships = await prisma.initiativeMembership.findMany({
      where: {
        userId: { in: relevantUserIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
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
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    memberships.forEach(membership => {
      activities.push({
        id: membership.id,
        type: 'initiative_join',
        title: 'Joined Initiative',
        description: `${membership.user.name} joined ${membership.initiative.title}`,
        userId: membership.userId,
        user: membership.user,
        timestamp: membership.createdAt,
        relatedInitiativeId: membership.initiativeId,
        data: {
          role: membership.role,
          initiative: membership.initiative,
        },
      });
    });

    // 4. Initiative Creation
    const newInitiatives = await prisma.initiative.findMany({
      where: {
        creatorId: { in: relevantUserIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    newInitiatives.forEach(initiative => {
      activities.push({
        id: initiative.id,
        type: 'initiative_create',
        title: 'Created Initiative',
        description: `${initiative.creator.name} created ${initiative.title}`,
        userId: initiative.creatorId,
        user: initiative.creator,
        timestamp: initiative.createdAt,
        relatedInitiativeId: initiative.id,
        data: {
          initiative: {
            id: initiative.id,
            title: initiative.title,
            description: initiative.description,
          },
        },
      });
    });

    // 5. Society Creation
    const newSocieties = await prisma.society.findMany({
      where: {
        creatorId: { in: relevantUserIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    newSocieties.forEach(society => {
      activities.push({
        id: society.id,
        type: 'society_create',
        title: 'Created Society',
        description: `${society.creator.name} created ${society.name}`,
        userId: society.creatorId,
        user: society.creator,
        timestamp: society.createdAt,
        relatedSocietyId: society.id,
        data: {
          society: {
            id: society.id,
            name: society.name,
            description: society.description,
            image: society.image,
          },
        },
      });
    });

    // 6. Goal Completions
    const completedGoals = await prisma.goal.findMany({
      where: {
        ownerId: { in: relevantUserIds },
        status: 'Completed',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    completedGoals.forEach(goal => {
      activities.push({
        id: goal.id,
        type: 'goal_complete',
        title: 'Goal Completed',
        description: `${goal.owner?.name || 'Someone'} completed "${goal.title}" in ${goal.initiative.title}`,
        userId: goal.ownerId!,
        user: goal.owner!,
        timestamp: goal.updatedAt!,
        relatedInitiativeId: goal.initiativeId,
        data: {
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
          },
        },
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(0, limit);

        return {
          activities: paginatedActivities,
          hasMore: activities.length > limit,
          total: activities.length,
        };
      },
      {
        ttl: preview ? 60 * 1000 : 2 * 60 * 1000, // 1-2 minutes TTL for social feed
        staleWhileRevalidate: true,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

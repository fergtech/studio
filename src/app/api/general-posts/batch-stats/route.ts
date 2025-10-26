import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Batch API endpoint for fetching social stats (likes, shares, comments) for multiple posts
 * Fixes N+1 query problem where each post card makes 3 separate API calls
 *
 * POST /api/general-posts/batch-stats
 * Body: { postIds: string[], userId?: string }
 *
 * Returns: {
 *   [postId]: {
 *     likes: { count: number, liked: boolean },
 *     shares: { count: number },
 *     comments: { count: number }
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postIds, userId } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: 'postIds array is required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (postIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 posts per batch request' },
        { status: 400 }
      );
    }

    // Fetch all stats in parallel with optimized queries
    const [likesData, sharesData, commentsData, userLikesData] = await Promise.all([
      // Get like counts for all posts
      prisma.generalPostLike.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds },
        },
        _count: {
          postId: true,
        },
      }),

      // Get share counts for all posts
      prisma.generalPostShare.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds },
        },
        _count: {
          postId: true,
        },
      }),

      // Get comment counts for all posts
      prisma.generalPostComment.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds },
        },
        _count: {
          postId: true,
        },
      }),

      // Get user's likes if userId provided
      userId
        ? prisma.generalPostLike.findMany({
            where: {
              postId: { in: postIds },
              userId: userId,
            },
            select: {
              postId: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Create lookup maps for O(1) access
    const likesMap = new Map(
      likesData.map((item) => [item.postId, item._count.postId])
    );
    const sharesMap = new Map(
      sharesData.map((item) => [item.postId, item._count.postId])
    );
    const commentsMap = new Map(
      commentsData.map((item) => [item.postId, item._count.postId])
    );
    const userLikesSet = new Set(userLikesData.map((like) => like.postId));

    // Build response object with stats for each post
    const stats: Record<string, any> = {};

    for (const postId of postIds) {
      stats[postId] = {
        likes: {
          count: likesMap.get(postId) || 0,
          liked: userId ? userLikesSet.has(postId) : false,
        },
        shares: {
          count: sharesMap.get(postId) || 0,
        },
        comments: {
          count: commentsMap.get(postId) || 0,
        },
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching batch post stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post stats' },
      { status: 500 }
    );
  }
}

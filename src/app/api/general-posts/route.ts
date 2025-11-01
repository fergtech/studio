import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch general posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkedInitiativeId = searchParams.get('linkedInitiativeId');

    // Build where clause
    const where: any = {
      moderationStatus: 'approved' // Only show approved posts
    };

    if (linkedInitiativeId) {
      where.linkedInitiativeId = linkedInitiativeId;
    }

    // Fetch posts
    const posts = await prisma.generalPost.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        media: true,
        links: {
          include: {
            linkPreview: true
          }
        },
        documents: true,
        likes: {
          select: {
            userId: true
          }
        },
        shares: {
          select: {
            userId: true
          }
        },
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Limit to 50 posts
    });

    // Transform posts to match GeneralPost type
    const transformedPosts = posts.map(post => ({
      id: post.id,
      creatorId: post.creatorId,
      creatorName: post.creatorName,
      creatorAvatar: post.creatorAvatar,
      content: post.content,
      background: post.background,
      timestamp: post.timestamp,
      linkedInitiativeId: post.linkedInitiativeId,
      linkPreviewId: post.linkPreviewId,
      linkUrl: post.linkUrl,
      topics: post.topics,
      moderationStatus: post.moderationStatus,
      moderationFlags: post.moderationFlags,
      moderationScore: post.moderationScore,
      moderationReasoning: post.moderationReasoning,
      creator: post.creator,
      media: post.media,
      links: post.links,
      documents: post.documents
    }));

    return NextResponse.json({ posts: transformedPosts });
  } catch (error) {
    console.error('Error fetching general posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

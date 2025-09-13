import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const ideas = await prisma.idea.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            shares: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent ideas
    });

    // Transform to match the Idea interface expected by the frontend
    const transformedIdeas = ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      tags: idea.tags,
      location: idea.location,
      createdAt: idea.createdAt.toISOString(),
      creatorId: idea.creatorId,
      creator: idea.creator,
      media: idea.media.map((media, index) => ({
        id: media.id,
        url: media.url,
        type: media.type.toLowerCase(),
        order: index,
      })),
      championCount: idea._count.likes, // Use likes as champion count
      likesCount: idea._count.likes,
      sharesCount: idea._count.shares,
      commentsCount: idea._count.comments,
    }));

    return NextResponse.json(transformedIdeas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}
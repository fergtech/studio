import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: societyId } = await params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'recent';

    // Build sort criteria
    let orderBy: any = { createdAt: 'desc' }; // default: recent
    if (sort === 'popular') {
      orderBy = { championCount: 'desc' };
    } else if (sort === 'alphabetical') {
      orderBy = { title: 'asc' };
    }

    const ideas = await prisma.idea.findMany({
      where: {
        societyId: societyId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
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
      orderBy,
      take: 50,
    });

    // Transform the data to match frontend expectations
    const transformedIdeas = ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      tags: idea.tags,
      location: idea.location,
      createdAt: idea.createdAt.toISOString(),
      creatorId: idea.creator?.id, // Add creatorId field
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
    console.error('Error fetching society ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch society ideas' },
      { status: 500 }
    );
  }
}
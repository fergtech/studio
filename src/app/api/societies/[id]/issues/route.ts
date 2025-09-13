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

    const issues = await prisma.issue.findMany({
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
    const transformedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      tags: issue.tags,
      location: issue.location,
      createdAt: issue.createdAt.toISOString(),
      creator: issue.creator,
      media: issue.media.map((media, index) => ({
        id: media.id,
        url: media.url,
        type: media.type.toLowerCase(),
        order: index,
      })),
      championCount: issue._count.likes, // Use likes as champion count
      likesCount: issue._count.likes,
      sharesCount: issue._count.shares,
      commentsCount: issue._count.comments,
    }));

    return NextResponse.json(transformedIssues);
  } catch (error) {
    console.error('Error fetching society issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch society issues' },
      { status: 500 }
    );
  }
}
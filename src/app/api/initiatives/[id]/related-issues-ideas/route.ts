import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: initiativeId } = await params;

    // Fetch the initiative with its relationships
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: {
        originatingIssue: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        originatingIdea: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!initiative) {
      return NextResponse.json(
        { error: 'Initiative not found' },
        { status: 404 }
      );
    }

    // For related items, we could fetch issues/ideas from the same society
    // or with related tags (future enhancement)
    const relatedItems: any[] = [];

    // If the initiative belongs to a society, find other issues/ideas from the same society
    if (initiative.societyId) {
      const societyIssues = await prisma.issue.findMany({
        where: {
          societyId: initiative.societyId,
          NOT: {
            id: initiative.originatingIssue?.id,
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        take: 3,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const societyIdeas = await prisma.idea.findMany({
        where: {
          societyId: initiative.societyId,
          NOT: {
            id: initiative.originatingIdea?.id,
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        take: 3,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Mark items as issues or ideas for the frontend
      relatedItems.push(
        ...societyIssues.map(item => ({ ...item, type: 'issue' })),
        ...societyIdeas.map(item => ({ ...item, type: 'idea' }))
      );
    }

    // Transform data for frontend
    const transformItem = (item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
      creator: item.creator,
      tags: item.tags,
      championCount: item.championCount || 0,
    });

    const response = {
      originatingIssue: initiative.originatingIssue ? transformItem(initiative.originatingIssue) : null,
      originatingIdea: initiative.originatingIdea ? transformItem(initiative.originatingIdea) : null,
      relatedItems: relatedItems.map(transformItem),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching related issues/ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related issues/ideas' },
      { status: 500 }
    );
  }
}
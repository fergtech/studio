import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const issues = await prisma.issue.findMany({
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
      take: 50, // Limit to 50 most recent issues
    });

    // Transform to match the Issue interface expected by the frontend
    const transformedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      tags: issue.tags,
      location: issue.location,
      createdAt: issue.createdAt.toISOString(),
      creatorId: issue.creatorId,
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
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
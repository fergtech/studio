import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newsPostId, actionType, createdPostId } = body;

    // Validate required fields
    if (!newsPostId || !actionType) {
      return NextResponse.json(
        { error: 'newsPostId and actionType are required' },
        { status: 400 }
      );
    }

    // Validate actionType
    const validActionTypes = ['idea', 'issue', 'initiative', 'general_post'];
    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid actionType. Must be one of: idea, issue, initiative, general_post' },
        { status: 400 }
      );
    }

    // Verify the news post exists
    const newsPost = await prisma.newsPost.findUnique({
      where: { id: newsPostId },
    });

    if (!newsPost) {
      return NextResponse.json(
        { error: 'News post not found' },
        { status: 404 }
      );
    }

    // Create the news action tracking record
    const newsAction = await prisma.newsAction.create({
      data: {
        newsPostId,
        userId: session.user.id,
        actionType,
        createdPostId: createdPostId || null,
      },
    });

    return NextResponse.json(newsAction, { status: 201 });
  } catch (error) {
    console.error('Error creating news action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const newsPostId = searchParams.get('newsPostId');
    const actionType = searchParams.get('actionType');

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
    };

    if (newsPostId) {
      whereClause.newsPostId = newsPostId;
    }

    if (actionType) {
      whereClause.actionType = actionType;
    }

    // Get user's news actions
    const newsActions = await prisma.newsAction.findMany({
      where: whereClause,
      include: {
        newsPost: {
          select: {
            id: true,
            title: true,
            source: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(newsActions);
  } catch (error) {
    console.error('Error fetching news actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHotTakeBattle } from '@/services/hotTakeBattles';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post1Id, post2Id, topic } = await request.json();

    if (!post1Id || !post2Id) {
      return NextResponse.json({ error: 'post1Id and post2Id are required' }, { status: 400 });
    }

    // Verify both posts exist
    const [post1, post2] = await Promise.all([
      prisma.generalPost.findUnique({ where: { id: post1Id } }),
      prisma.generalPost.findUnique({ where: { id: post2Id } })
    ]);

    if (!post1 || !post2) {
      return NextResponse.json({ error: 'One or both posts not found' }, { status: 404 });
    }

    // Use provided topic or extract from posts
    const battleTopic = topic || post1.topics[0] || post2.topics[0] || 'community';

    const battle = await createHotTakeBattle({
      post1Id,
      post2Id,
      topic: battleTopic,
      title: `${battleTopic.charAt(0).toUpperCase() + battleTopic.slice(1)} Hot Take Battle`,
      description: `Debug battle between ${post1.creatorName} and ${post2.creatorName}`,
    });

    if (!battle) {
      return NextResponse.json({ error: 'Failed to create battle' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      battle,
      message: 'Debug battle created successfully!'
    });

  } catch (error) {
    console.error('Error creating debug battle:', error);
    return NextResponse.json(
      { error: 'Failed to create debug battle' },
      { status: 500 }
    );
  }
}

// Also provide a GET endpoint to list available posts for battle creation
export async function GET() {
  try {
    const recentPosts = await prisma.generalPost.findMany({
      where: {
        // Exclude posts already in battles
        AND: [
          { battleAsPost1: { none: {} } },
          { battleAsPost2: { none: {} } }
        ]
      },
      select: {
        id: true,
        content: true,
        creatorName: true,
        topics: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });

    return NextResponse.json({
      posts: recentPosts,
      message: 'Available posts for battle creation'
    });

  } catch (error) {
    console.error('Error fetching posts for battle creation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
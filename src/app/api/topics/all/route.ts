import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Fetching all topics...');

    // Get all topics with their post counts
    const topics = await prisma.topic.findMany({
      orderBy: [
        { postCount: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        postCount: true,
        weeklyPosts: true,
        isSystem: true
      }
    });

    console.log(`📊 Found ${topics.length} topics`);

    return NextResponse.json({
      topics,
      total: topics.length
    });

  } catch (error) {
    console.error('Error fetching all topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

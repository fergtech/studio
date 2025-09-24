import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Testing direct news save...');

    const testNewsItem = {
      title: 'Direct Test News Item',
      summary: 'Testing direct database save',
      excerpt: 'Test excerpt',
      source: 'Test Source',
      sourceUrl: 'https://example.com/direct-test',
      imageUrl: null,
      publishedAt: new Date(),
      location: 'Test Location',
      city: 'Test City',
      urgencyLevel: 1,
      tags: ['test', 'direct']
    };

    console.log('Attempting to save:', {
      urgencyLevel: testNewsItem.urgencyLevel,
      urgencyLevelType: typeof testNewsItem.urgencyLevel,
      tags: testNewsItem.tags,
      tagsType: typeof testNewsItem.tags
    });

    const newsPost = await prisma.newsPost.create({
      data: testNewsItem
    });

    console.log('Successfully saved news post:', newsPost.id);

    return NextResponse.json({
      success: true,
      message: 'Direct test save successful',
      newsPost
    });

  } catch (error) {
    console.error('Direct test save error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
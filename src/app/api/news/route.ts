import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cachedFetch } from '@/lib/cache';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const city = searchParams.get('city');
    const urgencyLevel = searchParams.get('urgencyLevel');

    const currentUserId = session.user.id;

    // Get user's news preferences
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        enableLocalNews: true,
        newsRadius: true,
        newsTypes: true,
        city: true,
        location: true,
      },
    });

    if (!user?.enableLocalNews) {
      return NextResponse.json({ news: [], hasMore: false, total: 0 });
    }

    // Build where clause for news filtering
    const whereClause: any = {};

    // Location filtering - use user's city by default or override with query param
    const targetCity = city || user.city;
    if (targetCity) {
      whereClause.city = {
        contains: targetCity,
        mode: 'insensitive',
      };
    }

    // Urgency level filtering
    if (urgencyLevel) {
      whereClause.urgencyLevel = parseInt(urgencyLevel);
    }

    // Tags filtering based on user preferences
    if (user.newsTypes && user.newsTypes.length > 0) {
      whereClause.tags = {
        hasSome: user.newsTypes,
      };
    }

    // Create cache key based on user and parameters
    const cacheKey = `news:${currentUserId}:${page}:${limit}:${targetCity}:${urgencyLevel}`;

    const result = await cachedFetch(
      cacheKey,
      async () => {
        const news = await prisma.newsPost.findMany({
          where: whereClause,
          orderBy: [
            { urgencyLevel: 'desc' }, // High urgency first
            { publishedAt: 'desc' },  // Then by recency
          ],
          skip,
          take: limit + 1, // Get one extra to check if there are more
        });

        const hasMore = news.length > limit;
        const newsItems = hasMore ? news.slice(0, limit) : news;

        return {
          news: newsItems,
          hasMore,
          total: newsItems.length,
        };
      },
      {
        ttl: 5 * 60 * 1000, // 5 minutes TTL for news feed
        staleWhileRevalidate: true,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
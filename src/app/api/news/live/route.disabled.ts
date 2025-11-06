import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchMultiTierNews, fetchHyperLocalNews, NewsArticle } from '@/services/enhancedNewsService';
import { ResolvedLocation } from '@/services/location';

// Enhanced cache for news articles with tier support
const newsCache = new Map<string, { data: NewsArticle[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer cache for RSS)

// Simple string similarity calculation (Jaccard similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

interface NewsAPIArticle {
  title: string;
  description?: string;
  content?: string;
  author?: string;
  source?: { name: string };
  urlToImage?: string;
  url: string;
  publishedAt: string;
}

interface NewsDataArticle {
  title: string;
  description?: string;
  content?: string;
  creator?: string[];
  source_name?: string;
  image_url?: string;
  link: string;
  pubDate: string;
}

async function fetchNewsFromNewsData(locationQuery: string, limit: number = 5) {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.error('❌ NEWSDATA_API_KEY not found in environment variables');
    return [];
  }

  try {
    console.log('🔄 Fetching news from NewsData.io for location:', locationQuery);

    const url = new URL('https://newsdata.io/api/1/latest');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('language', 'en');
    url.searchParams.append('country', 'us');
    url.searchParams.append('size', limit.toString());

    if (locationQuery && locationQuery !== 'General') {
      // Use the exact user location as search query
      url.searchParams.append('q', locationQuery);
      url.searchParams.append('category', 'politics,top,environment,business');
    } else {
      // No location set - get general US news
      url.searchParams.append('category', 'top');
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('❌ NewsData.io error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ No articles returned from NewsData.io');
      return [];
    }

    // Transform and deduplicate articles
    const seenTitles = new Set<string>();
    const articles = data.results
      .filter((article: NewsDataArticle) =>
        article.title &&
        article.description &&
        !article.title.includes('[Removed]')
      )
      .filter((article: NewsDataArticle) => {
        // Normalize title for deduplication (remove common variations)
        const normalizedTitle = article.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ')    // Normalize spaces
          .trim();

        // Check if we've seen this title (or very similar)
        for (const seenTitle of seenTitles) {
          const similarity = calculateSimilarity(normalizedTitle, seenTitle);
          if (similarity > 0.8) { // 80% similarity threshold
            return false; // Skip duplicate
          }
        }

        seenTitles.add(normalizedTitle);
        return true;
      })
      .slice(0, limit)
      .map((article: NewsDataArticle) => ({
        id: `newsdata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...' || '',
        source: article.source_name || 'News Source',
        sourceUrl: article.link,
        imageUrl: article.image_url,
        publishedAt: article.pubDate,
        location: locationQuery !== 'General' ? `${locationQuery}, USA` : 'General News',
        city: locationQuery || 'General',
        urgencyLevel: 1,
        tags: ['local', 'news'],
        createdAt: article.pubDate,
        type: 'live-news' as const
      }));

    console.log('✅ Fetched', articles.length, 'news articles from NewsData.io for', locationQuery || 'General');
    return articles;

  } catch (error) {
    console.error('❌ Error fetching news from NewsData.io:', error);
    return [];
  }
}

async function fetchNewsFromAPI(locationQuery: string, limit: number = 5) {
  const apiKey = process.env.NEWSAPI_KEY;

  if (!apiKey) {
    console.error('❌ NEWSAPI_KEY not found in environment variables');
    return [];
  }

  // Check cache first
  const cacheKey = `news-${locationQuery}-${limit}`;
  const cached = newsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('📦 Using cached news for', locationQuery);
    return cached.data;
  }

  try {
    console.log('🔄 Fetching fresh news from NewsAPI for', locationQuery);

    // Build query using user location
    let query = locationQuery !== 'General' ? `${locationQuery} AND (local OR community OR government)` : 'general news';

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.append('q', query);
    url.searchParams.append('language', 'en');
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('pageSize', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('❌ NewsAPI error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      console.log('⚠️ No articles returned from NewsAPI');
      return [];
    }

    // Transform and deduplicate articles
    const seenTitles = new Set<string>();
    const articles = data.articles
      .filter((article: NewsAPIArticle) =>
        article.title &&
        !article.title.includes('[Removed]') &&
        article.description
      )
      .filter((article: NewsAPIArticle) => {
        // Normalize title for deduplication
        const normalizedTitle = article.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Check for duplicates
        for (const seenTitle of seenTitles) {
          const similarity = calculateSimilarity(normalizedTitle, seenTitle);
          if (similarity > 0.8) {
            return false;
          }
        }

        seenTitles.add(normalizedTitle);
        return true;
      })
      .slice(0, limit)
      .map((article: NewsAPIArticle) => ({
        id: `live-news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...' || '',
        source: article.source?.name || 'News Source',
        sourceUrl: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        location: locationQuery !== 'General' ? `${locationQuery}, USA` : 'General News',
        city: locationQuery || 'General',
        urgencyLevel: 1,
        tags: ['local', 'news'],
        createdAt: article.publishedAt,
        type: 'live-news' as const
      }));

    // Cache the results
    newsCache.set(cacheKey, { data: articles, timestamp: Date.now() });

    console.log('✅ Fetched', articles.length, 'news articles for', locationQuery || 'General');
    return articles;

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 News API: Checking session...');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('🔐 News API: No valid session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔐 News API: Session valid for user', session.user.id);

    // Get user data for location
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        city: true,
        location: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const tierFilter = searchParams.get('tier') as 'hyper-local' | 'all' | null;

    // Parse user location
    let resolvedLocation: ResolvedLocation | null = null;

    if (user.location) {
      try {
        resolvedLocation = typeof user.location === 'string'
          ? JSON.parse(user.location)
          : user.location;
      } catch (e) {
        console.error('❌ Failed to parse user location:', e);
      }
    }

    // If no location set, return error asking user to set location
    if (!resolvedLocation || !resolvedLocation.coordinates) {
      console.log('⚠️ User has no location set');
      return NextResponse.json({
        success: false,
        error: 'Location not set',
        message: 'Please set your location in profile settings to see personalized news',
        data: []
      }, { status: 400 });
    }

    console.log('📍 Fetching news for:', resolvedLocation.displayName);

    // Check cache first
    const cacheKey = `news-${session.user.id}-${tierFilter || 'all'}-${limit}`;
    const cached = newsCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached news');
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    // Fetch news using enhanced multi-tier system
    let news: NewsArticle[];

    if (tierFilter === 'hyper-local') {
      // Fetch only hyper-local news
      news = await fetchHyperLocalNews(resolvedLocation, limit);
    } else {
      // Fetch multi-tier news (hyper-local + regional + national + global)
      news = await fetchMultiTierNews(resolvedLocation, limit);
    }

    // Cache the results
    newsCache.set(cacheKey, {
      data: news,
      timestamp: Date.now()
    });

    console.log('✅ Returning', news.length, 'articles');
    console.log('📊 Tier distribution:', {
      'hyper-local': news.filter(a => a.tier === 'hyper-local').length,
      'regional': news.filter(a => a.tier === 'regional').length,
      'national': news.filter(a => a.tier === 'national').length,
      'global': news.filter(a => a.tier === 'global').length,
    });

    return NextResponse.json({
      success: true,
      data: news,
      location: resolvedLocation.displayName,
      cached: false
    });

  } catch (error) {
    console.error('❌ Error in live news API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      data: []
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define extended types that include the relations we'll fetch
// These are similar to what was in src/app/page.tsx
// Consider moving these to a shared types file (e.g., src/lib/types.ts) if used elsewhere

interface InitiativeWithCreator extends Prisma.InitiativeGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    society: {
      select: { id: true, name: true, image: true };
    };
    memberships: {
      select: {
        id: true;
        role: true;
        user: {
          select: { id: true, name: true, image: true };
        };
      };
    };
    goals: {
      select: { id: true };
    };
  };
}> {}

interface SocietyWithCreatorForFeed extends Prisma.SocietyGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    memberships: {
      select: {
        id: true;
        role: true;
        user: {
          select: { id:true, name: true, image: true };
        }
      }
    }
  };
}> {}

interface SocietyWithCreator extends Prisma.SocietyGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    memberships: {
      select: {
        id: true;
        role: true;
        user: {
          select: { id: true, name: true, image: true };
        };
      };
    };
  };
}> {}

interface GeneralPostWithCreatorAndMedia extends Prisma.GeneralPostGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, postId: true };
    };
    linkPreview: {
      select: { url: true, title: true, description: true, image: true, siteName: true, favicon: true, type: true };
    };
    links: {
      include: {
        linkPreview: {
          select: { url: true, title: true, description: true, image: true, siteName: true, favicon: true, type: true };
        };
      };
    };
  };
}> {}

interface IssueWithCreator extends Prisma.IssueGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, issueId: true };
    };
    championedBy: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface IdeaWithCreator extends Prisma.IdeaGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, ideaId: true };
    };
    championedBy: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface DebateTopicWithCreatorAndStats extends Prisma.DebateTopicGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    votes: {
      select: { id: true, side: true };
    };
    arguments: {
      select: { id: true };
    };
  };
}> {}

interface UpdateWithUserAndInitiative extends Prisma.UpdateGetPayload<{
  include: {
    user: {
      select: { id: true, name: true, image: true };
    };
    initiative: {
      select: { id: true, title: true };
    };
  };
}> {}

interface UserFollowWithUsers extends Prisma.UserFollowGetPayload<{
  include: {
    follower: {
      select: { id: true, name: true, image: true };
    };
    following: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface InitiativeMembershipWithUserAndInitiative extends Prisma.InitiativeMembershipGetPayload<{
  include: {
    user: {
      select: { id: true, name: true, image: true };
    };
    initiative: {
      select: { id: true, title: true };
    };
  };
}> {}

interface HotTakeBattleWithPosts extends Prisma.HotTakeBattleGetPayload<{
  include: {
    post1: {
      select: {
        id: true;
        content: true;
        creatorName: true;
        creatorAvatar: true;
        timestamp: true;
      };
    };
    post2: {
      select: {
        id: true;
        content: true;
        creatorName: true;
        creatorAvatar: true;
        timestamp: true;
      };
    };
  };
}> {}

// News integration types
interface LiveNewsPost {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  location?: string;
  city?: string;
  urgencyLevel: number;
  tags: string[];
  createdAt: string;
  type: 'live-news';
}

// Unified feed item types
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'update' | 'follow' | 'initiativeJoin' | 'societyCreate' | 'debate' | 'hotTakeBattle' | 'live-news';

interface SocietyPostWithUserAndSociety {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
  imageUrl?: string;
  linkPreview?: {
    url: string;
    title?: string | null;
    description?: string | null;
    image?: string | null;
    siteName?: string | null;
    favicon?: string | null;
    type?: string | null;
  } | null;
  links?: {
    id: string;
    order: number;
    linkPreview: {
      url: string;
      title?: string | null;
      description?: string | null;
      image?: string | null;
      siteName?: string | null;
      favicon?: string | null;
      type?: string | null;
    };
  }[];
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  society: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | SocietyWithCreatorForFeed | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats | HotTakeBattleWithPosts | UpdateWithUserAndInitiative | UserFollowWithUsers | InitiativeMembershipWithUserAndInitiative | LiveNewsPost;
}

// Legacy type for backward compatibility
export type ApiFeedItem = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator;

// In-memory cache for news articles
const newsCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT = 3000; // 3 seconds timeout

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
      url.searchParams.append('q', locationQuery);
      url.searchParams.append('category', 'politics,top,environment,business');
    } else {
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
        const normalizedTitle = article.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

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
        const normalizedTitle = article.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

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

// Enhanced live news fetching function with nearby areas expansion and fallback
async function fetchLiveNews(user: any, limit: number = 1) {
  try {
    console.log('📍 Fetching enhanced news for user:', user.id);

    // Parse user location data for search query
    let locationQuery = '';
    if (user.location) {
      try {
        const location = typeof user.location === 'string' ? JSON.parse(user.location) : user.location;
        locationQuery = location.displayName || location.county || location.city || user.city || 'General';
      } catch (e) {
        locationQuery = user.location;
      }
    } else if (user.city) {
      locationQuery = user.city;
    } else {
      locationQuery = 'General';
    }

    console.log('📍 Using location query:', locationQuery);

    // Get nearby areas to expand search if needed
    let nearbyAreas: string[] = [];
    if (user.location) {
      try {
        const location = typeof user.location === 'string' ? JSON.parse(user.location) : user.location;
        console.log('📍 User location data:', JSON.stringify(location));

        let lat, lng;
        if (location.coordinates) {
          lat = location.coordinates.lat;
          lng = location.coordinates.lng;
        } else if (location.lat && location.lng) {
          lat = location.lat;
          lng = location.lng;
        }

        if (lat && lng) {
          console.log('🗺️ Using coordinates for nearby areas:', lat, lng);
          const nearbyResponse = await fetch(
            `${process.env.NEXTAUTH_URL}/api/nearby-areas?lat=${lat}&lng=${lng}&radius=25`,
            {
              headers: {
                'User-Agent': 'Society+ App',
                'Cookie': '' // No auth needed for internal call
              }
            }
          );
          if (nearbyResponse.ok) {
            const nearbyData = await nearbyResponse.json();
            nearbyAreas = nearbyData.areas || [];
            console.log('🗺️ Found nearby areas:', nearbyAreas);
          } else {
            console.log('⚠️ Nearby areas API failed:', nearbyResponse.status);
          }
        } else {
          console.log('⚠️ No coordinates found in user location data');
        }
      } catch (e) {
        console.log('⚠️ Could not fetch nearby areas:', e);
      }
    } else {
      console.log('⚠️ User has no location data set');
    }

    // Fetch news with fallback
    let news = await fetchNewsFromAPI(locationQuery, limit);

    // If NewsAPI fails or returns no results, try NewsData.io as backup
    if (news.length === 0) {
      console.log('🔄 NewsAPI returned no results, trying NewsData.io as backup...');
      news = await fetchNewsFromNewsData(locationQuery, limit);
    }

    // If still no results and we have nearby areas, try with expanded query
    if (news.length < 3 && nearbyAreas.length > 0) {
      console.log('🔄 Expanding search with nearby areas for more content...');
      const expandedQuery = `${locationQuery} OR ${nearbyAreas.slice(0, 3).join(' OR ')}`;
      const additionalNews = await fetchNewsFromNewsData(expandedQuery, limit * 2);

      // Merge and deduplicate
      const combinedNews = [...news, ...additionalNews];
      const seenTitles = new Set<string>();

      news = combinedNews.filter(article => {
        const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        for (const seenTitle of seenTitles) {
          if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
            return false;
          }
        }
        seenTitles.add(normalizedTitle);
        return true;
      }).slice(0, limit);
    }

    console.log('📰 Enhanced news fetch: Returning', news.length, 'articles');
    return news;

  } catch (error) {
    console.error('❌ Error fetching enhanced live news:', error);
    return [];
  }
}

async function getUnifiedFeedItems(cursor?: string, pageSize: number = 20, includeNews: boolean = false, newsLimit: number = 1): Promise<{ items: UnifiedFeedItem[], nextCursor: string | null, hasMore: boolean }> {
  // Parse cursor to get timestamp
  const cursorDate = cursor ? new Date(cursor) : new Date();

  // Fetch all content and meta actions in parallel with proper cursor-based pagination
  const [initiatives, generalPosts, societyPosts, societies, issues, ideas, debates, hotTakeBattles, updates, follows, joins] = await Promise.all([
    prisma.initiative.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        society: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        memberships: {
          select: {
            id: true,
            role: true,
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        goals: {
          select: { id: true },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 4), // Distribute across content types
    }),
    prisma.generalPost.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            postId: true,
          },
        },
        linkPreview: {
          select: {
            url: true,
            title: true,
            description: true,
            image: true,
            siteName: true,
            favicon: true,
            type: true,
          },
        },
        links: {
          include: {
            linkPreview: {
              select: {
                url: true,
                title: true,
                description: true,
                image: true,
                siteName: true,
                favicon: true,
                type: true,
              },
            },
          },
          orderBy: {
            order: 'asc'
          }
        },
      },
      where: {
        timestamp: {
          lt: cursorDate,
        },
        moderationStatus: 'approved', // Only show approved posts
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: Math.ceil(pageSize / 4),
    }),
    prisma.societyPost.findMany({
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        society: {
          select: { id: true, name: true, image: true },
        },
        linkPreview: {
          select: {
            url: true,
            title: true,
            description: true,
            image: true,
            siteName: true,
            favicon: true,
            type: true,
          },
        },
        links: {
          include: {
            linkPreview: {
              select: {
                url: true,
                title: true,
                description: true,
                image: true,
                siteName: true,
                favicon: true,
                type: true,
              },
            },
          },
          orderBy: {
            order: 'asc'
          }
        },
        documents: {
          include: {
            document: {
              select: {
                url: true,
                filename: true,
                fileType: true,
                fileSize: true,
                extension: true,
                title: true,
                description: true,
              },
            },
          },
          orderBy: {
            order: 'asc'
          }
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(pageSize / 4),
    }),
    prisma.society.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        memberships: {
          select: {
            id: true,
            role: true,
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(pageSize / 4), // Show societies alongside other content chronologically
    }),
    prisma.issue.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            issueId: true,
          },
        },
        championedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
        moderationStatus: 'approved', // Only show approved issues
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.idea.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            ideaId: true,
          },
        },
        championedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
        moderationStatus: 'approved', // Only show approved ideas
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.debateTopic.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        votes: {
          select: {
            id: true,
            side: true,
          },
        },
        arguments: {
          select: {
            id: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    // Hot Take Battles
    prisma.hotTakeBattle.findMany({
      include: {
        post1: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true,
          },
        },
        post2: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.update.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.userFollow.findMany({
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        following: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.initiativeMembership.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
  ]);

  // Normalize all items to unified format
  const feedItems: UnifiedFeedItem[] = [
    ...initiatives.map(i => ({
      type: 'initiative' as const,
      id: i.id,
      timestamp: i.createdAt,
      data: i
    })),
    ...generalPosts.map(p => ({
      type: 'generalPost' as const,
      id: p.id,
      timestamp: p.timestamp,
      data: p as GeneralPostWithCreatorAndMedia
    })),
    ...societyPosts.map(sp => ({
      type: 'societyPost' as const,
      id: sp.id,
      timestamp: new Date(sp.createdAt),
      data: {
        ...sp,
        createdAt: new Date(sp.createdAt),
        type: sp.type,
        user: {
          ...sp.user,
          name: sp.user?.name ?? '',
        },
        society: {
          ...sp.society,
          name: sp.society?.name ?? '',
        },
        imageUrl: sp.imageUrl ?? undefined,
        linkPreview: sp.linkPreview || undefined,
        links: sp.links || [],
        documents: sp.documents || [],
        // Add media array for display component compatibility
        media: sp.imageUrl ? [{
          type: (() => {
            const lowerUrl = sp.imageUrl!.toLowerCase();

            // Check for audio extensions
            if (lowerUrl.includes('.mp3') ||
                lowerUrl.includes('.wav') ||
                lowerUrl.includes('.m4a') ||
                lowerUrl.includes('.aac') ||
                lowerUrl.includes('.ogg') ||
                lowerUrl.includes('.flac')) {
              return 'audio';
            }

            // Check for video extensions
            if (lowerUrl.includes('.mp4') ||
                lowerUrl.includes('.webm') ||
                lowerUrl.includes('.mov') ||
                lowerUrl.includes('.avi') ||
                lowerUrl.includes('.mkv') ||
                lowerUrl.includes('.wmv') ||
                lowerUrl.includes('.flv') ||
                lowerUrl.includes('.m4v')) {
              return 'video';
            }

            // Default to image
            return 'image';
          })(),
          url: sp.imageUrl
        }] : []
      }
    })),
    ...societies.map(s => ({
      type: 'societyCreate' as const,
      id: s.id,
      timestamp: s.createdAt,
      data: s
    })),
    ...issues.map(i => ({
      type: 'issue' as const,
      id: i.id,
      timestamp: i.createdAt,
      data: i
    })),
    ...ideas.map(i => ({
      type: 'idea' as const,
      id: i.id,
      timestamp: i.createdAt,
      data: i
    })),
    ...debates.map(d => ({
      type: 'debate' as const,
      id: d.id,
      timestamp: d.createdAt,
      data: d
    })),
    ...hotTakeBattles.map(b => ({
      type: 'hotTakeBattle' as const,
      id: b.id,
      timestamp: b.createdAt,
      data: b
    })),
    ...updates.map(u => ({
      type: 'update' as const,
      id: u.id,
      timestamp: u.createdAt,
      data: u
    })),
    ...follows.map(f => ({
      type: 'follow' as const,
      id: f.id,
      timestamp: f.createdAt,
      data: f
    })),
    ...joins.map(j => ({
      type: 'initiativeJoin' as const,
      id: j.id,
      timestamp: j.createdAt,
      data: j
    })),
  ];

  // Add news if requested
  if (includeNews) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            city: true,
            location: true,
          },
        });

        if (user) {
          const newsArticles = await fetchLiveNews(user, newsLimit);
          const newsItems = newsArticles.map((article: any) => ({
            type: 'live-news' as const,
            id: article.id,
            timestamp: new Date(article.publishedAt),
            data: article
          }));
          feedItems.push(...newsItems);
        }
      }
    } catch (error) {
      console.error('Error fetching news for feed:', error);
    }
  }

  // Sort by timestamp descending
  feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Deduplicate: Remove meta actions that are immediately followed by their related content
  const deduped: UnifiedFeedItem[] = [];
  const seenContent = new Set<string>();

  for (const item of feedItems) {
    let shouldSkip = false;

    // Check for redundant meta actions
    if (item.type === 'update') {
      const update = item.data as UpdateWithUserAndInitiative;
      // Skip update if it's about a post and we've already seen that post
      if (update.type === 'post' && update.details && typeof update.details === 'object' && 'postId' in update.details) {
        const postId = (update.details as any).postId;
        if (seenContent.has(postId)) {
          shouldSkip = true;
        }
      }
    } else if (item.type === 'initiativeJoin') {
      const join = item.data as InitiativeMembershipWithUserAndInitiative;
      // Skip join if we've already seen the initiative being created
      if (seenContent.has(join.initiativeId)) {
        shouldSkip = true;
      }
    } else if (item.type === 'follow') {
      const follow = item.data as UserFollowWithUsers;
      // Skip follow if we've already seen the followed user's recent activity
      if (seenContent.has(follow.followingId)) {
        shouldSkip = true;
      }
    }

    // Track content items for deduplication
    if (['initiative', 'generalPost', 'issue', 'idea'].includes(item.type)) {
      seenContent.add(item.id);
    }

    if (!shouldSkip) {
      deduped.push(item);
    }
  }

  // Get final items limited to pageSize
  const finalItems = deduped.slice(0, pageSize);

  // Generate next cursor from the last item's timestamp
  const nextCursor = finalItems.length > 0
    ? finalItems[finalItems.length - 1].timestamp.toISOString()
    : null;

  // Check if there are more items by checking if any content type returned its full limit
  const hasMore = deduped.length > pageSize ||
    (initiatives.length === Math.ceil(pageSize / 4) ||
     generalPosts.length === Math.ceil(pageSize / 4) ||
     societyPosts.length === Math.ceil(pageSize / 4) ||
     issues.length === Math.ceil(pageSize / 8) ||
     ideas.length === Math.ceil(pageSize / 8) ||
     debates.length === Math.ceil(pageSize / 8) ||
     updates.length === Math.ceil(pageSize / 8) ||
     follows.length === Math.ceil(pageSize / 8) ||
     joins.length === Math.ceil(pageSize / 8));

  return {
    items: finalItems,
    nextCursor,
    hasMore,
  };
}

// Legacy function for backward compatibility
async function getFeedItemsFromDb(page: number = 1, pageSize: number = 10): Promise<ApiFeedItem[]> {
  const unifiedItems = await getUnifiedFeedItems(undefined, pageSize, false);
  return unifiedItems.items
    .filter(item => ['initiative', 'generalPost', 'issue', 'idea'].includes(item.type))
    .map(item => item.data as ApiFeedItem);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const unified = searchParams.get('unified') === 'true';
  const feedType = searchParams.get('type') || 'all'; // 'all' or 'news'

  // Legacy support
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    if (unified) {
      // Determine news inclusion based on feedType
      const includeNews = feedType === 'all' || feedType === 'news';
      const newsLimit = feedType === 'news' ? 10 : 3; // More news for news tab, 3 for all activity (was 1)

      // Use cursor-based pagination if cursor is provided, otherwise use legacy
      if (cursor !== undefined || !searchParams.has('page')) {
        const result = await getUnifiedFeedItems(cursor, limit, includeNews, newsLimit);
        return NextResponse.json({
          items: result.items,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
            limit,
          }
        });
      } else {
        // Legacy support - return old format
        const result = await getUnifiedFeedItems(undefined, pageSize, includeNews, newsLimit);
        return NextResponse.json(result.items);
      }
    } else {
      // Legacy endpoint for backward compatibility
      const feedItems = await getFeedItemsFromDb(page, pageSize);
      return NextResponse.json(feedItems);
    }
  } catch (error) {
    console.error('Error fetching feed items:', error);
    return NextResponse.json({ error: 'Failed to fetch feed items' }, { status: 500 });
  }
}
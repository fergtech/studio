import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Cache for 60 seconds to balance freshness with performance
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    console.log('🔍 Fetching trending topics from database...');

    // Get all topics with debates OR general posts
    const allTopics = await prisma.topic.findMany({
      where: {
        OR: [
          { debateCount: { gt: 0 } },
          { postCount: { gt: 0 } }
        ]
      },
      orderBy: [
        { debateCount: 'desc' },  // Most debates first
        { postCount: 'desc' },    // Then most posts
        { name: 'asc' }           // Then alphabetical
      ],
      select: {
        id: true,
        name: true,
        postCount: true,
        weeklyPosts: true,
        debateCount: true,
        weeklyDebates: true,
        category: true,
        debateTopics: {
          where: {
            debate: {
              OR: [
                { moderationStatus: 'approved' },
                { moderationStatus: null }, // Include existing debates without moderation status
              ]
            }
          },
          orderBy: {
            debate: {
              createdAt: 'desc' // Order by debate creation time
            }
          },
          select: {
            debate: {
              select: {
                id: true,
                title: true,
                content: true,
                creatorId: true,
                createdAt: true,
                imageUrl: true,
                creator: {
                  select: {
                    name: true,
                    username: true,
                    image: true
                  }
                }
              }
            }
          }
        },
        postTopics: {
          where: {
            post: {
              OR: [
                { moderationStatus: 'approved' },
                { moderationStatus: null }, // Include existing posts without moderation status
              ]
            }
          },
          orderBy: {
            post: {
              timestamp: 'desc' // Order by post timestamp
            }
          },
          select: {
            post: {
              select: {
                id: true,
                content: true,
                creatorId: true,
                timestamp: true,
                background: true,
                media: {
                  take: 1, // Get first media item for thumbnail
                  select: {
                    url: true,
                    type: true
                  }
                },
                creator: {
                  select: {
                    name: true,
                    username: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${allTopics.length} topics with debates and/or posts in database`);

    // Take only the requested limit (no multi-creator filter for early growth)
    const trendingTopics = allTopics.slice(0, limit);

    console.log(`✅ Returning ${trendingTopics.length} topics`);

    // Format for the widget with data from both debates and posts
    const formattedTopics = trendingTopics.map(topic => {
      // Collect all content from both debates and posts for thumbnail selection
      const allContent = [];

      // Add debates
      for (const dt of topic.debateTopics) {
        allContent.push({
          id: dt.debate.id,
          content: dt.debate.content,
          timestamp: dt.debate.createdAt,
          thumbnail: dt.debate.imageUrl ? {
            url: dt.debate.imageUrl,
            type: 'image'
          } : null,
          creator: dt.debate.creator,
          type: 'debate'
        });
      }

      // Add general posts
      for (const pt of topic.postTopics) {
        allContent.push({
          id: pt.post.id,
          content: pt.post.content,
          timestamp: pt.post.timestamp,
          thumbnail: pt.post.media[0] ? {
            url: pt.post.media[0].url,
            type: pt.post.media[0].type.toLowerCase()
          } : (pt.post.background ? {
            url: pt.post.background,
            type: 'image'
          } : null),
          creator: pt.post.creator,
          type: 'post'
        });
      }

      // Sort by timestamp (most recent first) and find first with media
      allContent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const contentWithMedia = allContent.find(c => c.thumbnail);
      const latestContent = contentWithMedia || allContent[0];

      console.log(`🖼️ Topic "${topic.name}": debates=${topic.debateTopics.length}, posts=${topic.postTopics.length}, selected content=${latestContent?.id}, has media=${!!latestContent?.thumbnail}`,
        latestContent ? {
          totalDebates: topic.debateTopics.length,
          totalPosts: topic.postTopics.length,
          selectedType: latestContent.type,
          thumbnailUrl: latestContent.thumbnail?.url?.substring(0, 60)
        } : null);

      return {
        topic: topic.name,
        count: topic.debateCount + topic.postCount, // Combined count
        category: topic.category,
        // Include latest content data for thumbnail
        latestPost: latestContent ? {
          id: latestContent.id,
          content: latestContent.content.substring(0, 100), // Preview text
          timestamp: latestContent.timestamp,
          thumbnail: latestContent.thumbnail,
          author: {
            name: latestContent.creator.name,
            username: latestContent.creator.username,
            image: latestContent.creator.image
          }
        } : null
      };
    });

    // Fallback: If no database topics found, use the old system
    if (formattedTopics.length === 0) {
      console.log('⚠️ No database topics found, falling back to old system...');

      // Get all posts with topics from the last 7 days
      const recentPosts = await prisma.generalPost.findMany({
        where: {
          OR: [
            { moderationStatus: 'approved' },
            { moderationStatus: null }, // Include existing posts without moderation status
          ],
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          },
          topics: {
            isEmpty: false // Only posts that have topics
          }
        },
        select: {
          topics: true
        }
      });

      // Count topic frequencies
      const topicCounts = new Map<string, number>();

      recentPosts.forEach(post => {
        post.topics.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      });

      // Convert to array and sort by count
      const fallbackTopics = Array.from(topicCounts.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      const fallbackResponse = NextResponse.json({
        topics: fallbackTopics,
        total: fallbackTopics.length,
        source: 'fallback'
      });

      // Smart caching for fallback too
      fallbackResponse.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=30'
      );

      return fallbackResponse;
    }

    const response = NextResponse.json({
      topics: formattedTopics,
      total: formattedTopics.length,
      source: 'database'
    });

    // Smart caching: 60s cache with stale-while-revalidate
    // This serves cached data instantly while fetching fresh data in background
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=30'
    );

    return response;

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    console.log('🔍 Fetching trending topics from database...');

    // Get trending topics from the Topic table with latest post that has media
    const allTopics = await prisma.topic.findMany({
      where: {
        postCount: { gte: 2 } // At least 2 posts (changed from gt: 0)
      },
      orderBy: [
        { weeklyPosts: 'desc' },  // Most recent activity first
        { postCount: 'desc' }     // Then total popularity
      ],
      select: {
        id: true,
        name: true,
        postCount: true,
        weeklyPosts: true,
        category: true,
        postTopics: {
          where: {
            post: {
              moderationStatus: 'approved' // Only get approved posts
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

    console.log(`📊 Found ${allTopics.length} topics with 2+ posts`);

    // Filter topics with 2+ unique creators
    const trendingTopics = allTopics.filter(topic => {
      const uniqueCreators = new Set(topic.postTopics.map(pt => pt.post.creatorId));
      return uniqueCreators.size >= 2;
    }).slice(0, limit); // Take only the requested limit

    console.log(`✅ Filtered to ${trendingTopics.length} topics with 2+ creators`);

    console.log(`📊 Found ${trendingTopics.length} trending topics`);

    // Format for the widget with thumbnail data
    const formattedTopics = trendingTopics.map(topic => {
      // Find first post with media from the posts array
      const postWithMedia = topic.postTopics.find(pt => pt.post.media.length > 0);
      const latestPost = postWithMedia?.post || topic.postTopics[0]?.post;

      // Get thumbnail from media relation
      const thumbnail = latestPost?.media[0];

      console.log(`🖼️ Topic "${topic.name}": posts=${topic.postTopics.length}, selected post=${latestPost?.id}, has media=${!!thumbnail}`,
        latestPost ? {
          totalPosts: topic.postTopics.length,
          postsWithMedia: topic.postTopics.filter(pt => pt.post.media.length > 0).length,
          selectedPostMediaCount: latestPost.media?.length || 0,
          thumbnailUrl: thumbnail?.url?.substring(0, 60)
        } : null);

      return {
        topic: topic.name,
        count: topic.postCount,
        category: topic.category,
        // Include latest post data for thumbnail
        latestPost: latestPost ? {
          id: latestPost.id,
          content: latestPost.content.substring(0, 100), // Preview text
          timestamp: latestPost.timestamp,
          thumbnail: thumbnail ? {
            url: thumbnail.url,
            type: thumbnail.type
          } : null,
          author: {
            name: latestPost.creator.name,
            username: latestPost.creator.username,
            image: latestPost.creator.image
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
          moderationStatus: 'approved', // Only approved posts
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

      return NextResponse.json({
        topics: fallbackTopics,
        total: fallbackTopics.length,
        source: 'fallback'
      });
    }

    return NextResponse.json({
      topics: formattedTopics,
      total: formattedTopics.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
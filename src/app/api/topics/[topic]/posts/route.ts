import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Next.js 15 compatible async params
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  try {
    const { topic } = await params;
    const decodedTopic = decodeURIComponent(topic);

    // Fetch posts using the new relational system
    const posts = await prisma.generalPost.findMany({
      where: {
        OR: [
          // New relational system
          {
            postTopics: {
              some: {
                topic: {
                  name: {
                    equals: decodedTopic,
                    mode: 'insensitive'
                  }
                }
              }
            }
          },
          // Fallback to old array system for compatibility
          {
            topics: {
              has: decodedTopic
            }
          }
        ]
      },
      select: {
        id: true,
        creatorId: true,
        creatorName: true,
        creatorAvatar: true,
        content: true,
        topics: true,
        timestamp: true,
        background: true,
        media: {
          select: {
            id: true,
            url: true,
            type: true,
          }
        },
        // Include relational topics
        postTopics: {
          select: {
            topic: {
              select: {
                name: true,
                category: true
              }
            },
            confidence: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Limit to 50 posts
    });

    // Get topic statistics
    const totalPosts = posts.length;

    // Get Hot Take Battles for this topic
    const activeBattles = await prisma.hotTakeBattle.count({
      where: {
        topic: decodedTopic,
        status: 'ACTIVE'
      }
    });

    // Get top contributors (users who post most about this topic)
    const contributorCounts = await prisma.generalPost.groupBy({
      by: ['creatorName'],
      where: {
        topics: {
          has: decodedTopic
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const topContributors = contributorCounts.map(c => c.creatorName);

    // Get related topics (topics that appear together with this topic)
    const relatedTopicsQuery = await prisma.generalPost.findMany({
      where: {
        topics: {
          has: decodedTopic
        }
      },
      select: {
        topics: true
      }
    });

    const topicCounts = new Map<string, number>();
    relatedTopicsQuery.forEach(post => {
      post.topics.forEach(postTopic => {
        if (postTopic !== decodedTopic) {
          topicCounts.set(postTopic, (topicCounts.get(postTopic) || 0) + 1);
        }
      });
    });

    const relatedTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);

    const stats = {
      totalPosts,
      activeBattles,
      topContributors,
      relatedTopics
    };

    return NextResponse.json({
      posts: posts.map(post => {
        // Merge old topics array with new relational topics
        const relationalTopics = post.postTopics.map(pt => pt.topic.name);
        const allTopics = [...new Set([...post.topics, ...relationalTopics])]; // Remove duplicates

        return {
          ...post,
          topics: allTopics, // Use combined topics
          timestamp: post.timestamp.toISOString()
        };
      }),
      stats
    });

  } catch (error) {
    console.error('Error fetching topic posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic posts' },
      { status: 500 }
    );
  }
}
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

    // Fetch debates using the new relational system
    const debates = await prisma.debateTopic.findMany({
      where: {
        OR: [
          { moderationStatus: 'approved' },
          { moderationStatus: null }
        ],
        AND: {
          OR: [
            // New relational system
            {
              debateTopics: {
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
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        },
        votes: {
          select: {
            side: true,
          }
        },
        _count: {
          select: {
            arguments: true,
          }
        },
        // Include relational topics
        debateTopics: {
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
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 debates
    });

    // Fetch general posts using the new relational system
    const posts = await prisma.generalPost.findMany({
      where: {
        OR: [
          { moderationStatus: 'approved' },
          { moderationStatus: null }
        ],
        AND: {
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
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        },
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
    const totalDebates = debates.length;
    const totalPosts = posts.length;

    // Get top contributors (users who create most content about this topic - debates + posts)
    const allContributorIds = [
      ...debates.map(d => d.creatorId),
      ...posts.map(p => p.creatorId)
    ];

    const contributorCountMap = new Map<string, number>();
    allContributorIds.forEach(id => {
      contributorCountMap.set(id, (contributorCountMap.get(id) || 0) + 1);
    });

    const topContributorIds = Array.from(contributorCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const contributors = await prisma.user.findMany({
      where: { id: { in: topContributorIds } },
      select: { id: true, name: true }
    });
    const contributorMap = new Map(contributors.map(c => [c.id, c.name || 'Anonymous']));
    const topContributors = topContributorIds.map(id => contributorMap.get(id) || 'Anonymous');

    // Get related topics (topics that appear together with this topic)
    const relatedTopicsQuery = await prisma.debateTopic.findMany({
      where: {
        moderationStatus: 'approved',
        OR: [
          {
            debateTopics: {
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
          {
            topics: {
              has: decodedTopic
            }
          }
        ]
      },
      select: {
        topics: true,
        debateTopics: {
          select: {
            topic: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const topicCounts = new Map<string, number>();
    relatedTopicsQuery.forEach(debate => {
      // Count from old topics array
      debate.topics.forEach(debateTopic => {
        if (debateTopic !== decodedTopic) {
          topicCounts.set(debateTopic, (topicCounts.get(debateTopic) || 0) + 1);
        }
      });
      // Count from new relational topics
      debate.debateTopics.forEach(dt => {
        const topicName = dt.topic.name;
        if (topicName !== decodedTopic) {
          topicCounts.set(topicName, (topicCounts.get(topicName) || 0) + 1);
        }
      });
    });

    const relatedTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);

    const stats = {
      totalDebates,
      totalPosts,
      totalContent: totalDebates + totalPosts,
      activeBattles: 0, // No longer showing battles
      topContributors,
      relatedTopics
    };

    // Calculate vote statistics for each debate
    const debatesWithStats = debates.map(debate => {
      const proVotes = debate.votes.filter(vote => vote.side === 'PRO').length;
      const conVotes = debate.votes.filter(vote => vote.side === 'CON').length;
      const totalVotes = proVotes + conVotes;

      // Merge old topics array with new relational topics
      const relationalTopics = debate.debateTopics.map(dt => dt.topic.name);
      const allTopics = [...new Set([...debate.topics, ...relationalTopics])]; // Remove duplicates

      return {
        id: debate.id,
        title: debate.title,
        content: debate.content,
        imageUrl: debate.imageUrl,
        creatorId: debate.creatorId,
        topics: allTopics,
        createdAt: debate.createdAt.toISOString(),
        creator: debate.creator,
        stats: {
          proVotes,
          conVotes,
          totalVotes,
          proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
          conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
          argumentCount: debate._count.arguments,
        },
      };
    });

    // Transform general posts to match expected format
    const postsTransformed = posts.map(post => {
      // Merge old topics array with new relational topics
      const relationalTopics = post.postTopics.map(pt => pt.topic.name);
      const allTopics = [...new Set([...post.topics, ...relationalTopics])]; // Remove duplicates

      return {
        id: post.id,
        content: post.content,
        background: post.background,
        creatorId: post.creatorId,
        topics: allTopics,
        timestamp: post.timestamp.toISOString(),
        creator: post.creator,
        media: post.media.map(m => ({
          id: m.id,
          url: m.url,
          type: m.type.toLowerCase()
        })),
        stats: {
          likes: post._count.likes,
          comments: post._count.comments,
          shares: post._count.shares
        },
        type: 'post' // Add type to distinguish from debates
      };
    });

    return NextResponse.json({
      debates: debatesWithStats,
      posts: postsTransformed,
      stats
    });

  } catch (error) {
    console.error('Error fetching topic debates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic debates' },
      { status: 500 }
    );
  }
}
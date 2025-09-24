import { prisma } from '@/lib/prisma';
import { detectOpposingViewpoints } from './topicDetection';
import { HotTakeBattleStatus, HotTakeStance } from '@prisma/client';

export interface HotTakeBattleDetectionResult {
  shouldCreateBattle: boolean;
  confidence: number;
  battleTitle?: string;
  battleDescription?: string;
  sharedTopic?: string;
}

export interface HotTakeBattleWithPosts {
  id: string;
  topic: string;
  title: string;
  description?: string;
  status: HotTakeBattleStatus;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  totalParticipants: number;
  post1Supporters: number;
  post2Supporters: number;
  neutralTakes: number;
  post1: {
    id: string;
    content: string;
    creatorName: string;
    creatorAvatar?: string;
    timestamp: Date;
  };
  post2: {
    id: string;
    content: string;
    creatorName: string;
    creatorAvatar?: string;
    timestamp: Date;
  };
}

/**
 * Checks if a new post should trigger a Hot Take Battle
 * by finding recent opposing posts on the same topic
 */
export async function checkForHotTakeBattleOpportunity(
  newPostId: string,
  content: string,
  topics: string[],
  location?: string
): Promise<HotTakeBattleDetectionResult> {
  if (!topics || topics.length === 0) {
    return { shouldCreateBattle: false, confidence: 0 };
  }

  try {
    // Find recent posts with overlapping topics (last 7 days)
    const recentPosts = await prisma.generalPost.findMany({
      where: {
        topics: {
          hasSome: topics
        },
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        id: {
          not: newPostId // Exclude the new post itself
        },
        // Exclude posts already in battles
        AND: [
          { battleAsPost1: { none: {} } },
          { battleAsPost2: { none: {} } }
        ]
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10 // Check last 10 posts
    });

    if (recentPosts.length === 0) {
      return { shouldCreateBattle: false, confidence: 0 };
    }

    // Check each recent post for opposing viewpoints
    for (const candidatePost of recentPosts) {
      const oppositionResult = await detectOpposingViewpoints(content, candidatePost.content);

      if (oppositionResult.isOpposing && oppositionResult.confidence > 0.3) { // Lowered threshold for testing
        // Find the shared topic
        const sharedTopics = topics.filter(topic => candidatePost.topics.includes(topic));
        const sharedTopic = sharedTopics[0] || topics[0];

        return {
          shouldCreateBattle: true,
          confidence: oppositionResult.confidence,
          sharedTopic,
          battleTitle: `${sharedTopic.charAt(0).toUpperCase() + sharedTopic.slice(1)} Hot Take Battle`,
          battleDescription: oppositionResult.summary
        };
      }
    }

    return { shouldCreateBattle: false, confidence: 0 };
  } catch (error) {
    console.error('Error checking for Hot Take Battle opportunity:', error);
    return { shouldCreateBattle: false, confidence: 0 };
  }
}

/**
 * Creates a new Hot Take Battle between two posts
 */
export async function createHotTakeBattle({
  post1Id,
  post2Id,
  topic,
  title,
  description,
  location
}: {
  post1Id: string;
  post2Id: string;
  topic: string;
  title: string;
  description?: string;
  location?: string;
}): Promise<HotTakeBattleWithPosts | null> {
  try {
    const battle = await prisma.hotTakeBattle.create({
      data: {
        post1Id,
        post2Id,
        topic,
        title,
        description,
        location,
        status: HotTakeBattleStatus.ACTIVE
      },
      include: {
        post1: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true
          }
        },
        post2: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true
          }
        }
      }
    });

    return {
      id: battle.id,
      topic: battle.topic,
      title: battle.title,
      description: battle.description || undefined,
      status: battle.status,
      createdAt: battle.createdAt,
      updatedAt: battle.updatedAt,
      location: battle.location || undefined,
      totalParticipants: battle.totalParticipants,
      post1Supporters: battle.post1Supporters,
      post2Supporters: battle.post2Supporters,
      neutralTakes: battle.neutralTakes,
      post1: battle.post1,
      post2: battle.post2
    };
  } catch (error) {
    console.error('Error creating Hot Take Battle:', error);
    return null;
  }
}

/**
 * Get active Hot Take Battles in a specific area
 */
export async function getActiveBattlesInArea(location?: string): Promise<HotTakeBattleWithPosts[]> {
  try {
    const battles = await prisma.hotTakeBattle.findMany({
      where: {
        status: HotTakeBattleStatus.ACTIVE,
        ...(location && {
          OR: [
            { location: location },
            { location: null } // Include global battles
          ]
        })
      },
      include: {
        post1: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true
          }
        },
        post2: {
          select: {
            id: true,
            content: true,
            creatorName: true,
            creatorAvatar: true,
            timestamp: true
          }
        }
      },
      orderBy: [
        { totalParticipants: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    return battles.map(battle => ({
      id: battle.id,
      topic: battle.topic,
      title: battle.title,
      description: battle.description || undefined,
      status: battle.status,
      createdAt: battle.createdAt,
      updatedAt: battle.updatedAt,
      location: battle.location || undefined,
      totalParticipants: battle.totalParticipants,
      post1Supporters: battle.post1Supporters,
      post2Supporters: battle.post2Supporters,
      neutralTakes: battle.neutralTakes,
      post1: battle.post1,
      post2: battle.post2
    }));
  } catch (error) {
    console.error('Error fetching active battles:', error);
    return [];
  }
}

/**
 * Join a Hot Take Battle by supporting one side
 */
export async function joinHotTakeBattle({
  battleId,
  userId,
  stance,
  takePostId
}: {
  battleId: string;
  userId: string;
  stance: HotTakeStance;
  takePostId?: string;
}): Promise<boolean> {
  try {
    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Create or update participation
      await tx.hotTakeParticipant.upsert({
        where: {
          battleId_userId: {
            battleId,
            userId
          }
        },
        create: {
          battleId,
          userId,
          stance,
          takePostId
        },
        update: {
          stance,
          takePostId
        }
      });

      // Update battle statistics
      const participants = await tx.hotTakeParticipant.findMany({
        where: { battleId },
        select: { stance: true }
      });

      const post1Supporters = participants.filter(p => p.stance === HotTakeStance.SUPPORT_POST1).length;
      const post2Supporters = participants.filter(p => p.stance === HotTakeStance.SUPPORT_POST2).length;
      const neutralTakes = participants.filter(p =>
        p.stance === HotTakeStance.NEUTRAL || p.stance === HotTakeStance.CUSTOM_TAKE
      ).length;

      await tx.hotTakeBattle.update({
        where: { id: battleId },
        data: {
          totalParticipants: participants.length,
          post1Supporters,
          post2Supporters,
          neutralTakes
        }
      });

      // If this is a custom take post, link it to the battle
      if (takePostId) {
        await tx.hotTakeRelatedPost.upsert({
          where: {
            battleId_postId: {
              battleId,
              postId: takePostId
            }
          },
          create: {
            battleId,
            postId: takePostId,
            stance
          },
          update: {
            stance
          }
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Error joining Hot Take Battle:', error);
    return false;
  }
}

/**
 * Get user's participation in battles
 */
export async function getUserBattleParticipations(userId: string) {
  try {
    const participations = await prisma.hotTakeParticipant.findMany({
      where: { userId },
      include: {
        battle: {
          include: {
            post1: {
              select: {
                id: true,
                content: true,
                creatorName: true
              }
            },
            post2: {
              select: {
                id: true,
                content: true,
                creatorName: true
              }
            }
          }
        },
        takePost: {
          select: {
            id: true,
            content: true,
            timestamp: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return participations;
  } catch (error) {
    console.error('Error fetching user battle participations:', error);
    return [];
  }
}
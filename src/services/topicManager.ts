// Dynamic topic management system
// Handles creation, retrieval, and management of topics using database relations

import { PrismaClient } from '@prisma/client';
import { detectTopicsEnhanced } from './enhancedTopicDetection';

const prisma = new PrismaClient();

export interface TopicCreationResult {
  topic: {
    id: string;
    name: string;
    category?: string;
    isSystem: boolean;
    confidence?: number;
  };
  isNew: boolean;
}

// Get or create a topic by name
export async function getOrCreateTopic(
  name: string,
  options: {
    category?: string;
    isSystem?: boolean;
    confidence?: number;
    description?: string;
  } = {}
): Promise<TopicCreationResult> {
  try {
    console.log(`🔍 Looking for topic: "${name}"`);

    // First, try to find existing topic (case-insensitive)
    let topic = await prisma.topic.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (topic) {
      console.log(`✅ Found existing topic: "${topic.name}"`);
      return {
        topic: {
          id: topic.id,
          name: topic.name,
          category: topic.category || undefined,
          isSystem: topic.isSystem,
          confidence: topic.confidence || undefined
        },
        isNew: false
      };
    }

    // Create new topic
    console.log(`➕ Creating new topic: "${name}"`);
    topic = await prisma.topic.create({
      data: {
        name: name.toLowerCase(),
        category: options.category || null,
        isSystem: options.isSystem || false,
        confidence: options.confidence || null,
        description: options.description || null,
        postCount: 0,
        weeklyPosts: 0
      }
    });

    console.log(`✨ Created new topic: "${topic.name}" (${topic.id})`);
    return {
      topic: {
        id: topic.id,
        name: topic.name,
        category: topic.category || undefined,
        isSystem: topic.isSystem,
        confidence: topic.confidence || undefined
      },
      isNew: true
    };

  } catch (error) {
    console.error(`❌ Error getting/creating topic "${name}":`, error);
    throw error;
  }
}

// Assign topics to a post using the PostTopic junction table
export async function assignTopicsToPost(
  postId: string,
  topics: string[],
  confidenceScores: { [topicName: string]: number } = {}
): Promise<void> {
  try {
    console.log(`🏷️ Assigning topics to post ${postId}:`, topics);

    // Remove existing topic assignments
    await prisma.postTopic.deleteMany({
      where: { postId }
    });

    // Create new topic assignments
    for (const topicName of topics) {
      // Get or create the topic
      const { topic } = await getOrCreateTopic(topicName, {
        isSystem: true,
        confidence: confidenceScores[topicName] || 0.5
      });

      // Create the PostTopic relationship
      await prisma.postTopic.create({
        data: {
          postId,
          topicId: topic.id,
          confidence: confidenceScores[topicName] || 0.5
        }
      });

      // Update topic post count
      await prisma.topic.update({
        where: { id: topic.id },
        data: {
          postCount: {
            increment: 1
          },
          weeklyPosts: {
            increment: 1
          }
        }
      });
    }

    console.log(`✅ Successfully assigned ${topics.length} topics to post ${postId}`);
  } catch (error) {
    console.error(`❌ Error assigning topics to post ${postId}:`, error);
    throw error;
  }
}

// Get topics for a post
export async function getPostTopics(postId: string): Promise<string[]> {
  try {
    const postTopics = await prisma.postTopic.findMany({
      where: { postId },
      include: { topic: true },
      orderBy: { confidence: 'desc' }
    });

    return postTopics.map(pt => pt.topic.name);
  } catch (error) {
    console.error(`❌ Error getting topics for post ${postId}:`, error);
    return [];
  }
}

// Get trending topics with post counts
export async function getTrendingTopics(limit: number = 10): Promise<Array<{
  name: string;
  postCount: number;
  weeklyPosts: number;
  category?: string;
}>> {
  try {
    const topics = await prisma.topic.findMany({
      where: {
        postCount: { gt: 0 }
      },
      orderBy: [
        { weeklyPosts: 'desc' },
        { postCount: 'desc' }
      ],
      take: limit
    });

    return topics.map(topic => ({
      name: topic.name,
      postCount: topic.postCount,
      weeklyPosts: topic.weeklyPosts,
      category: topic.category || undefined
    }));
  } catch (error) {
    console.error('❌ Error getting trending topics:', error);
    return [];
  }
}

// Process post content and assign topics dynamically
export async function processPostForTopics(
  postId: string,
  content: string
): Promise<string[]> {
  try {
    console.log(`🧠 Processing post ${postId} for dynamic topic assignment`);

    // Use enhanced LLM detection (now async)
    const enhancedResult = await detectTopicsEnhanced(content);

    // Combine all detected topics with confidence scores
    const allTopics = [
      ...enhancedResult.topics,
      ...enhancedResult.dynamicTopics.slice(0, 3) // Add top dynamic topics
    ];

    // Filter out noise words and keep only meaningful topics
    const meaningfulTopics = [...new Set(allTopics)]
      .filter(topic => {
        const t = topic.toLowerCase();
        // Filter out common words, pronouns, articles, etc.
        const noiseWords = [
          'that', 'this', 'these', 'those', 'they', 'them', 'their', 'there', 'theres',
          'what', 'when', 'where', 'why', 'how', 'who', 'which', 'will', 'would', 'could',
          'should', 'have', 'has', 'had', 'been', 'being', 'are', 'was', 'were', 'is',
          'the', 'and', 'but', 'for', 'with', 'from', 'into', 'over', 'under', 'about',
          'food', 'work', 'world', 'real' // Common false positives
        ];

        return (
          topic.length > 2 &&           // At least 3 characters
          topic.length < 25 &&          // Not too long
          !noiseWords.includes(t) &&    // Not a noise word
          !/^\d+$/.test(topic) &&       // Not just numbers
          /^[a-zA-Z0-9_-]+$/.test(topic) // Only alphanumeric, underscore, dash
        );
      })
      .slice(0, 5); // Limit to 5 topics max

    if (meaningfulTopics.length === 0) {
      meaningfulTopics.push('general');
    }

    // Create confidence scores
    const confidenceScores: { [key: string]: number } = {};
    meaningfulTopics.forEach(topic => {
      if (enhancedResult.topics.includes(topic)) {
        confidenceScores[topic] = enhancedResult.confidence;
      } else if (enhancedResult.dynamicTopics.includes(topic)) {
        confidenceScores[topic] = 0.6; // Lower confidence for dynamic topics
      } else {
        confidenceScores[topic] = 0.1; // Fallback confidence
      }
    });

    // Assign topics to post using the new system
    await assignTopicsToPost(postId, meaningfulTopics, confidenceScores);

    console.log(`✅ Assigned topics to post ${postId}:`, meaningfulTopics);
    return meaningfulTopics;

  } catch (error) {
    console.error(`❌ Error processing post ${postId} for topics:`, error);

    // Fallback: assign 'general' topic
    await assignTopicsToPost(postId, ['general'], { general: 0.1 });
    return ['general'];
  }
}

// Migrate from old topics array system to new relational system
export async function migrateOldTopicsToRelational(): Promise<void> {
  try {
    console.log('🔄 Starting migration from topics[] to relational system...');

    // Get all posts with topics in the old format
    const postsWithTopics = await prisma.generalPost.findMany({
      where: {
        topics: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        topics: true,
        content: true
      }
    });

    console.log(`📊 Found ${postsWithTopics.length} posts with existing topics to migrate`);

    let migrated = 0;
    for (const post of postsWithTopics) {
      try {
        // Convert old topics to new system
        if (post.topics.length > 0) {
          await assignTopicsToPost(post.id, post.topics);
          migrated++;
          console.log(`✅ Migrated post ${post.id}: ${post.topics.join(', ')}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating post ${post.id}:`, error);
      }
    }

    console.log(`🎉 Migration complete! Successfully migrated ${migrated}/${postsWithTopics.length} posts`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

export { prisma };
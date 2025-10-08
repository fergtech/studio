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

    // Get existing topic assignments before deleting
    const existingAssignments = await prisma.postTopic.findMany({
      where: { postId },
      include: { topic: true }
    });

    // Decrement counts for topics being removed
    for (const assignment of existingAssignments) {
      await prisma.topic.update({
        where: { id: assignment.topicId },
        data: {
          postCount: { decrement: 1 },
          weeklyPosts: { decrement: 1 }
        }
      });
    }

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

// Smart topic matching: Check existing topics first, create new ones only if needed
async function matchToExistingTopicsWithLLM(
  content: string,
  detectedTopics: string[]
): Promise<{ matchedTopics: string[]; newTopics: string[] }> {
  try {
    // Get trending/popular topics from the database
    const existingTopics = await getTrendingTopics(50); // Get top 50 topics

    if (existingTopics.length === 0) {
      // No existing topics, all detected topics are new
      return { matchedTopics: [], newTopics: detectedTopics };
    }

    // Create a list of existing topic names for the LLM to consider
    const existingTopicNames = existingTopics.map(t => t.name);

    console.log(`🔍 Checking if post matches any of ${existingTopicNames.length} existing topics...`);

    // Use LLM to match detected topics to existing ones
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ No Google AI API key, skipping smart matching');
      return { matchedTopics: [], newTopics: detectedTopics };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a topic matching system. Given a post and its detected topics, decide which existing topics it should use (if similar enough) or if new topics should be created.

Post: "${content.substring(0, 500)}"

Detected topics from content: ${JSON.stringify(detectedTopics)}

Existing topics in the system: ${JSON.stringify(existingTopicNames.slice(0, 30))}

For each detected topic, decide:
1. If it closely matches an existing topic (similar meaning/theme), use the existing one
2. If it's distinct and doesn't match well, keep it as a new topic

Return a JSON object with:
{
  "matched": ["existing-topic-1", "existing-topic-2"],
  "new": ["new-topic-1"]
}

Only match if the topics are truly related. Be conservative - it's better to create a new topic than force a bad match.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    console.log('🤖 LLM topic matching response:', responseText);

    // Parse the response
    const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

    return {
      matchedTopics: Array.isArray(parsed.matched) ? parsed.matched : [],
      newTopics: Array.isArray(parsed.new) ? parsed.new : detectedTopics
    };

  } catch (error) {
    console.error('❌ Error in smart topic matching:', error);
    // Fallback: treat all as new topics
    return { matchedTopics: [], newTopics: detectedTopics };
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

    // 🆕 Smart matching: Check existing topics first
    const { matchedTopics, newTopics } = await matchToExistingTopicsWithLLM(content, meaningfulTopics);

    // Combine matched existing topics with new topics
    const finalTopics = [...matchedTopics, ...newTopics].slice(0, 5);

    console.log(`📊 Topic assignment result:`, {
      detected: meaningfulTopics,
      matched: matchedTopics,
      new: newTopics,
      final: finalTopics
    });

    // Create confidence scores
    const confidenceScores: { [key: string]: number } = {};
    finalTopics.forEach(topic => {
      if (matchedTopics.includes(topic)) {
        confidenceScores[topic] = 0.95; // High confidence for matched existing topics
      } else if (enhancedResult.topics.includes(topic)) {
        confidenceScores[topic] = enhancedResult.confidence;
      } else if (enhancedResult.dynamicTopics.includes(topic)) {
        confidenceScores[topic] = 0.6; // Lower confidence for dynamic topics
      } else {
        confidenceScores[topic] = 0.1; // Fallback confidence
      }
    });

    // Assign topics to post using the new system
    await assignTopicsToPost(postId, finalTopics, confidenceScores);

    console.log(`✅ Assigned topics to post ${postId}:`, finalTopics);
    return finalTopics;

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

// Clean up topics with 0 posts (orphaned topics)
export async function cleanupOrphanedTopics(): Promise<number> {
  try {
    console.log('🧹 Cleaning up orphaned topics (topics with 0 posts)...');

    // Find topics with postCount = 0
    const orphanedTopics = await prisma.topic.findMany({
      where: {
        postCount: { lte: 0 }
      },
      select: {
        id: true,
        name: true,
        postCount: true
      }
    });

    if (orphanedTopics.length === 0) {
      console.log('✨ No orphaned topics found');
      return 0;
    }

    console.log(`🗑️ Found ${orphanedTopics.length} orphaned topics to delete:`,
      orphanedTopics.map(t => t.name).join(', '));

    // Delete PostTopic relations first (should already be none, but just in case)
    for (const topic of orphanedTopics) {
      await prisma.postTopic.deleteMany({
        where: { topicId: topic.id }
      });
    }

    // Delete the orphaned topics
    const deleteResult = await prisma.topic.deleteMany({
      where: {
        id: { in: orphanedTopics.map(t => t.id) }
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} orphaned topics`);
    return deleteResult.count;

  } catch (error) {
    console.error('❌ Error cleaning up orphaned topics:', error);
    return 0;
  }
}

export { prisma };
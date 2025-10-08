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

// Helper function for keyword-based fallback
function keywordFallbackClassification(content: string): string[] {
  const contentLower = content.toLowerCase();

  if (contentLower.includes('tech') || contentLower.includes('ai') || contentLower.includes('software') || contentLower.includes('computer')) {
    return ['technology'];
  }
  if (contentLower.includes('food') || contentLower.includes('cook') || contentLower.includes('recipe') || contentLower.includes('eat')) {
    return ['food-drinks'];
  }
  if (contentLower.includes('sport') || contentLower.includes('game') || contentLower.includes('play')) {
    return ['sports'];
  }
  if (contentLower.includes('music') || contentLower.includes('song') || contentLower.includes('band')) {
    return ['music'];
  }
  if (contentLower.includes('movie') || contentLower.includes('film') || contentLower.includes('tv')) {
    return ['movies-tv'];
  }
  if (contentLower.includes('work') || contentLower.includes('remote') || contentLower.includes('office') || contentLower.includes('job')) {
    return ['education', 'business'];
  }
  if (contentLower.includes('travel') || contentLower.includes('vacation') || contentLower.includes('trip')) {
    return ['travel'];
  }
  if (contentLower.includes('health') || contentLower.includes('fitness') || contentLower.includes('exercise')) {
    return ['health-fitness'];
  }

  return ['general'];
}

// Cloudflare Workers AI classification
async function classifyWithCloudflare(content: string, topicNames: string[]): Promise<string[]> {
  try {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!cfAccountId || !cfApiToken) {
      console.warn('⚠️ Cloudflare credentials not found, skipping');
      return [];
    }

    const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

    const prompt = `You are a topic classifier. Given a social media post, classify it into 1-3 topics from this list ONLY:

${topicNames.join(', ')}

Post: "${content.substring(0, 500)}"

Rules:
- Return ONLY topic names from the list above
- Choose 1-3 topics that best match
- Return as JSON array: ["topic1", "topic2"]
- If unsure, return ["general"]
- DO NOT create new topics

Respond with ONLY the JSON array, nothing else.`;

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful topic classifier. Always respond with valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Cloudflare API error: ${response.status}`);
      return [];
    }

    const result = await response.json();
    const generatedText = result.result?.response || '';

    console.log('☁️ Cloudflare classification:', generatedText);

    const cleaned = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    const topics = JSON.parse(cleaned);

    if (Array.isArray(topics) && topics.length > 0) {
      const validTopics = topics.filter(t => topicNames.includes(t));
      return validTopics.length > 0 ? validTopics : [];
    }

    return [];
  } catch (error) {
    console.error('❌ Cloudflare classification error:', error);
    return [];
  }
}

// NEW SIMPLIFIED: Classify post into curated topics only
async function classifyIntoCuratedTopics(content: string): Promise<string[]> {
  try {
    // Get all curated (system) topics from database
    const curatedTopics = await prisma.topic.findMany({
      where: { isSystem: true },
      select: { name: true }
    });

    if (curatedTopics.length === 0) {
      console.warn('⚠️ No curated topics found in database');
      return ['general'];
    }

    const topicNames = curatedTopics.map(t => t.name);

    // Try Cloudflare Workers AI first (1M requests/day free)
    console.log('🔍 Attempting Cloudflare Workers AI classification...');
    const cfTopics = await classifyWithCloudflare(content, topicNames);
    if (cfTopics.length > 0) {
      console.log('✅ Cloudflare classification successful:', cfTopics);
      return cfTopics;
    }

    // Fallback to Gemini
    console.log('🔄 Cloudflare unavailable, trying Gemini...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ No Google AI API key, using keyword fallback');
      return keywordFallbackClassification(content);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Classify this post into 1-3 topics from this list ONLY:

${topicNames.join(', ')}

Post: "${content.substring(0, 500)}"

Rules:
- Return ONLY topic names from the list above
- Choose 1-3 topics that best match
- Return as JSON array: ["topic1", "topic2"]
- If unsure, return ["general"]
- DO NOT create new topics

Topics:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log('🤖 Gemini classification response:', text);

    // Parse JSON response
    const topics = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

    if (Array.isArray(topics) && topics.length > 0) {
      // Validate topics are in curated list
      const validTopics = topics.filter(t => topicNames.includes(t));
      return validTopics.length > 0 ? validTopics : ['general'];
    }

    return ['general'];
  } catch (error) {
    console.error('❌ Error classifying into curated topics:', error);

    // Use keyword fallback for any error
    console.warn('⏳ All AI providers failed, using keyword fallback');
    return keywordFallbackClassification(content);
  }
}

// NEW SIMPLIFIED: Process post and assign to curated topics only
export async function processPostForTopics(
  postId: string,
  content: string
): Promise<string[]> {
  try {
    console.log(`🧠 Processing post ${postId} for topic classification`);

    // Extract hashtags from content (user-defined topics)
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }

    // Classify into curated topics using AI
    const curatedTopics = await classifyIntoCuratedTopics(content);

    console.log(`📊 Classification result:`, {
      curated: curatedTopics,
      hashtags: hashtags
    });

    // For now, only use curated topics
    // Future: Allow hashtags if user explicitly wants custom topics
    const finalTopics = curatedTopics.slice(0, 3); // Max 3 topics

    // Assign topics to post
    const confidenceScores: { [key: string]: number } = {};
    finalTopics.forEach(topic => {
      confidenceScores[topic] = 0.9; // High confidence for AI classification
    });

    await assignTopicsToPost(postId, finalTopics, confidenceScores);

    console.log(`✅ Assigned topics to post ${postId}:`, finalTopics);
    return finalTopics;

  } catch (error) {
    console.error(`❌ Error processing post ${postId} for topics:`, error);

    // Fallback: assign 'general' topic
    await assignTopicsToPost(postId, ['general'], { general: 0.5 });
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
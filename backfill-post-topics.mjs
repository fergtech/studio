#!/usr/bin/env node
/**
 * Backfill script to assign topics to general posts that don't have any
 * Uses the same AI topic detection system as new posts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same topic detection logic from topic-detection API
async function detectTopicsFromContentAI(content) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.log('⚠️  No Google AI API key found, using fallback');
      return { semanticTopics: ['general'], confidence: 0.1 };
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this social media post and extract 1-3 semantic topic tags that represent the main themes or issues discussed.

Rules:
- Return only lowercase single words separated by commas
- Focus on broad, community-relevant topics like: housing, transportation, education, healthcare, environment, economy, safety, infrastructure
- Avoid very specific terms - prefer broader categories that others might also discuss
- If the post is about local community issues, prioritize those topics
- Maximum 3 topics

Post content: "${content.trim()}"

Respond with just the topics separated by commas, nothing else.
Example: housing, transportation, infrastructure`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text().trim();

    // Parse the response - should be comma-separated topics
    const topics = aiResponse
      .split(',')
      .map(topic => topic.trim().toLowerCase())
      .filter(topic => topic && topic.length > 0)
      .slice(0, 3); // Ensure max 3 topics

    if (topics.length === 0) {
      return { semanticTopics: ['general'], confidence: 0.1 };
    }

    return {
      semanticTopics: topics,
      confidence: Math.max(0.5, Math.min(1.0, topics.length / 3))
    };

  } catch (error) {
    console.error('Error detecting topics from AI:', error);
    return { semanticTopics: ['general'], confidence: 0.1 };
  }
}

async function backfillPostTopics() {
  console.log('🚀 Starting topic backfill for general posts...\n');

  // Find all general posts without topic assignments
  const postsWithoutTopics = await prisma.generalPost.findMany({
    where: {
      postTopics: {
        none: {}
      }
    },
    select: {
      id: true,
      content: true,
      timestamp: true
    }
  });

  console.log(`📊 Found ${postsWithoutTopics.length} posts to backfill\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const post of postsWithoutTopics) {
    try {
      console.log(`🔍 Processing post ${post.id.substring(0, 8)}...`);
      console.log(`   Content: "${post.content.substring(0, 60)}..."`);

      // Detect topics using AI
      const { semanticTopics, confidence } = await detectTopicsFromContentAI(post.content);
      console.log(`   Detected topics: ${semanticTopics.join(', ')} (confidence: ${confidence})`);

      // For each detected topic
      for (const topicName of semanticTopics) {
        // Get or create topic
        let topic = await prisma.topic.findUnique({
          where: { name: topicName }
        });

        if (!topic) {
          console.log(`   Creating new topic: "${topicName}"`);
          topic = await prisma.topic.create({
            data: {
              name: topicName,
              isSystem: true,
              confidence,
              postCount: 1,
              weeklyPosts: 1
            }
          });
        } else {
          console.log(`   Using existing topic: "${topicName}"`);
          // Update post count
          await prisma.topic.update({
            where: { id: topic.id },
            data: {
              postCount: { increment: 1 },
              weeklyPosts: { increment: 1 }
            }
          });
        }

        // Create PostTopic relation
        await prisma.postTopic.create({
          data: {
            postId: post.id,
            topicId: topic.id,
            confidence
          }
        });
      }

      console.log(`   ✅ Successfully assigned ${semanticTopics.length} topics\n`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ Error processing post ${post.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Backfill Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Total processed: ${postsWithoutTopics.length}`);

  await prisma.$disconnect();
}

backfillPostTopics().catch(console.error);

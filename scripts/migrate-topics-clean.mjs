/**
 * Topic Migration Script - Hard Cleanup
 *
 * This script will:
 * 1. Delete ALL existing topics
 * 2. Seed 27 curated topics
 * 3. Re-classify all existing posts using AI (one-time only)
 *
 * Safe for dev/test environment with small user base
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Curated topics list
const CURATED_TOPICS = [
  { name: 'movies-tv', displayName: 'Movies & TV', category: 'entertainment' },
  { name: 'games', displayName: 'Games', category: 'entertainment' },
  { name: 'music', displayName: 'Music', category: 'entertainment' },
  { name: 'sports', displayName: 'Sports', category: 'entertainment' },
  { name: 'anime', displayName: 'Anime', category: 'entertainment' },
  { name: 'food-drinks', displayName: 'Food & Drinks', category: 'lifestyle' },
  { name: 'travel', displayName: 'Travel', category: 'lifestyle' },
  { name: 'fashion-beauty', displayName: 'Fashion & Beauty', category: 'lifestyle' },
  { name: 'health-fitness', displayName: 'Health & Fitness', category: 'lifestyle' },
  { name: 'home-garden', displayName: 'Home & Garden', category: 'lifestyle' },
  { name: 'technology', displayName: 'Technology', category: 'knowledge' },
  { name: 'science', displayName: 'Science', category: 'knowledge' },
  { name: 'education', displayName: 'Education & Career', category: 'knowledge' },
  { name: 'business', displayName: 'Business', category: 'knowledge' },
  { name: 'news-politics', displayName: 'News & Politics', category: 'community' },
  { name: 'community', displayName: 'Community', category: 'community' },
  { name: 'relationships', displayName: 'Relationships', category: 'community' },
  { name: 'qas', displayName: 'Q&As', category: 'community' },
  { name: 'arts', displayName: 'Arts', category: 'creative' },
  { name: 'books', displayName: 'Books', category: 'creative' },
  { name: 'photography', displayName: 'Photography', category: 'creative' },
  { name: 'nature-outdoors', displayName: 'Nature & Outdoors', category: 'lifestyle' },
  { name: 'pets-animals', displayName: 'Pets & Animals', category: 'lifestyle' },
  { name: 'cars-vehicles', displayName: 'Cars & Vehicles', category: 'lifestyle' },
  { name: 'transportation', displayName: 'Transportation', category: 'community' },
  { name: 'housing', displayName: 'Housing', category: 'community' },
  { name: 'pop-culture', displayName: 'Pop Culture', category: 'entertainment' },
  { name: 'general', displayName: 'General', category: 'community' }
];

// AI classification with Cloudflare + Gemini fallback + Keyword fallback
async function classifyPostWithAI(content) {
  const topicList = CURATED_TOPICS.map(t => t.name).join(', ');

  const prompt = `You are a topic classifier. Classify this post into 1-3 topics from the following list ONLY:

${topicList}

Post: "${content.substring(0, 500)}"

Rules:
- Return ONLY topic names from the list above, nothing else
- Choose 1-3 topics that best match the post content
- Return as a JSON array: ["topic1", "topic2"]
- If unsure, return ["general"]
- Do NOT create new topics

Respond with ONLY the JSON array.`;

  // Try Cloudflare Workers AI first
  try {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (cfAccountId && cfApiToken) {
      const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

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

      if (response.ok) {
        const result = await response.json();
        const generatedText = result.result?.response || '';
        const cleaned = generatedText.replace(/```json\n?|\n?```/g, '').trim();
        const topics = JSON.parse(cleaned);

        if (Array.isArray(topics) && topics.length > 0) {
          const validTopics = topics.filter(t => CURATED_TOPICS.some(ct => ct.name === t));
          if (validTopics.length > 0) {
            console.log(`   ☁️ Cloudflare: ${validTopics.join(', ')}`);
            return validTopics;
          }
        }
      }
    }
  } catch (cfError) {
    console.log(`   ⚠️ Cloudflare failed, trying Gemini...`);
  }

  // Fallback to Gemini
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const topics = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

      if (Array.isArray(topics) && topics.length > 0) {
        const validTopics = topics.filter(t => CURATED_TOPICS.some(ct => ct.name === t));
        if (validTopics.length > 0) {
          console.log(`   🤖 Gemini: ${validTopics.join(', ')}`);
          return validTopics;
        }
      }
    }
  } catch (geminiError) {
    console.log(`   ⚠️ Gemini failed, using keyword fallback...`);
  }

  // Keyword fallback
  const contentLower = content.toLowerCase();
  if (contentLower.includes('movie') || contentLower.includes('film') || contentLower.includes('tv')) {
    console.log(`   🔑 Keyword: movies-tv`);
    return ['movies-tv'];
  }
  if (contentLower.includes('tech') || contentLower.includes('ai') || contentLower.includes('software')) {
    console.log(`   🔑 Keyword: technology`);
    return ['technology'];
  }
  if (contentLower.includes('food') || contentLower.includes('cook') || contentLower.includes('recipe')) {
    console.log(`   🔑 Keyword: food-drinks`);
    return ['food-drinks'];
  }
  if (contentLower.includes('sport') || contentLower.includes('game')) {
    console.log(`   🔑 Keyword: sports`);
    return ['sports'];
  }
  if (contentLower.includes('work') || contentLower.includes('remote') || contentLower.includes('office')) {
    console.log(`   🔑 Keyword: education, business`);
    return ['education', 'business'];
  }

  console.log(`   🔑 Keyword: general (fallback)`);
  return ['general'];
}

async function migrateTopics() {
  console.log('🚀 Starting Topic Migration - Hard Cleanup\n');

  // Step 1: Delete ALL existing PostTopic relationships
  console.log('🗑️  Step 1: Deleting all PostTopic relationships...');
  const deletedPostTopics = await prisma.postTopic.deleteMany({});
  console.log(`   ✅ Deleted ${deletedPostTopics.count} post-topic relationships\n`);

  // Step 2: Delete ALL existing topics
  console.log('🗑️  Step 2: Deleting all existing topics...');
  const deletedTopics = await prisma.topic.deleteMany({});
  console.log(`   ✅ Deleted ${deletedTopics.count} topics\n`);

  // Step 3: Seed curated topics
  console.log('🌱 Step 3: Seeding curated topics...');
  const createdTopics = [];
  for (const topic of CURATED_TOPICS) {
    const created = await prisma.topic.create({
      data: {
        name: topic.name,
        description: topic.displayName,
        category: topic.category,
        isSystem: true,
        confidence: 1.0,
        postCount: 0,
        weeklyPosts: 0
      }
    });
    createdTopics.push(created);
    console.log(`   ✅ Created topic: ${topic.displayName} (${topic.name})`);
  }
  console.log(`\n   🎉 Created ${createdTopics.length} curated topics\n`);

  // Step 4: Re-classify all posts (GeneralPosts, Ideas, Issues)
  console.log('🧠 Step 4: Re-classifying all existing posts with AI...\n');

  // Fetch all post types
  const generalPosts = await prisma.generalPost.findMany({
    select: { id: true, content: true, creatorId: true }
  });

  const ideas = await prisma.idea.findMany({
    select: { id: true, description: true, creatorId: true }
  });

  const issues = await prisma.issue.findMany({
    select: { id: true, description: true, creatorId: true }
  });

  // Normalize to common format
  const allPosts = [
    ...generalPosts.map(p => ({ id: p.id, content: p.content, type: 'GeneralPost' })),
    ...ideas.map(i => ({ id: i.id, content: i.description, type: 'Idea' })),
    ...issues.map(i => ({ id: i.id, content: i.description, type: 'Issue' }))
  ];

  console.log(`   Found ${generalPosts.length} GeneralPosts, ${ideas.length} Ideas, ${issues.length} Issues`);
  console.log(`   Total: ${allPosts.length} posts to re-classify\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    console.log(`   [${i + 1}/${allPosts.length}] Classifying ${post.type} ${post.id}...`);

    try {
      // Get AI classification
      const topicNames = await classifyPostWithAI(post.content);
      console.log(`      Topics: ${topicNames.join(', ')}`);

      // Assign topics to post
      for (const topicName of topicNames) {
        const topic = createdTopics.find(t => t.name === topicName);
        if (topic) {
          await prisma.postTopic.create({
            data: {
              postId: post.id,
              topicId: topic.id,
              confidence: 0.9
            }
          });

          // Increment topic counts
          await prisma.topic.update({
            where: { id: topic.id },
            data: {
              postCount: { increment: 1 },
              weeklyPosts: { increment: 1 }
            }
          });
        }
      }

      successCount++;

      // Rate limiting - wait 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`      ❌ Error classifying post ${post.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n✅ Migration Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Topics created: ${createdTopics.length}`);
  console.log(`   Posts re-classified: ${successCount}/${allPosts.length}`);
  console.log(`   Errors: ${errorCount}`);

  // Show final topic distribution
  console.log('\n📈 Topic Distribution:');
  const topicsWithCounts = await prisma.topic.findMany({
    where: { postCount: { gt: 0 } },
    orderBy: { postCount: 'desc' }
  });

  topicsWithCounts.forEach(topic => {
    console.log(`   ${topic.description || topic.name}: ${topic.postCount} posts`);
  });

  await prisma.$disconnect();
}

// Run migration
migrateTopics().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});

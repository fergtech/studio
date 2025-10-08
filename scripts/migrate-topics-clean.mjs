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
import { GoogleGenerativeAI } from '@google/generative-ai';

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

async function classifyPostWithAI(content) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ No Google AI API key, using fallback classification');
      return ['general'];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

Topics:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON response
    const topics = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

    if (Array.isArray(topics) && topics.length > 0) {
      // Validate topics are in our curated list
      const validTopics = topics.filter(t => CURATED_TOPICS.some(ct => ct.name === t));
      return validTopics.length > 0 ? validTopics : ['general'];
    }

    return ['general'];
  } catch (error) {
    console.error('AI classification error:', error.message);
    return ['general'];
  }
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

  // Step 4: Re-classify all posts
  console.log('🧠 Step 4: Re-classifying all existing posts with AI...\n');

  const allPosts = await prisma.generalPost.findMany({
    select: {
      id: true,
      content: true,
      creatorId: true
    }
  });

  console.log(`   Found ${allPosts.length} posts to re-classify\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    console.log(`   [${i + 1}/${allPosts.length}] Classifying post ${post.id}...`);

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

/**
 * Backfill Debate Topics Script
 *
 * This script processes all existing debates and:
 * 1. Detects topics using AI (Google Gemini 2.0 Flash via Genkit)
 * 2. Creates/updates Topic records with debateCount
 * 3. Creates DebateTopicTopic relations
 * 4. Updates the debates.topics array (legacy compatibility)
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env.local (for local dev)
// In production, env vars are already set (Vercel, etc.)
dotenv.config({ path: '.env.local' });

// Verify we have the required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in environment variables!');
  console.error('For production: Set DATABASE_URL in Vercel environment variables');
  console.error('For local: Make sure .env.local file exists with DATABASE_URL');
  process.exit(1);
}

// Check for AI provider credentials (Cloudflare primary, Gemini backup)
const hasCloudflare = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN;
const hasGemini = process.env.GOOGLE_GENAI_API_KEY;

if (!hasCloudflare && !hasGemini) {
  console.error('❌ Error: No AI provider credentials found!');
  console.error('For production: Set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (primary) or GOOGLE_GENAI_API_KEY (backup) in Vercel');
  console.error('For local: Make sure .env.local has Cloudflare or Gemini credentials');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`   Database: ${process.env.DATABASE_URL.substring(0, 30)}...`);
console.log(`   AI Provider: ${hasCloudflare ? '☁️ Cloudflare (primary)' : ''} ${hasGemini ? '🤖 Gemini (backup)' : ''}`);

const prisma = new PrismaClient();

/**
 * Cloudflare Workers AI topic detection (PRIMARY)
 */
async function detectTopicsWithCloudflare(content) {
  try {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

    const prompt = `Analyze this debate and extract 1-3 semantic topic tags. Return only lowercase single words separated by commas. Focus on broad topics like: housing, transportation, education, healthcare, environment, economy, safety, infrastructure, politics, technology, food, sports, entertainment. Debate: "${content.trim()}" Output: Just comma-separated topics.`;

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a topic classifier. Return only comma-separated lowercase topic words.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 50,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.warn(`   ⚠️ Cloudflare API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const rawTopics = result.result?.response || '';
    console.log('   ☁️ Cloudflare response:', rawTopics.substring(0, 50));

    const topics = rawTopics
      .toLowerCase()
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 30)
      .slice(0, 3);

    if (topics.length > 0) {
      return { semanticTopics: topics, confidence: 0.8 };
    }

    return null;
  } catch (error) {
    console.error('   ❌ Cloudflare error:', error.message);
    return null;
  }
}

/**
 * Google Gemini topic detection (BACKUP)
 */
async function detectTopicsWithGemini(content) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this debate and extract 1-3 semantic topic tags. Return only lowercase single words separated by commas. Focus on broad topics like: housing, transportation, education, healthcare, environment, economy, safety, infrastructure, politics, technology, food, sports, entertainment. Debate: "${content.trim()}" Output: Just comma-separated topics.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawTopics = response.text().trim();
    console.log('   🤖 Gemini response:', rawTopics.substring(0, 50));

    const topics = rawTopics
      .toLowerCase()
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 30)
      .slice(0, 3);

    if (topics.length > 0) {
      return { semanticTopics: topics, confidence: 0.8 };
    }

    return null;
  } catch (error) {
    console.error('   ❌ Gemini error:', error.message);
    return null;
  }
}

/**
 * AI-powered topic detection with Cloudflare primary, Gemini backup
 */
async function detectTopicsWithAI(content) {
  // Try Cloudflare first
  if (hasCloudflare) {
    const cfResult = await detectTopicsWithCloudflare(content);
    if (cfResult) return cfResult;
    console.log('   🔄 Cloudflare failed, trying Gemini...');
  }

  // Fallback to Gemini
  if (hasGemini) {
    const geminiResult = await detectTopicsWithGemini(content);
    if (geminiResult) return geminiResult;
  }

  // Both failed - use fallback
  console.log('   ⚠️ All AI providers failed, using "general"');
  return { semanticTopics: ['general'], confidence: 0.1 };
}

async function backfillDebateTopics() {
  console.log('🔄 Starting debate topic backfill process...\n');

  try {
    // Get all debates
    const debates = await prisma.debateTopic.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        topics: true,
        debateTopics: {
          select: {
            topicId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${debates.length} debates to process\n`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const topicCountMap = new Map();

    for (const debate of debates) {
      try {
        console.log(`\n🔍 Processing debate: ${debate.id}`);
        console.log(`   Title: "${debate.title.substring(0, 60)}..."`);
        console.log(`   Current topics: ${JSON.stringify(debate.topics)}`);
        console.log(`   Existing relations: ${debate.debateTopics.length}`);

        // Skip if already has relations
        if (debate.debateTopics.length > 0) {
          console.log(`   ⏭️  Skipping - already has topic relations`);
          skipped++;
          continue;
        }

        // Detect topics using Google Gemini AI
        const combinedText = `${debate.title}\n\n${debate.content}`;
        const detectionResult = await detectTopicsWithAI(combinedText);
        const detectedTopics = detectionResult.semanticTopics || ['general'];
        const confidence = detectionResult.confidence || 0.5;

        console.log(`   🤖 AI detected: ${JSON.stringify(detectedTopics)} (confidence: ${confidence.toFixed(2)})`);

        // Process each detected topic
        for (const topicName of detectedTopics) {
          // Find or create topic
          let topic = await prisma.topic.findUnique({
            where: { name: topicName }
          });

          if (!topic) {
            console.log(`   ➕ Creating new topic: "${topicName}"`);
            topic = await prisma.topic.create({
              data: {
                name: topicName,
                isSystem: true,
                confidence,
                debateCount: 1,
                weeklyDebates: 1
              }
            });
          } else {
            console.log(`   ✅ Topic exists: "${topicName}" - updating count`);
            await prisma.topic.update({
              where: { id: topic.id },
              data: {
                debateCount: { increment: 1 },
                weeklyDebates: { increment: 1 }
              }
            });
          }

          // Create DebateTopicTopic relation
          try {
            await prisma.debateTopicTopic.create({
              data: {
                debateId: debate.id,
                topicId: topic.id,
                confidence
              }
            });
            console.log(`   🔗 Created relation: debate → topic "${topicName}"`);
          } catch (error) {
            if (error.code === 'P2002') {
              console.log(`   ⚠️  Relation already exists for topic "${topicName}"`);
            } else {
              throw error;
            }
          }

          // Track topic usage
          topicCountMap.set(topicName, (topicCountMap.get(topicName) || 0) + 1);
        }

        // Update debate's topics array (legacy compatibility)
        await prisma.debateTopic.update({
          where: { id: debate.id },
          data: { topics: detectedTopics }
        });

        console.log(`   ✅ Updated debate with topics: ${JSON.stringify(detectedTopics)}`);
        updated++;

      } catch (error) {
        console.error(`   ❌ Error processing debate ${debate.id}:`, error.message);
      }

      processed++;

      // Progress indicator
      if (processed % 10 === 0) {
        console.log(`\n📈 Progress: ${processed}/${debates.length} debates processed (${updated} updated, ${skipped} skipped)`);
      }
    }

    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total debates: ${debates.length}`);
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\n🏷️  Topic Distribution (Top 20):`);

    const sortedTopics = Array.from(topicCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    sortedTopics.forEach(([topic, count], index) => {
      console.log(`   ${index + 1}. "${topic}" - ${count} debates`);
    });

    // Verify database state
    console.log('\n📊 Final Database State:');
    const totalTopics = await prisma.topic.count();
    const topicsWithDebates = await prisma.topic.count({
      where: { debateCount: { gt: 0 } }
    });
    const totalDebateTopicRelations = await prisma.debateTopicTopic.count();

    console.log(`   Total topics: ${totalTopics}`);
    console.log(`   Topics with debates: ${topicsWithDebates}`);
    console.log(`   Total debate-topic relations: ${totalDebateTopicRelations}`);

    console.log('\n✅ Backfill process completed successfully!\n');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillDebateTopics().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

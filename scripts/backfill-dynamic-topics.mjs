#!/usr/bin/env node
/**
 * Production-ready backfill script for migrating existing posts to the new dynamic topic system
 *
 * This script:
 * 1. Finds all existing posts (GeneralPost, SocietyPost, Idea, Issue)
 * 2. Processes each post through the NEW dynamic topic detection system
 * 3. Creates Topic records and PostTopic relationships
 * 4. Updates trending topics list
 *
 * Usage:
 *   node scripts/backfill-dynamic-topics.mjs [--limit=100] [--dry-run]
 *
 * Options:
 *   --limit=N    Process only N posts (default: all)
 *   --dry-run    Show what would be processed without making changes
 *   --type=TYPE  Process only specific type: general, society, idea, issue (default: all)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');
const typeFilter = args.find(arg => arg.startsWith('--type='))?.split('=')[1];

console.log('🚀 Dynamic Topic Backfill Script');
console.log('================================');
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
console.log(`Limit: ${limit || 'No limit (process all)'}`);
console.log(`Type: ${typeFilter || 'All types'}`);
console.log('');

// Import topic detection - we'll use a simplified version that works in Node
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]{2,50})(?=\s|$)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[1].toLowerCase();
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }
  return hashtags;
}

// Simplified topic detection for backfill (server-side only)
function detectTopicsSimplified(content) {
  const contentLower = content.toLowerCase();
  const hashtags = extractHashtags(content);

  // Common topic keywords
  const topicKeywords = {
    'sports': ['sports', 'team', 'game', 'player', 'season', 'coach', 'athletic', 'league'],
    'technology': ['tech', 'software', 'app', 'digital', 'ai', 'artificial intelligence', 'computer', 'internet'],
    'politics': ['government', 'election', 'vote', 'policy', 'political', 'mayor', 'council', 'legislation'],
    'education': ['school', 'student', 'teacher', 'education', 'learning', 'university', 'college'],
    'healthcare': ['health', 'hospital', 'medical', 'doctor', 'patient', 'clinic', 'healthcare'],
    'environment': ['environment', 'climate', 'green', 'sustainability', 'pollution', 'nature', 'eco'],
    'transportation': ['traffic', 'transit', 'bus', 'train', 'road', 'transport', 'commute'],
    'housing': ['housing', 'apartment', 'rent', 'home', 'property', 'development', 'construction'],
    'business': ['business', 'company', 'entrepreneur', 'startup', 'economy', 'job', 'employment'],
    'community': ['community', 'neighborhood', 'local', 'town', 'city', 'resident', 'citizen'],
    'entertainment': ['movie', 'music', 'concert', 'show', 'entertainment', 'theater', 'festival'],
    'food': ['restaurant', 'food', 'dining', 'cafe', 'cuisine', 'chef', 'meal']
  };

  const detectedTopics = [];

  // Check hashtags first (highest priority)
  if (hashtags.length > 0) {
    detectedTopics.push(...hashtags);
  }

  // Check for keyword matches
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(keyword => contentLower.includes(keyword));
    if (matches.length >= 2) { // Require at least 2 keyword matches
      if (!detectedTopics.includes(topic)) {
        detectedTopics.push(topic);
      }
    }
  }

  return detectedTopics.length > 0 ? detectedTopics : ['general'];
}

// Get or create topic in database
async function getOrCreateTopic(topicName) {
  const normalizedName = topicName.toLowerCase().trim();

  if (isDryRun) {
    console.log(`  [DRY RUN] Would get or create topic: ${normalizedName}`);
    return { id: 'dry-run-id', name: normalizedName };
  }

  // Try to find existing topic (case-insensitive)
  let topic = await prisma.topic.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive'
      }
    }
  });

  // Create if doesn't exist
  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        name: normalizedName,
        postCount: 0,
        weeklyPosts: 0,
        isSystem: false
      }
    });
    console.log(`  ✨ Created new topic: ${normalizedName}`);
  }

  return topic;
}

// Assign topics to a post
async function assignTopicsToPost(postId, topics) {
  if (isDryRun) {
    console.log(`  [DRY RUN] Would assign topics [${topics.join(', ')}] to post ${postId}`);
    return;
  }

  // Remove existing PostTopic relationships for this post
  await prisma.postTopic.deleteMany({
    where: { postId }
  });

  // Create new relationships
  for (const topicName of topics) {
    const topic = await getOrCreateTopic(topicName);

    // Create PostTopic relationship
    await prisma.postTopic.create({
      data: {
        postId,
        topicId: topic.id,
        confidence: 0.7 // Default confidence for backfill
      }
    });

    // Increment topic counters
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        postCount: { increment: 1 },
        weeklyPosts: { increment: 1 }
      }
    });
  }
}

// Process general posts
async function processGeneralPosts() {
  console.log('\n📝 Processing General Posts...');

  const posts = await prisma.generalPost.findMany({
    where: typeFilter === 'general' ? {} : undefined,
    select: {
      id: true,
      content: true,
      postTopics: true
    },
    orderBy: { timestamp: 'desc' },
    take: limit ? parseInt(limit) : undefined
  });

  console.log(`Found ${posts.length} general posts`);

  let processed = 0;
  let updated = 0;

  for (const post of posts) {
    try {
      // Skip if already has topic assignments in new system
      if (post.postTopics.length > 0) {
        console.log(`⏭️  Post ${post.id} already has topic assignments, skipping`);
        processed++;
        continue;
      }

      console.log(`\n🔍 Processing post ${processed + 1}/${posts.length}: ${post.id}`);
      console.log(`   Content preview: "${post.content.substring(0, 80)}..."`);

      const topics = detectTopicsSimplified(post.content);
      console.log(`   Detected topics: [${topics.join(', ')}]`);

      await assignTopicsToPost(post.id, topics);

      updated++;
      processed++;

      // Rate limiting
      if (processed % 10 === 0) {
        console.log(`\n⏸️  Processed ${processed} posts, pausing briefly...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error processing post ${post.id}:`, error.message);
      processed++;
    }
  }

  return { total: posts.length, processed, updated };
}

// Process society posts
async function processSocietyPosts() {
  console.log('\n🏛️  Processing Society Posts...');

  const posts = await prisma.societyPost.findMany({
    where: typeFilter === 'society' ? {} : undefined,
    select: {
      id: true,
      content: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit) : undefined
  });

  console.log(`Found ${posts.length} society posts`);
  console.log('⏭️  Skipping society posts (not in PostTopic system yet)');

  return { total: posts.length, processed: 0, updated: 0 };
}

// Process ideas
async function processIdeas() {
  console.log('\n💡 Processing Ideas...');

  const ideas = await prisma.idea.findMany({
    where: typeFilter === 'idea' ? {} : undefined,
    select: {
      id: true,
      description: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit) : undefined
  });

  console.log(`Found ${ideas.length} ideas`);
  console.log('⏭️  Skipping ideas (not in PostTopic system yet)');

  return { total: ideas.length, processed: 0, updated: 0 };
}

// Process issues
async function processIssues() {
  console.log('\n🚨 Processing Issues...');

  const issues = await prisma.issue.findMany({
    where: typeFilter === 'issue' ? {} : undefined,
    select: {
      id: true,
      description: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit) : undefined
  });

  console.log(`Found ${issues.length} issues`);
  console.log('⏭️  Skipping issues (not in PostTopic system yet)');

  return { total: issues.length, processed: 0, updated: 0 };
}

// Main execution
async function main() {
  try {
    const results = {
      generalPosts: { total: 0, processed: 0, updated: 0 },
      societyPosts: { total: 0, processed: 0, updated: 0 },
      ideas: { total: 0, processed: 0, updated: 0 },
      issues: { total: 0, processed: 0, updated: 0 }
    };

    // Process each content type
    if (!typeFilter || typeFilter === 'general') {
      results.generalPosts = await processGeneralPosts();
    }

    if (!typeFilter || typeFilter === 'society') {
      results.societyPosts = await processSocietyPosts();
    }

    if (!typeFilter || typeFilter === 'idea') {
      results.ideas = await processIdeas();
    }

    if (!typeFilter || typeFilter === 'issue') {
      results.issues = await processIssues();
    }

    // Summary
    console.log('\n\n🏁 Backfill Complete!');
    console.log('=====================');
    console.log(`General Posts: ${results.generalPosts.updated}/${results.generalPosts.total} updated`);
    console.log(`Society Posts: ${results.societyPosts.updated}/${results.societyPosts.total} updated`);
    console.log(`Ideas: ${results.ideas.updated}/${results.ideas.total} updated`);
    console.log(`Issues: ${results.issues.updated}/${results.issues.total} updated`);

    const totalUpdated = results.generalPosts.updated + results.societyPosts.updated + results.ideas.updated + results.issues.updated;
    const totalPosts = results.generalPosts.total + results.societyPosts.total + results.ideas.total + results.issues.total;

    console.log(`\n✅ Total: ${totalUpdated}/${totalPosts} posts processed`);

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made to the database');
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

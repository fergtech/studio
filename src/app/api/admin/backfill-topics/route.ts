/**
 * API endpoint to backfill topics for existing posts using the NEW dynamic topic system
 *
 * This creates Topic records and PostTopic relationships (not just updating legacy topics array)
 *
 * Usage:
 *   POST /api/admin/backfill-topics
 *   Body: {
 *     "limit": 50,      // Optional: max posts to process (default: 50)
 *     "dryRun": true,   // Optional: preview without changes (default: true)
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Hashtag extraction
function extractHashtags(text: string): string[] {
  if (!text) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]{2,50})(?=\s|$)/g;
  const hashtags: string[] = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[1].toLowerCase();
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }
  return hashtags;
}

// Simplified topic detection
function detectTopics(content: string): string[] {
  const contentLower = content.toLowerCase();
  const hashtags = extractHashtags(content);

  const topicKeywords: Record<string, string[]> = {
    'sports': ['sports', 'team', 'game', 'player', 'season', 'coach', 'athletic', 'league', 'tournament', 'organization'],
    'technology': ['tech', 'software', 'app', 'digital', 'ai', 'artificial intelligence', 'computer', 'internet'],
    'politics': ['government', 'election', 'vote', 'policy', 'political', 'mayor', 'council', 'legislation'],
    'education': ['school', 'student', 'teacher', 'education', 'learning', 'university', 'college'],
    'healthcare': ['health', 'hospital', 'medical', 'doctor', 'patient', 'clinic', 'healthcare'],
    'environment': ['environment', 'climate', 'green', 'sustainability', 'pollution', 'nature', 'eco'],
    'transportation': ['traffic', 'transit', 'bus', 'train', 'road', 'transport', 'commute'],
    'housing': ['housing', 'apartment', 'rent', 'home', 'property', 'development', 'construction'],
    'business': ['business', 'company', 'entrepreneur', 'startup', 'economy', 'job', 'employment'],
    'community': ['community', 'neighborhood', 'local', 'town', 'city', 'resident', 'citizen', 'organization', 'members', 'join'],
    'entertainment': ['movie', 'music', 'concert', 'show', 'entertainment', 'theater', 'festival'],
    'food': ['restaurant', 'food', 'dining', 'cafe', 'cuisine', 'chef', 'meal']
  };

  const detectedTopics: string[] = [];

  // Hashtags first
  if (hashtags.length > 0) {
    detectedTopics.push(...hashtags);
  }

  // Keyword matching (require at least 1 match for broader detection)
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(keyword => contentLower.includes(keyword));
    if (matches.length >= 1) {
      if (!detectedTopics.includes(topic)) {
        detectedTopics.push(topic);
      }
    }
  }

  return detectedTopics.length > 0 ? detectedTopics.slice(0, 5) : ['general'];
}

// Get or create topic
async function getOrCreateTopic(topicName: string) {
  const normalizedName = topicName.toLowerCase().trim();

  let topic = await prisma.topic.findFirst({
    where: {
      name: { equals: normalizedName, mode: 'insensitive' }
    }
  });

  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        name: normalizedName,
        postCount: 0,
        weeklyPosts: 0,
        isSystem: false
      }
    });
  }

  return topic;
}

// Assign topics to post
async function assignTopics(postId: string, topics: string[], dryRun: boolean) {
  if (dryRun) {
    return { topics, action: 'dry_run' };
  }

  // Remove existing
  await prisma.postTopic.deleteMany({ where: { postId } });

  // Create new
  for (const topicName of topics) {
    const topic = await getOrCreateTopic(topicName);

    await prisma.postTopic.create({
      data: {
        postId,
        topicId: topic.id,
        confidence: 0.7
      }
    });

    // Increment counters
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        postCount: { increment: 1 },
        weeklyPosts: { increment: 1 }
      }
    });
  }

  return { topics, action: 'updated' };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50;
    const dryRun = body.dryRun !== false; // Default true for safety

    console.log(`🚀 Backfill started by ${session.user.id}: limit=${limit}, dryRun=${dryRun}`);

    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      samples: [] as any[]
    };

    // Find posts without PostTopic assignments
    const posts = await prisma.generalPost.findMany({
      select: {
        id: true,
        content: true,
        postTopics: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    console.log(`📊 Found ${posts.length} posts`);

    for (const post of posts) {
      try {
        // Skip if already has assignments
        if (post.postTopics.length > 0) {
          results.skipped++;
          continue;
        }

        const topics = detectTopics(post.content);
        await assignTopics(post.id, topics, dryRun);

        results.updated++;
        results.processed++;

        // Save sample
        if (results.samples.length < 5) {
          results.samples.push({
            id: post.id,
            preview: post.content.substring(0, 100),
            topics
          });
        }

      } catch (error) {
        results.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
        results.processed++;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      results
    });

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger topic backfill',
    endpoint: '/api/admin/backfill-topics'
  });
}
// Automatic topic backfill service for uncategorized posts
// This runs on app startup to categorize posts that don't have topics

import { prisma } from '@/lib/prisma';
import { detectTopicsFromContent } from './topicDetection';

export interface BackfillResult {
  totalProcessed: number;
  successfullyUpdated: number;
  errors: string[];
}

/**
 * Find and categorize all posts that currently have no topics assigned
 * This runs automatically on app startup to ensure all content is properly categorized
 */
export async function backfillMissingTopics(): Promise<BackfillResult> {
  console.log('🔄 Starting topic backfill for uncategorized general posts...');

  const result: BackfillResult = {
    totalProcessed: 0,
    successfullyUpdated: 0,
    errors: []
  };

  try {
    // Find all posts with empty topics array or null topics
    const uncategorizedPosts = await prisma.generalPost.findMany({
      where: {
        OR: [
          { topics: { equals: [] } },  // Empty array
          { topics: { equals: null } }, // Null value
        ]
      },
      select: {
        id: true,
        content: true,
        topics: true
      },
      take: 50 // Process in smaller batches
    });

    console.log(`📊 Found ${uncategorizedPosts.length} uncategorized general posts`);
    result.totalProcessed = uncategorizedPosts.length;

    // Process each post
    for (const post of uncategorizedPosts) {
      try {
        const topicResult = await detectTopicsFromContent(post.content);
        const topics = topicResult.semanticTopics.length > 0 && topicResult.confidence > 0.2
          ? topicResult.semanticTopics
          : ['general'];

        await prisma.generalPost.update({
          where: { id: post.id },
          data: { topics }
        });

        result.successfullyUpdated++;
        console.log(`✅ Updated general post ${post.id} with topics: [${topics.join(', ')}]`);

      } catch (error) {
        const errorMsg = `Failed to process general post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `General post backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Backfill topics for society posts as well
 */
export async function backfillSocietyPostTopics(): Promise<BackfillResult> {
  console.log('🔄 Starting topic backfill for uncategorized society posts...');

  const result: BackfillResult = {
    totalProcessed: 0,
    successfullyUpdated: 0,
    errors: []
  };

  try {
    // Find society posts with no topics
    const uncategorizedPosts = await prisma.societyPost.findMany({
      where: {
        OR: [
          { topics: { equals: [] } },
          { topics: { equals: null } },
          { topics: { isEmpty: true } }
        ]
      },
      select: {
        id: true,
        content: true,
        topics: true
      },
      take: 50
    });

    result.totalProcessed = uncategorizedPosts.length;

    for (const post of uncategorizedPosts) {
      try {
        const topicResult = await detectTopicsFromContent(post.content);

        const topics = topicResult.semanticTopics.length > 0 && topicResult.confidence > 0.3
          ? topicResult.semanticTopics
          : ['general'];

        await prisma.societyPost.update({
          where: { id: post.id },
          data: { topics }
        });

        result.successfullyUpdated++;
        console.log(`✅ Updated society post ${post.id} with topics: [${topics.join(', ')}]`);

      } catch (error) {
        const errorMsg = `Failed to process society post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `Society post backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Backfill topics for ideas
 */
export async function backfillIdeaTopics(): Promise<BackfillResult> {
  const result: BackfillResult = { totalProcessed: 0, successfullyUpdated: 0, errors: [] };

  try {
    const uncategorizedIdeas = await prisma.idea.findMany({
      where: { OR: [{ topics: { equals: [] } }, { topics: { equals: null } }] },
      select: { id: true, content: true, topics: true },
      take: 50
    });

    result.totalProcessed = uncategorizedIdeas.length;
    console.log(`📊 Found ${uncategorizedIdeas.length} uncategorized ideas`);

    for (const idea of uncategorizedIdeas) {
      try {
        const topicResult = await detectTopicsFromContent(idea.content);
        const topics = topicResult.semanticTopics.length > 0 && topicResult.confidence > 0.2
          ? topicResult.semanticTopics : ['general'];

        await prisma.idea.update({ where: { id: idea.id }, data: { topics } });
        result.successfullyUpdated++;
        console.log(`✅ Updated idea ${idea.id} with topics: [${topics.join(', ')}]`);
      } catch (error) {
        result.errors.push(`Failed to process idea ${idea.id}`);
      }
    }
  } catch (error) {
    result.errors.push(`Idea backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Backfill topics for issues
 */
export async function backfillIssueTopics(): Promise<BackfillResult> {
  const result: BackfillResult = { totalProcessed: 0, successfullyUpdated: 0, errors: [] };

  try {
    const uncategorizedIssues = await prisma.issue.findMany({
      where: { OR: [{ topics: { equals: [] } }, { topics: { equals: null } }] },
      select: { id: true, content: true, topics: true },
      take: 50
    });

    result.totalProcessed = uncategorizedIssues.length;
    console.log(`📊 Found ${uncategorizedIssues.length} uncategorized issues`);

    for (const issue of uncategorizedIssues) {
      try {
        const topicResult = await detectTopicsFromContent(issue.content);
        const topics = topicResult.semanticTopics.length > 0 && topicResult.confidence > 0.2
          ? topicResult.semanticTopics : ['general'];

        await prisma.issue.update({ where: { id: issue.id }, data: { topics } });
        result.successfullyUpdated++;
        console.log(`✅ Updated issue ${issue.id} with topics: [${topics.join(', ')}]`);
      } catch (error) {
        result.errors.push(`Failed to process issue ${issue.id}`);
      }
    }
  } catch (error) {
    result.errors.push(`Issue backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Run complete topic backfill for all content types
 */
export async function runCompleteTopicBackfill(): Promise<{
  generalPosts: BackfillResult;
  societyPosts: BackfillResult;
  ideas: BackfillResult;
  issues: BackfillResult;
}> {
  console.log('🚀 Starting complete topic backfill for all content types...');

  const generalPosts = await backfillMissingTopics();
  const societyPosts = await backfillSocietyPostTopics();
  const ideas = await backfillIdeaTopics();
  const issues = await backfillIssueTopics();

  const totalProcessed = generalPosts.totalProcessed + societyPosts.totalProcessed + ideas.totalProcessed + issues.totalProcessed;
  const totalUpdated = generalPosts.successfullyUpdated + societyPosts.successfullyUpdated + ideas.successfullyUpdated + issues.successfullyUpdated;
  const totalErrors = generalPosts.errors.length + societyPosts.errors.length + ideas.errors.length + issues.errors.length;

  console.log(`🏁 Complete backfill finished: ${totalUpdated}/${totalProcessed} items updated, ${totalErrors} errors`);

  return { generalPosts, societyPosts, ideas, issues };
}
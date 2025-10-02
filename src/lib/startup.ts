// App startup initialization tasks
// Runs once when the server starts to ensure data integrity

import { runCompleteTopicBackfill } from '@/services/topicBackfill';

let hasRunStartup = false;

/**
 * Run startup tasks - should be called once when the app initializes
 * This ensures all posts are properly categorized and the app is ready
 */
export async function runStartupTasks() {
  // Prevent running multiple times
  if (hasRunStartup) {
    console.log('🔄 Startup tasks already completed, skipping...');
    return;
  }

  console.log('🚀 Running app startup tasks...');
  hasRunStartup = true;

  try {
    // Run topic backfill to categorize any uncategorized posts
    await runCompleteTopicBackfill();

    console.log('✅ All startup tasks completed successfully!');
  } catch (error) {
    console.error('❌ Startup tasks failed:', error);
    // Don't fail the app startup if this fails, just log the error
  }
}

/**
 * Reset startup flag (useful for testing or manual re-runs)
 */
export function resetStartupFlag() {
  hasRunStartup = false;
}
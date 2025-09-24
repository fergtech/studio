import { prisma } from '@/lib/prisma';
import { detectTopicsFromContent } from '@/services/topicDetection';
import { checkForHotTakeBattleOpportunity, createHotTakeBattle } from '@/services/hotTakeBattles';

/**
 * Backfill topics for existing posts that don't have any topics
 */
export async function backfillPostTopics() {
  console.log('🔍 Starting topic backfill for existing posts...');

  try {
    // Find posts without topics (get all posts and filter in memory for now)
    const allPosts = await prisma.generalPost.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Filter posts that have empty or no topics
    const postsWithoutTopics = allPosts.filter(post =>
      !post.topics || post.topics.length === 0
    );

    console.log(`📝 Found ${postsWithoutTopics.length} posts without topics`);

    if (postsWithoutTopics.length === 0) {
      console.log('✅ All posts already have topics!');
      return;
    }

    let processed = 0;
    let updated = 0;
    let battlesCreated = 0;

    for (const post of postsWithoutTopics) {
      try {
        console.log(`Processing post ${processed + 1}/${postsWithoutTopics.length}: ${post.id}`);

        // Use AI to detect topics
        const aiResult = await detectTopicsFromContent(post.content);

        if (aiResult.confidence > 0.5 && aiResult.semanticTopics.length > 0) {
          // Update post with topics
          await prisma.generalPost.update({
            where: { id: post.id },
            data: {
              topics: aiResult.semanticTopics
            }
          });

          console.log(`  ✅ Added topics: [${aiResult.semanticTopics.join(', ')}]`);
          updated++;

          // Check for potential hot take battles with recent posts
          if (aiResult.semanticTopics.length > 0) {
            try {
              const battleOpportunity = await checkForHotTakeBattleOpportunity(
                post.id,
                post.content,
                aiResult.semanticTopics
              );

              if (battleOpportunity.shouldCreateBattle && battleOpportunity.sharedTopic) {
                // Find the opposing post
                const recentPosts = await prisma.generalPost.findMany({
                  where: {
                    topics: { hasSome: aiResult.semanticTopics },
                    timestamp: {
                      gte: new Date(post.timestamp.getTime() - 7 * 24 * 60 * 60 * 1000),
                      lt: post.timestamp
                    },
                    id: { not: post.id },
                    AND: [
                      { battleAsPost1: { none: {} } },
                      { battleAsPost2: { none: {} } }
                    ]
                  },
                  orderBy: { timestamp: 'desc' },
                  take: 1
                });

                if (recentPosts.length > 0) {
                  const opposingPost = recentPosts[0];
                  const battle = await createHotTakeBattle({
                    post1Id: opposingPost.id,
                    post2Id: post.id,
                    topic: battleOpportunity.sharedTopic,
                    title: battleOpportunity.battleTitle || `${battleOpportunity.sharedTopic} Hot Take Battle`,
                    description: battleOpportunity.battleDescription
                  });

                  if (battle) {
                    console.log(`  🔥 Created Hot Take Battle: ${battle.title}`);
                    battlesCreated++;
                  }
                }
              }
            } catch (battleError) {
              console.error(`  ⚠️ Battle detection failed:`, battleError);
            }
          }
        } else {
          console.log(`  ⏭️ No confident topics found (confidence: ${aiResult.confidence})`);
        }

        processed++;

        // Add delay to avoid rate limiting
        if (processed % 10 === 0) {
          console.log(`  ⏸️ Processed ${processed} posts, taking a short break...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`  ❌ Error processing post ${post.id}:`, error);
        processed++;
        continue;
      }
    }

    console.log('\n🎉 Topic backfill completed!');
    console.log(`📊 Summary:`);
    console.log(`  - Posts processed: ${processed}`);
    console.log(`  - Posts updated with topics: ${updated}`);
    console.log(`  - Hot Take Battles created: ${battlesCreated}`);

  } catch (error) {
    console.error('💥 Fatal error during topic backfill:', error);
    throw error;
  }
}

/**
 * Run the backfill script
 */
async function main() {
  try {
    await backfillPostTopics();
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
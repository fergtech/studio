import { prisma } from '@/lib/prisma';

/**
 * Create test posts to demonstrate the topics and Hot Take Battle system
 */
async function createTestPosts() {
  console.log('🧪 Creating test posts for topics and Hot Take Battles...');

  try {
    // First, let's get an existing user or create a test user
    let testUser = await prisma.user.findFirst({
      where: {
        email: { contains: '@' } // Any user with an email
      }
    });

    if (!testUser) {
      console.log('No existing users found, creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'dummy-hash',
          name: 'Test User',
          image: 'https://i.pravatar.cc/40?u=testuser'
        }
      });
    }

    console.log(`Using user: ${testUser.name} (${testUser.id})`);

    // Create test posts that should trigger Hot Take Battles
    const testPosts = [
      {
        content: "We need more bike lanes downtown! They reduce traffic and pollution. #transportation #sustainability",
        topics: ['transportation', 'sustainability', 'bikelanes'],
        creatorName: "Sarah Chen",
        creatorAvatar: "https://i.pravatar.cc/40?u=sarah"
      },
      {
        content: "Bike lanes are causing more traffic congestion. We need more parking for cars instead. #transportation #traffic",
        topics: ['transportation', 'traffic', 'parking'],
        creatorName: "Mike Rodriguez",
        creatorAvatar: "https://i.pravatar.cc/40?u=mike"
      },
      {
        content: "Housing prices are out of control! We need rent control NOW to protect families. #housing #affordability",
        topics: ['housing', 'affordability', 'rentcontrol'],
        creatorName: "Lisa Johnson",
        creatorAvatar: "https://i.pravatar.cc/40?u=lisa"
      },
      {
        content: "Rent control actually makes housing worse. We need more supply - build more apartments! #housing #development",
        topics: ['housing', 'development', 'supply'],
        creatorName: "David Kim",
        creatorAvatar: "https://i.pravatar.cc/40?u=david"
      },
      {
        content: "The new school budget cuts are devastating our kids' education. We need better funding! #education #budget",
        topics: ['education', 'budget', 'schools'],
        creatorName: "Maria Garcia",
        creatorAvatar: "https://i.pravatar.cc/40?u=maria"
      },
      {
        content: "Great community barbecue at the park yesterday! Love seeing neighbors come together. #community #events",
        topics: ['community', 'events', 'social'],
        creatorName: "Alex Wong",
        creatorAvatar: "https://i.pravatar.cc/40?u=alex"
      }
    ];

    for (let i = 0; i < testPosts.length; i++) {
      const post = testPosts[i];

      // Create post with a slight time delay between each
      const timestamp = new Date(Date.now() - (testPosts.length - i) * 60000); // 1 minute apart

      const createdPost = await prisma.generalPost.create({
        data: {
          creatorId: testUser.id,
          creatorName: post.creatorName,
          creatorAvatar: post.creatorAvatar,
          content: post.content,
          topics: post.topics,
          timestamp: timestamp,
          background: '#333333' // Default background
        }
      });

      console.log(`✅ Created post ${i + 1}/${testPosts.length}: "${post.content.substring(0, 50)}..."`);
      console.log(`   Topics: [${post.topics.join(', ')}]`);
      console.log(`   Creator: ${post.creatorName}`);
    }

    console.log('\n🎉 Test posts created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 6 test posts created with different topics');
    console.log('   - 2 opposing posts about transportation (bike lanes)');
    console.log('   - 2 opposing posts about housing');
    console.log('   - 1 education post');
    console.log('   - 1 community post');
    console.log('\n🔥 These posts should trigger Hot Take Battles automatically!');
    console.log('💡 Topics will be displayed as hashtags on each post');
    console.log('🎯 Check your main feed to see the topics in action');

  } catch (error) {
    console.error('💥 Error creating test posts:', error);
    throw error;
  }
}

/**
 * Run the test post creation
 */
async function main() {
  try {
    await createTestPosts();
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
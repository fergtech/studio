"use server";

import { MediaType, HotTakeStance } from "@prisma/client"; // Added MediaType and HotTakeStance
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';
import { detectTopicsFromContent } from '@/services/topicDetection';
import { checkForHotTakeBattleOpportunity, createHotTakeBattle } from '@/services/hotTakeBattles';
import { cleanupOrphanedTopics } from '@/services/topicManager';

// CreatePostArgs is no longer needed if we pass FormData directly
// interface CreatePostArgs {
//   content: string;
//   background?: string;
//   linkedInitiativeId?: string;
//   // mediaFile?: File; // To be handled by FormData
//   // mediaType?: 'image' | 'video'; // To be handled by FormData
// }

export async function createGeneralPost(formData: FormData) { // Changed signature to accept FormData
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return { error: "User not authenticated or email missing.", success: false };
  }

  const userId = session.user.id;
  const userName = session.user.name || session.user.email.split('@')[0];
  const userAvatar = session.user.image || undefined;

  const content = formData.get('content') as string;
  // Background from form (for color gradients) - only used if no media is primary
  const formBackground = formData.get('formBackground') as string | undefined;
  const linkedInitiativeId = formData.get('linkedInitiativeId') as string | undefined;

  // Get manual topics from form
  const manualTopics = formData.getAll('topics') as string[];

  // Get uploaded media URLs and types (already uploaded via /api/upload)
  const mediaUrls = formData.getAll('mediaUrls') as string[];
  const mediaTypes = formData.getAll('mediaTypes') as string[]; // e.g., "image", "video"

  // Get battle context if provided
  const relatedBattleId = formData.get('relatedBattleId') as string | undefined;
  const battleTitle = formData.get('battleTitle') as string | undefined;

  if (!content || content.trim() === "") {
    return { error: "Content is required.", success: false };
  }

  try {
    // AI topic detection
    let allTopics = [...manualTopics]; // Start with manual topics

    // If this is a battle response, add the battle's topic to ensure it appears in topic feeds
    if (relatedBattleId) {
      try {
        const battle = await prisma.hotTakeBattle.findUnique({
          where: { id: relatedBattleId },
          select: { topic: true }
        });
        if (battle && battle.topic && !allTopics.includes(battle.topic)) {
          allTopics.unshift(battle.topic); // Add battle topic as first item
        }
      } catch (error) {
        console.error('Failed to fetch battle topic:', error);
      }
    }

    // Use AI to detect semantic topics if we have fewer than 3 manual topics
    if (manualTopics.length < 3) {
      console.log('🚀 Post Creation: Starting topic detection for content:', content);
      console.log('📋 Manual topics provided:', manualTopics);
      try {
        // Use the old system without postId first to get initial topics
        const aiResult = await detectTopicsFromContent(content);
        console.log('🎯 AI Detection result:', aiResult);
        if (aiResult.confidence > 0.5) {
          // Add AI-detected topics that aren't already in manual topics
          const newAiTopics = aiResult.semanticTopics.filter(
            aiTopic => !manualTopics.includes(aiTopic)
          );
          allTopics = [...manualTopics, ...newAiTopics].slice(0, 5); // Max 5 total topics
        }
      } catch (aiError) {
        console.error('AI topic detection failed, continuing with manual topics only:', aiError);
      }
    }

    const mediaItemsToCreate: { url: string; type: MediaType }[] = [];
    let postBackground: string | undefined = formBackground; // Default to form background

    if (mediaUrls && mediaUrls.length > 0 && mediaTypes && mediaTypes.length === mediaUrls.length) {
      for (let i = 0; i < mediaUrls.length; i++) {
        const mediaUrl = mediaUrls[i];
        const typeString = mediaTypes[i].toLowerCase(); // "image", "video"

        let dbMediaType: MediaType | undefined = undefined;
        if (typeString === 'image') {
          dbMediaType = MediaType.image;
          if (i === 0) { // If it's the first media item and it's an image
            postBackground = mediaUrl; // Use its URL as the post's background/cover
          }
        } else if (typeString === 'video') {
          dbMediaType = MediaType.video;
        }
        // TODO: Add handling for other media types like PDF if MediaType enum is expanded

        if (mediaUrl && dbMediaType) {
          mediaItemsToCreate.push({ url: mediaUrl, type: dbMediaType });
        }
      }
    }

    const dataToCreate: any = {
      creatorId: userId,
      creatorName: userName,
      creatorAvatar: userAvatar,
      content: content,
      background: postBackground, // Set based on first image or formBackground
      topics: [], // Keep empty - we use the relational system now
    };

    if (linkedInitiativeId) {
      dataToCreate.linkedInitiativeId = linkedInitiativeId;
    }

    if (mediaItemsToCreate.length > 0) {
      dataToCreate.media = {
        create: mediaItemsToCreate,
      };
    }

    const newPost = await prisma.generalPost.create({
      data: dataToCreate,
      include: {
        creator: true,
        media: true, // Ensure media is included in the returned post
      },
    });

    // Use the new dynamic topic system to assign topics to the post
    let assignedTopicNames: string[] = [];
    try {
      console.log('🧠 Applying dynamic topic assignment to post:', newPost.id);
      const dynamicTopics = await detectTopicsFromContent(content, newPost.id);
      console.log('✅ Dynamic topics assigned:', dynamicTopics.semanticTopics);
      assignedTopicNames = dynamicTopics.semanticTopics;
    } catch (dynamicTopicError) {
      console.error('Dynamic topic assignment failed (post still created):', dynamicTopicError);
    }

    // If this is a battle response, create the relation
    if (relatedBattleId) {
      try {
        await prisma.hotTakeRelatedPost.create({
          data: {
            battleId: relatedBattleId,
            postId: newPost.id,
            stance: HotTakeStance.CUSTOM_TAKE // Battle response posts are custom takes
          }
        });
        console.log(`Created battle relation: post ${newPost.id} -> battle ${relatedBattleId}`);
      } catch (error) {
        console.error('Failed to create battle relation:', error);
        // Don't fail the post creation if battle relation fails
      }
    }

    // Check for Hot Take Battle opportunities (async, don't block response)
    if (assignedTopicNames.length > 0) {
      setImmediate(async () => {
        try {
          console.log(`🔍 Checking for Hot Take Battle with topics: ${assignedTopicNames.join(', ')}`);
          const battleOpportunity = await checkForHotTakeBattleOpportunity(
            newPost.id,
            content,
            assignedTopicNames,
            undefined // TODO: Add location support
          );
          console.log(`🎲 Battle opportunity result:`, battleOpportunity);

          if (battleOpportunity.shouldCreateBattle && battleOpportunity.sharedTopic) {
            console.log(`🔥 Battle detected! Shared topic: ${battleOpportunity.sharedTopic}`);
            // Get topic IDs for querying
            const topicRecords = await prisma.topic.findMany({
              where: { name: { in: assignedTopicNames } },
              select: { id: true }
            });
            const topicIds = topicRecords.map(t => t.id);
            console.log(`📋 Topic IDs: ${topicIds.join(', ')}`);

            // Find the opposing post using PostTopic relation
            const recentPosts = await prisma.generalPost.findMany({
              where: {
                postTopics: {
                  some: {
                    topicId: { in: topicIds }
                  }
                },
                timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                id: { not: newPost.id },
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
              console.log(`⚔️ Creating battle between posts: ${opposingPost.id} vs ${newPost.id}`);
              await createHotTakeBattle({
                post1Id: opposingPost.id, // Earlier post
                post2Id: newPost.id,      // New post
                topic: battleOpportunity.sharedTopic,
                title: battleOpportunity.battleTitle || `${battleOpportunity.sharedTopic} Hot Take Battle`,
                description: battleOpportunity.battleDescription
              });
              console.log(`🔥 Hot Take Battle created successfully: ${battleOpportunity.battleTitle}`);
            } else {
              console.log(`❌ No opposing posts found for battle detection`);
            }
          }
        } catch (error) {
          console.error('Error in Hot Take Battle detection:', error);
        }
      });
    }

    revalidatePath("/");
    if (linkedInitiativeId) {
      revalidatePath(`/initiatives/${linkedInitiativeId}`);
    }

    return { success: true, post: newPost };
  } catch (error) {
    console.error("Error creating general post:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: `Failed to create post: ${errorMessage}`, success: false };
  }
}

export async function deletePostAction(postId: string) {
  const session = await getServerSession(authOptions); // Changed to getServerSession
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const currentUserId = session.user.id;

  try {
    const post = await prisma.generalPost.findUnique({
      where: { id: postId },
      select: { creatorId: true }, // Ensured this is creatorId
    });

    if (!post) {
      return { error: "Post not found." };
    }

    if (post.creatorId !== currentUserId) { // Ensured this is creatorId
      return { error: "User not authorized to delete this post." };
    }

    // Delete related records first to avoid foreign key constraint violations
    await prisma.generalPostComment.deleteMany({
      where: { postId }
    });

    await prisma.generalPostLike.deleteMany({
      where: { postId }
    });

    await prisma.generalPostShare.deleteMany({
      where: { postId }
    });

    // Get topic assignments to decrement counts
    const topicAssignments = await prisma.postTopic.findMany({
      where: { postId },
      include: { topic: true }
    });

    // Decrement topic counts before deleting assignments
    for (const assignment of topicAssignments) {
      await prisma.topic.update({
        where: { id: assignment.topicId },
        data: {
          postCount: { decrement: 1 },
          weeklyPosts: { decrement: 1 }
        }
      });
    }

    await prisma.postTopic.deleteMany({
      where: { postId }
    });

    await prisma.hotTakeRelatedPost.deleteMany({
      where: { postId }
    });

    await prisma.generalPost.delete({
      where: { id: postId },
    });

    // Clean up orphaned topics
    await cleanupOrphanedTopics();

    revalidatePath("/"); // Revalidate the home page
    return { success: "Post deleted successfully." };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { error: "Failed to delete post. Please try again." };
  }
}

export async function updateGeneralPostContent(postId: string, newContent: string, updateData?: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }
  const currentUserId = session.user.id;
  try {
    // Check if the post exists and belongs to the user
    const post = await prisma.generalPost.findUnique({
      where: { id: postId },
      select: { creatorId: true },
    });
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    if (post.creatorId !== currentUserId) {
      return { success: false, error: 'Not authorized' };
    }

    // Prepare update payload
    const updatePayload: any = { content: newContent };

    // Handle media updates if provided
    if (updateData) {
      if (updateData.removeMedia) {
        // Remove existing media
        updatePayload.media = { deleteMany: {} };
      } else if (updateData.mediaUrl) {
        // Add or replace media
        updatePayload.media = {
          deleteMany: {}, // Clear existing media first
          create: [{
            type: updateData.mediaType || 'image',
            url: updateData.mediaUrl,
          }],
        };
      }
    }

    await prisma.generalPost.update({
      where: { id: postId },
      data: updatePayload,
    });

    // Re-run topic detection on the updated content
    try {
      console.log('🔄 Re-detecting topics after post edit:', postId);
      await detectTopicsFromContent(newContent, postId);
      console.log('✅ Topics updated after edit');

      // Clean up orphaned topics (topics with 0 posts)
      await cleanupOrphanedTopics();
    } catch (topicError) {
      console.error('Topic re-detection failed (post still updated):', topicError);
    }

    // Revalidate the post detail page and home page
    revalidatePath(`/posts/${postId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error('Error in updateGeneralPostContent:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
  }
}

export async function updateSocietyPostContent(postId: string, newContent: string, updateData?: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }
  const currentUserId = session.user.id;
  try {
    // Check if the post exists and belongs to the user
    const post = await prisma.societyPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    if (post.userId !== currentUserId) {
      return { success: false, error: 'Not authorized' };
    }

    // Prepare update payload
    const updatePayload: any = { content: newContent };

    // Handle media updates if provided - society posts use imageUrl field
    if (updateData) {
      if (updateData.removeMedia) {
        updatePayload.imageUrl = null;
      } else if (updateData.mediaUrl) {
        updatePayload.imageUrl = updateData.mediaUrl;
      }
    }

    await prisma.societyPost.update({
      where: { id: postId },
      data: updatePayload,
    });

    // Revalidate the post detail page and home page
    revalidatePath(`/posts/${postId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error('Error in updateSocietyPostContent:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
  }
}

export async function deleteSocietyPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }
  const currentUserId = session.user.id;
  try {
    // Check if the post exists and belongs to the user
    const post = await prisma.societyPost.findUnique({
      where: { id: postId },
      select: { userId: true, societyId: true },
    });
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    if (post.userId !== currentUserId) {
      return { success: false, error: 'Not authorized' };
    }

    // Delete the post (cascade will handle related data like comments, likes, etc.)
    await prisma.societyPost.delete({
      where: { id: postId },
    });

    revalidatePath(`/societies/${post.societyId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error('Error in deleteSocietyPost:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
  }
}

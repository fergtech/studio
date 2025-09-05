"use server";

import { MediaType } from "@prisma/client"; // Added MediaType
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';

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

  // Get uploaded media URLs and types (already uploaded via /api/upload)
  const mediaUrls = formData.getAll('mediaUrls') as string[];
  const mediaTypes = formData.getAll('mediaTypes') as string[]; // e.g., "image", "video"

  if (!content || content.trim() === "") {
    return { error: "Content is required.", success: false };
  }

  try {
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

    await prisma.generalPost.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // Revalidate the home page
    return { success: "Post deleted successfully." };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { error: "Failed to delete post. Please try again." };
  }
}

export async function updateGeneralPostContent(postId: string, newContent: string) {
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
    await prisma.generalPost.update({
      where: { id: postId },
      data: { content: newContent },
    });
    
    // Revalidate the post detail page and home page
    revalidatePath(`/posts/${postId}`);
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateGeneralPostContent:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
  }
}

export async function updateSocietyPostContent(postId: string, newContent: string) {
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
    await prisma.societyPost.update({
      where: { id: postId },
      data: { content: newContent },
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

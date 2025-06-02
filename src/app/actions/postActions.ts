"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Corrected import path
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';

interface CreatePostArgs {
  content: string;
  background?: string;
  linkedInitiativeId?: string;
  // We'll skip media file handling for now, that would require a more complex setup
  // mediaUrl?: string;
  // mediaType?: 'image' | 'video';
}

export async function createGeneralPost(args: CreatePostArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) { // Ensure email is also present for fallback
    return { error: "User not authenticated or email missing." };
  }

  const userId = session.user.id;
  const userName = session.user.name || session.user.email.split('@')[0]; // Fallback for name
  const userAvatar = session.user.image || undefined; // Use image or undefined

  try {
    const dataToCreate: any = {
      creatorId: userId,
      creatorName: userName, // Add mandatory creatorName
      creatorAvatar: userAvatar, // Add optional creatorAvatar
      content: args.content,
    };

    if (args.background) {
      dataToCreate.background = args.background;
    }

    if (args.linkedInitiativeId) {
      dataToCreate.linkedInitiativeId = args.linkedInitiativeId;
    }

    const newPost = await prisma.generalPost.create({
      data: dataToCreate,
      include: {
        creator: true,
        media: true,
      }
    });

    // Revalidate the path where posts are displayed (e.g., the home page)
    revalidatePath("/");
    if (args.linkedInitiativeId) {
      revalidatePath(`/initiatives/${args.linkedInitiativeId}`);
    }

    return { success: true, post: newPost };
  } catch (error) {
    console.error("Error creating general post:", error);
    return { error: "Failed to create post." };
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
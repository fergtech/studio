"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

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
  } finally {
    await prisma.$disconnect();
  }
}
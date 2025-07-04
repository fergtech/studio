"use server";

import { PrismaClient, MediaType } from "@prisma/client"; // Added MediaType
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob"; // Added Azure SDK
import { v4 as uuidv4 } from 'uuid'; // For unique blob names

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

  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    return { error: "Azure Storage connection string is not configured.", success: false };
  }
  if (!AZURE_STORAGE_CONTAINER_NAME) {
    return { error: "Azure Storage container name is not configured.", success: false };
  }

  const userId = session.user.id;
  const userName = session.user.name || session.user.email.split('@')[0];
  const userAvatar = session.user.image || undefined;

  const content = formData.get('content') as string;
  // Background from form (for color gradients) - only used if no media is primary
  const formBackground = formData.get('formBackground') as string | undefined; 
  const linkedInitiativeId = formData.get('linkedInitiativeId') as string | undefined;

  const mediaFiles = formData.getAll('mediaFiles') as File[];
  const mediaTypes = formData.getAll('mediaTypes') as string[]; // e.g., "image", "video"

  if (!content || content.trim() === "") {
    return { error: "Content is required.", success: false };
  }

  try {
    const mediaItemsToCreate: { url: string; type: MediaType }[] = [];
    let postBackground: string | undefined = formBackground; // Default to form background

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    // Ensure container exists - might be good to do this once at app startup or handle errors gracefully
    // await containerClient.createIfNotExists(); 

    if (mediaFiles && mediaFiles.length > 0 && mediaTypes && mediaTypes.length === mediaFiles.length) {
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const typeString = mediaTypes[i].toLowerCase(); // "image", "video"

        const blobName = `${uuidv4()}-${file.name}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        try {
          const arrayBuffer = await file.arrayBuffer();
          await blockBlobClient.uploadData(arrayBuffer, {
            blobHTTPHeaders: { blobContentType: file.type } // Set content type
          });
          const mediaUrl = blockBlobClient.url;

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
        } catch (uploadError) {
          console.error(`Failed to upload blob ${blobName}:`, uploadError);
          // Optionally, decide if one failed upload should stop the whole post creation
          // For now, it continues and tries to create the post with successfully uploaded media
          // return { error: `Failed to upload file: ${file.name}.`, success: false }; 
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

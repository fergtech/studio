"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Idea, MediaItem, User, Prisma } from "@prisma/client";
import { revalidatePath } from 'next/cache';
import { MediaType } from "@prisma/client";

// Define a type that includes media and creator for Idea
type IdeaWithMediaAndCreator = Idea & {
  media: MediaItem[];
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

interface CreateIdeaData {
  title: string;
  description: string;
  tags: string[];
  location?: string | null;
  mediaUrl?: string | null;
}

interface UpdateIdeaData {
  title?: string;
  description?: string;
  tags?: string[];
  location?: string | null;
  mediaUrl?: string | null;
}

interface CreateIdeaResult {
  success: boolean;
  idea?: Idea;
  error?: string;
}

interface UpdateIdeaResult {
  success: boolean;
  idea?: Idea;
  error?: string;
}

interface GetIdeaByIdResult {
  success: boolean;
  idea?: IdeaWithMediaAndCreator | null;
  error?: string;
}

interface UpdateIdeaArgs {
  ideaId: string;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  mediaUrl?: string;
}

export async function createIdea(data: CreateIdeaData): Promise<CreateIdeaResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newIdea = await tx.idea.create({
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags || [],
          location: data.location,
          creator: {
            connect: {
              id: session.user.id,
            },
          },
        },
      });

      if (data.mediaUrl) {
        await tx.mediaItem.create({
          data: {
            url: data.mediaUrl,
            type: 'image',
            idea: {
              connect: {
                id: newIdea.id,
              },
            },
          },
        });
      }

      return newIdea;
    });

    return { success: true, idea: result };
  } catch (error) {
    console.error("Error creating idea:", error);
    return { success: false, error: "Failed to create idea." };
  }
}

export async function getIdeaById(ideaId: string): Promise<GetIdeaByIdResult> {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        media: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }) as IdeaWithMediaAndCreator | null; // Explicitly cast

    if (idea) {
      return { success: true, idea };
    } else {
      return { success: false, idea: null, error: "Idea not found." };
    }
  } catch (error) {
    console.error("Error fetching idea:", error);
    return { success: false, idea: null, error: "Failed to fetch idea." };
  }
}

export async function updateIdea({
  ideaId,
  title,
  description,
  tags,
  location,
  mediaUrl,
}: UpdateIdeaArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "You must be logged in to update an idea." };
  }

  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { creatorId: true },
    });

    if (!idea) {
      return { error: "Idea not found." };
    }

    if (idea.creatorId !== session.user.id) {
      return { error: "You are not authorized to update this idea." };
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    if (location) updateData.location = location;

    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: updateData,
    });

    // Handle mediaUrl updates
    if (mediaUrl !== undefined) { // Check if mediaUrl was provided in the update, even if null
      // Delete existing media items for this idea
      await prisma.mediaItem.deleteMany({
        where: { ideaId },
      });

      if (mediaUrl) {
        // Create new media item if a URL is provided (i.e., not null or empty string)
        await prisma.mediaItem.create({
          data: {
            url: mediaUrl,
            type: "image",
            ideaId,
          },
        });
      }
    }

    return { success: true, idea: updatedIdea };
  } catch (error) {
    console.error("Error updating idea:", error);
    return { error: "Failed to update idea." };
  }
} 

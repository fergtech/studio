"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Idea, MediaItem } from "@/lib/types";
import { revalidatePath } from 'next/cache';
import { lookupByPostalCode } from "@/services/location";
import { contentModerationService } from '@/services/contentModeration';
import { detectTopicsFromContent } from '@/services/topicDetection';

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
  latitude?: number | null;
  longitude?: number | null;
  mediaUrl?: string | null;
  societyId?: string | null;
  addressingIssueId?: string | null;
}

interface UpdateIdeaData {
  title?: string;
  description?: string;
  tags?: string[];
  location?: string | null;
  mediaUrl?: string | null;
  societyId?: string | null;
  addressingIssueId?: string | null;
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
  societyId?: string | null;
  addressingIssueId?: string | null;
}

export async function createIdea(data: CreateIdeaData): Promise<CreateIdeaResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Add validation logging
  console.log("Creating idea with data:", data);
  console.log("Session user ID:", session.user.id);

  if (!data.title?.trim()) {
    console.error("Idea creation failed: Missing title");
    return { success: false, error: "Title is required" };
  }

  if (!data.description?.trim()) {
    console.error("Idea creation failed: Missing description");
    return { success: false, error: "Description is required" };
  }

  try {
    // Content moderation
    console.log('🛡️ Running moderation for Idea...');
    const moderationResult = await contentModerationService.moderateContent({
      content: `${data.title}\n\n${data.description}`,
      imageUrl: data.mediaUrl || undefined,
      userId: session.user.id,
      contentType: 'idea'
    });

    // Handle rejected content
    if (!moderationResult.approved && !moderationResult.requiresHumanReview) {
      return {
        success: false,
        error: `Content violates community guidelines: ${moderationResult.flags.join(', ')}`
      };
    }

    // Use provided coordinates or geocode if needed
    let coordinates: { lat: number; lng: number } | null = null;

    if (data.latitude && data.longitude) {
      // Frontend already provided coordinates
      coordinates = { lat: data.latitude, lng: data.longitude };
    } else if (data.location) {
      // Fallback: try to geocode the location string
      try {
        if (/^\d{5}$/.test(data.location.trim())) {
          const resolved = await lookupByPostalCode(data.location.trim());
          coordinates = resolved.coordinates;
        }
      } catch (error) {
        console.log('Geocoding failed for location:', data.location, error);
      }
    }

    // AI Topic Detection - populate tags if not manually provided
    let finalTags = data.tags || [];
    if (finalTags.length < 3) {
      try {
        console.log('🚀 Idea Creation: Starting AI topic detection');
        const contentForDetection = `${data.title}\n\n${data.description}`;
        // Don't pass postId - we just want the AI analysis
        const aiResult = await detectTopicsFromContent(contentForDetection);

        if (aiResult.confidence > 0.5 && aiResult.semanticTopics.length > 0) {
          // Add AI-detected topics that aren't already in manual tags
          const newAiTopics = aiResult.semanticTopics.filter(
            aiTopic => !finalTags.includes(aiTopic)
          );
          finalTags = [...finalTags, ...newAiTopics].slice(0, 5); // Max 5 total tags
          console.log('✅ AI topics detected for Idea:', finalTags);
        }
      } catch (aiError) {
        console.error('AI topic detection failed for Idea (continuing with manual tags):', aiError);
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createData: Prisma.IdeaCreateInput = {
        title: data.title,
        description: data.description,
        tags: finalTags,
        location: data.location,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        moderationStatus: moderationResult.requiresHumanReview ? 'pending_review' : 'approved',
        moderationFlags: moderationResult.flags,
        moderationScore: moderationResult.confidence,
        moderationReasoning: moderationResult.reasoning,
        creator: {
          connect: {
            id: session.user.id,
          },
        },
      };

      // Only add society if societyId is provided and not null
      if (data.societyId) {
        createData.society = { connect: { id: data.societyId } };
      }

      // Only add addressingIssue if addressingIssueId is provided and not null
      if (data.addressingIssueId) {
        createData.addressingIssue = { connect: { id: data.addressingIssueId } };
      }

      const newIdea = await tx.idea.create({
        data: createData,
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

      // Fetch the idea with media and creator to match the expected return type
      const fullIdea = await tx.idea.findUnique({
        where: { id: newIdea.id },
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
      });

      return fullIdea;
    });

    return { success: true, idea: result ?? undefined };
  } catch (error) {
    console.error("Error creating idea:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return { success: false, error: `Database error: ${error.message}` };
    }
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
  societyId,
  addressingIssueId,
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

    const updateData: Prisma.IdeaUpdateInput = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    if (location !== undefined) updateData.location = location;
    if (societyId !== undefined) {
      updateData.society = societyId ? { connect: { id: societyId } } : { disconnect: true };
    }
    if (addressingIssueId !== undefined) {
      updateData.addressingIssue = addressingIssueId ? { connect: { id: addressingIssueId } } : { disconnect: true };
    }

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

export async function deleteIdea(ideaId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }
  // Check if the user is the creator
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) return { error: 'Idea not found' };
  if (idea.creatorId !== session.user.id) return { error: 'Not authorized' };
  try {
    // Delete associated media
    await prisma.mediaItem.deleteMany({ where: { ideaId } });
    // Delete associated comments (if you have an IdeaComment model)
    await prisma.ideaComment.deleteMany({ where: { ideaId } });
    // Delete likes/shares if you have those models
    await prisma.ideaLike.deleteMany({ where: { ideaId } });
    await prisma.ideaShare.deleteMany({ where: { ideaId } });
    // Delete the idea itself
    await prisma.idea.delete({ where: { id: ideaId } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting idea:', error);
    return { error: 'Failed to delete idea.' };
  }
} 

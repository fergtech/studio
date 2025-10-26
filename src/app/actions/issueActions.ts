"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Issue, MediaItem } from "@/lib/types";
import { revalidatePath } from 'next/cache';
import { lookupByPostalCode } from "@/services/location";
import { contentModerationService } from '@/services/contentModeration';
import { detectTopicsFromContent } from '@/services/topicDetection';

type IssueWithMediaAndCreator = Issue & {
  media: MediaItem[];
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

interface CreateIssueData {
  title: string;
  description: string;
  tags: string[];
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mediaUrl?: string | null;
  societyId?: string | null;
}

interface CreateIssueResult {
  success: boolean;
  issue?: Issue;
  error?: string;
}

interface UpdateIssueData {
  title?: string;
  description?: string;
  tags?: string[];
  location?: string | null;
  mediaUrl?: string | null;
  societyId?: string | null;
}

interface UpdateIssueArgs {
  issueId: string;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  mediaUrl?: string;
  societyId?: string | null;
}

interface GetIssueByIdResult {
  success: boolean;
  issue?: IssueWithMediaAndCreator | null;
  error?: string;
}

export async function createIssue(data: CreateIssueData): Promise<CreateIssueResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Content moderation
    console.log('🛡️ Running moderation for Issue...');
    const moderationResult = await contentModerationService.moderateContent({
      content: `${data.title}\n\n${data.description}`,
      imageUrl: data.mediaUrl || undefined,
      userId: session.user.id,
      contentType: 'issue'
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
        console.log('🚀 Issue Creation: Starting AI topic detection');
        const contentForDetection = `${data.title}\n\n${data.description}`;
        // Don't pass postId - we just want the AI analysis
        const aiResult = await detectTopicsFromContent(contentForDetection);

        if (aiResult.confidence > 0.5 && aiResult.semanticTopics.length > 0) {
          // Add AI-detected topics that aren't already in manual tags
          const newAiTopics = aiResult.semanticTopics.filter(
            aiTopic => !finalTags.includes(aiTopic)
          );
          finalTags = [...finalTags, ...newAiTopics].slice(0, 5); // Max 5 total tags
          console.log('✅ AI topics detected for Issue:', finalTags);
        }
      } catch (aiError) {
        console.error('AI topic detection failed for Issue (continuing with manual tags):', aiError);
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createData: Prisma.IssueCreateInput = {
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

      // Only add societyId if it's provided and not null
      if (data.societyId) {
        createData.societyId = data.societyId;
      }

      const newIssue = await tx.issue.create({
        data: createData,
      });

      if (data.mediaUrl) {
        await tx.mediaItem.create({
          data: {
            url: data.mediaUrl,
            type: 'image',
            issue: {
              connect: {
                id: newIssue.id,
              },
            },
          },
        });
      }

      return newIssue;
    });

    return { success: true, issue: result };
  } catch (error) {
    console.error("Error creating issue:", error);
    return { success: false, error: "Failed to create issue." };
  }
}

export async function getIssueById(issueId: string): Promise<GetIssueByIdResult> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
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
    }) as IssueWithMediaAndCreator | null;

    if (issue) {
      return { success: true, issue };
    } else {
      return { success: false, issue: null, error: "Issue not found." };
    }
  } catch (error) {
    console.error("Error fetching issue:", error);
    return { success: false, issue: null, error: "Failed to fetch issue." };
  }
}

export async function updateIssue({
  issueId,
  title,
  description,
  tags,
  location,
  mediaUrl,
  societyId,
}: UpdateIssueArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "You must be logged in to update an issue." };
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { creatorId: true },
    });

    if (!issue) {
      return { error: "Issue not found." };
    }

    if (issue.creatorId !== session.user.id) {
      return { error: "You are not authorized to update this issue." };
    }

    const updateData: Prisma.IssueUpdateInput = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    if (location !== undefined) updateData.location = location;
    if (societyId !== undefined) updateData.societyId = societyId;

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
    });

    // Handle mediaUrl updates
    if (mediaUrl !== undefined) { // Check if mediaUrl was provided in the update, even if null
      // Delete existing media items for this issue
      await prisma.mediaItem.deleteMany({
        where: { issueId },
      });

      if (mediaUrl) {
        // Create new media item if a URL is provided (i.e., not null or empty string)
        await prisma.mediaItem.create({
          data: {
            url: mediaUrl,
            type: "image",
            issueId,
          },
        });
      }
    }

    return { success: true, issue: updatedIssue };
  } catch (error) {
    console.error("Error updating issue:", error);
    return { error: "Failed to update issue." };
  }
}

export async function deleteIssue(issueId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }
  // Check if the user is the creator
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return { error: 'Issue not found' };
  if (issue.creatorId !== session.user.id) return { error: 'Not authorized' };
  try {
    // Delete associated media
    await prisma.mediaItem.deleteMany({ where: { issueId } });
    // Delete associated comments (if you have an IssueComment model)
    await prisma.issueComment.deleteMany({ where: { issueId } });
    // Delete likes/shares if you have those models
    await prisma.issueLike.deleteMany({ where: { issueId } });
    await prisma.issueShare.deleteMany({ where: { issueId } });
    // Delete the issue itself
    await prisma.issue.delete({ where: { id: issueId } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting issue:', error);
    return { error: 'Failed to delete issue.' };
  }
} 

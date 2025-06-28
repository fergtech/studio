"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Issue, MediaItem, User, Prisma } from "@prisma/client";
import { revalidatePath } from 'next/cache';
import { MediaType } from "@prisma/client";

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
  mediaUrl?: string | null;
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
}

interface UpdateIssueArgs {
  issueId: string;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  mediaUrl?: string;
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
    const result = await prisma.$transaction(async (tx) => {
      const newIssue = await tx.issue.create({
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

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    if (location) updateData.location = location;

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
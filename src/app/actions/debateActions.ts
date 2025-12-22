"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';

export async function updateDebateTopicContent(
  debateId: string,
  newContent: string,
  newTitle?: string,
  newMediaUrl?: string | null,
  removeMedia?: boolean
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const currentUserId = session.user.id;

  try {
    // Check if the debate topic exists and belongs to the user
    const debateTopic = await prisma.debateTopic.findUnique({
      where: { id: debateId },
      select: { creatorId: true },
    });

    if (!debateTopic) {
      return { success: false, error: 'Debate topic not found' };
    }

    if (debateTopic.creatorId !== currentUserId) {
      return { success: false, error: 'Not authorized to edit this debate topic' };
    }

    // Prepare update data
    const updateData: any = { content: newContent };
    if (newTitle) {
      updateData.title = newTitle;
    }

    // Handle media updates
    if (newMediaUrl) {
      updateData.imageUrl = newMediaUrl;
    } else if (removeMedia) {
      updateData.imageUrl = null;
    }

    await prisma.debateTopic.update({
      where: { id: debateId },
      data: updateData,
    });

    // Revalidate the debate detail page
    revalidatePath(`/debates/${debateId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating debate topic:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
  }
}
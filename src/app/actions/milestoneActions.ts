'use server';

import { prisma } from '@/lib/prisma'; // Assuming prisma client is exported from here
import { MilestoneStatus, UpdateType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createUpdate } from './initiativeActions'; // For activity feed

interface MilestoneCreateData {
  initiativeId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  order?: number;
  creatorId: string;
}

export async function createMilestone(data: MilestoneCreateData) {
  try {
    const milestone = await prisma.milestone.create({
      data: {
        initiativeId: data.initiativeId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        order: data.order,
        status: MilestoneStatus.Planned, // Default status
        creatorId: data.creatorId,
      },
    });

    // Create an update for the activity feed
    await createUpdate({
      initiativeId: data.initiativeId,
      type: UpdateType.milestone_creation,
      userId: data.creatorId,
      content: `New milestone added: ${milestone.title}`,
      details: { milestoneId: milestone.id, milestoneTitle: milestone.title },
    });

    revalidatePath(`/initiatives/${data.initiativeId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error creating milestone:", error);
    return { success: false, error: "Failed to create milestone." };
  }
}

export async function updateMilestoneStatus(milestoneId: string, status: MilestoneStatus, initiativeId: string, userId: string) {
  try {
    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status },
    });

    // Create an update for the activity feed
    await createUpdate({
      initiativeId: initiativeId,
      type: UpdateType.milestone_status,
      userId: userId, // User performing the update
      content: `Milestone '${milestone.title}' status updated to ${status}`,
      details: { milestoneId: milestone.id, milestoneTitle: milestone.title, newStatus: status },
    });

    revalidatePath(`/initiatives/${initiativeId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error updating milestone status:", error);
    return { success: false, error: "Failed to update milestone status." };
  }
}
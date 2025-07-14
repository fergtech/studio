'use server';

import { PrismaClient, GoalStatus, Priority, UpdateType } from '@prisma/client'; // Changed import
import { revalidatePath } from 'next/cache';
import { createUpdate } from './initiativeActions'; // For activity feed
import { prisma } from '@/lib/prisma';

interface GoalCreateData {
  initiativeId: string;
  title: string;
  description: string;
  ownerId: string; // Changed: ownerId is now required
  status?: GoalStatus;
  priority?: Priority;
  dueDate?: Date;
  creatorId: string; // User creating the goal
  tags?: string[];
}

export async function createGoal(data: GoalCreateData) {
  try {
    const goal = await prisma.goal.create({
      data: {
        initiativeId: data.initiativeId,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        status: data.status || GoalStatus.NotStarted,
        priority: data.priority,
        dueDate: data.dueDate,
        tags: data.tags,
      },
    });

    return { success: true, goal };
  } catch (error) {
    console.error("Error creating goal:", error);
    return { success: false, error: "Failed to create goal." };
  }
}

interface GoalUpdateData {
  title?: string;
  description?: string;
  ownerId?: string | null; // Allow unassigning
  status?: GoalStatus;
  priority?: Priority;
  dueDate?: Date | null;
  progress?: number | null;
  tags?: string[];
}

export async function updateGoal(goalId: string, initiativeId: string, data: GoalUpdateData, userId: string) {
  try {
    let ownerName;
    let ownerAvatar;

    // Check if ownerId is explicitly being set (even to null)
    if (data.ownerId !== undefined) {
      if (data.ownerId === null) { // Unassigning owner
        ownerName = null;
        ownerAvatar = null;
      } else { // Assigning a new owner
        const owner = await prisma.user.findUnique({ where: { id: data.ownerId } });
        if (owner) {
          ownerName = owner.name;
          ownerAvatar = owner.image;
        } else {
          // Handle case where ownerId is provided but user not found, perhaps throw error or ignore
          console.warn(`Owner with ID ${data.ownerId} not found for goal ${goalId}.`);
        }
      }
    }

    const currentGoal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!currentGoal) {
      return { success: false, error: "Goal not found." };
    }
    
    const updatePayload: any = { ...data };
    if (data.ownerId !== undefined) {
        updatePayload.ownerId = data.ownerId;
        updatePayload.ownerName = ownerName;
        updatePayload.ownerAvatar = ownerAvatar;
    }


    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updatePayload,
    });

    // Create an update for the activity feed
    // Consider making this more specific based on what changed
    await createUpdate({
      initiativeId: initiativeId,
      type: UpdateType.post, // Or a more specific GoalUpdate type
      userId: userId, // User performing the update
      content: `Goal '${goal.title}' updated.`,
      details: { goalId: goal.id, goalTitle: goal.title },
    });

    revalidatePath(`/initiatives/${initiativeId}`);
    revalidatePath(`/initiatives/${initiativeId}/goals/${goal.id}`);
    return { success: true, goal };
  } catch (error) {
    console.error("Error updating goal:", error);
    return { success: false, error: "Failed to update goal." };
  }
}

export async function deleteGoal(goalId: string, userId: string) {
  try {
    // Find the goal and its initiative
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { initiative: true },
    });
    if (!goal) {
      return { success: false, error: 'Goal not found.' };
    }
    // Check if the user is the initiative creator
    if (goal.initiative.creatorId !== userId) {
      return { success: false, error: 'Not authorized to delete this goal.' };
    }
    await prisma.goal.delete({ where: { id: goalId } });
    revalidatePath(`/initiatives/${goal.initiativeId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'Failed to delete goal.' };
  }
}

export async function getGoalDetails(goalId: string) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        // If you have related actions and want to include them directly:
        // actions: { 
        //   orderBy: { createdAt: 'desc' },
        //   include: {
        //     assignee: { select: { id: true, name: true, image: true } },
        //     completedBy: { select: { id: true, name: true, image: true } },
        //   }
        // }
      },
    });
    return goal;
  } catch (error) {
    console.error(`Error fetching goal details for ${goalId}:`, error);
    // Consider throwing the error or returning a more specific error object
    return null;
  }
}

export async function getInitiativeDetailsForGoalPage(initiativeId: string) {
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      select: {
        id: true,
        title: true,
        imageUrl: true, // Added imageUrl to ensure it is fetched
      },
    });
    return initiative;
  } catch (error) {
    console.error(`Error fetching initiative (for goal page) ${initiativeId}:`, error);
    return null;
  }
}

export async function getRelatedActions(goalId: string) {
  try {
    const actions = await prisma.action.findMany({
      where: { goalId: goalId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        completedBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return actions;
  } catch (error) {
    console.error(`Error fetching actions for goal ${goalId}:`, error);
    return []; // Return empty array on error or throw
  }
}

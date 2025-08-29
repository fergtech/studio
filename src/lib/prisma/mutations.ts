import { GoalStatus, Priority } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function createGoal(data: {
  initiativeId: string;
  title: string;
  description?: string;
  status: GoalStatus; // Updated type
  priority?: Priority; // Updated type
  dueDate?: Date;
  ownerId: string;
  tags?: string[];
}) {
  try {
    const goalResult = await prisma.goal.create({
      data,
    });
    return goalResult;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw new Error('Failed to create goal');
  }
}

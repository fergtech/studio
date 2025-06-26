import { PrismaClient, GoalStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

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
    const goal = await prisma.goal.create({
      data,
    });
    return goal;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw new Error('Failed to create goal');
  }
}

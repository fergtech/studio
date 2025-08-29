import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';

// Removed detailed error logging for debugging
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, dueDate, priority, goalId, initiativeId, assigneeId } = body;

    if (!title || !goalId || !initiativeId) {
      console.error('Validation failed: Missing title, goalId, or initiativeId', { title, goalId, initiativeId });
      return NextResponse.json({ error: 'Title, Goal ID, and Initiative ID are required' }, { status: 400 });
    }

    // Adjust validation logic to match Prisma's Priority enum
    if (priority && !Object.values(Priority).includes(priority as Priority)) {
      console.error('Validation failed: Invalid priority value', { priority });
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    if (assigneeId) {
      const isMember = await prisma.initiativeMembership.findFirst({
        where: { initiativeId, userId: assigneeId },
      });

      if (!isMember) {
        console.error('Validation failed: Assignee is not a member of the initiative', { assigneeId });
        return NextResponse.json({ error: 'Assignee must be a member of the initiative' }, { status: 400 });
      }
    }

    const newAction = await prisma.action.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority, // Directly use priority from the frontend
        goal: { connect: { id: goalId } },
        status: 'ToDo',
        initiative: { connect: { id: initiativeId } },
        assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
      },
    });

    return NextResponse.json(newAction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating action:', error);
    return NextResponse.json({ error: 'Failed to create action', details: error.message }, { status: 500 });
  }
}

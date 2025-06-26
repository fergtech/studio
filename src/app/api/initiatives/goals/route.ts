import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initiativeId, title, description, status, priority, dueDate, ownerId, tags } = body;

    if (!initiativeId || !title) {
      return NextResponse.json({ error: 'initiativeId and title are required' }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        initiativeId,
        title,
        description,
        status,
        priority,
        dueDate,
        ownerId,
        tags,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

function checkApiKey(req: NextRequest) {
  return req.headers.get('x-citinet-api-key') === process.env.CITINET_API_KEY;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const goals = await prisma.goal.findMany({
    where: { initiativeId: id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    tasks: goals.map(g => ({
      id: g.id,
      title: g.title,
      status: g.status === 'Completed' ? 'done' : g.status === 'InProgress' ? 'in-progress' : 'todo',
      assignee: g.ownerName ?? undefined,
      dueDate: g.dueDate ? g.dueDate.toISOString().split('T')[0] : undefined,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { title, assigneeName, dueDate } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      title,
      initiativeId: id,
      status: GoalStatus.NotStarted,
      ownerName: assigneeName ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({
    id: goal.id,
    title: goal.title,
    status: 'todo',
    assignee: goal.ownerName ?? undefined,
    dueDate: goal.dueDate ? goal.dueDate.toISOString().split('T')[0] : undefined,
  }, { status: 201 });
}

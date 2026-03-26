import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

function checkApiKey(req: NextRequest) {
  return req.headers.get('x-citinet-api-key') === process.env.CITINET_API_KEY;
}

const STATUS_MAP: Record<string, GoalStatus> = {
  todo: GoalStatus.NotStarted,
  'in-progress': GoalStatus.InProgress,
  done: GoalStatus.Completed,
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.title) data.title = body.title;
  if (body.status && STATUS_MAP[body.status]) data.status = STATUS_MAP[body.status];
  if (body.assigneeName !== undefined) data.ownerName = body.assigneeName;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.progress !== undefined) data.progress = body.progress;

  const goal = await prisma.goal.update({ where: { id }, data });

  return NextResponse.json({
    id: goal.id,
    title: goal.title,
    status: goal.status === 'Completed' ? 'done' : goal.status === 'InProgress' ? 'in-progress' : 'todo',
    assignee: goal.ownerName ?? undefined,
    dueDate: goal.dueDate ? goal.dueDate.toISOString().split('T')[0] : undefined,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

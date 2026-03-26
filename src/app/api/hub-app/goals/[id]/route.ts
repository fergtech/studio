import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';
import { ensureMember } from '../../_lib/ensureMember';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

const CYCLE: Record<string, GoalStatus> = {
  todo: GoalStatus.InProgress,
  'in-progress': GoalStatus.Completed,
  done: GoalStatus.NotStarted,
};

function toClientStatus(s: GoalStatus): 'todo' | 'in-progress' | 'done' {
  if (s === 'Completed') return 'done';
  if (s === 'InProgress') return 'in-progress';
  return 'todo';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Auto-join the acting user to this initiative if not already a member
  await ensureMember(req, goal.initiativeId);

  const body = await req.json();
  const data: { status?: GoalStatus; title?: string; ownerName?: string; dueDate?: Date | null } = {};

  if (body.status) {
    const map: Record<string, GoalStatus> = {
      todo: GoalStatus.NotStarted,
      'in-progress': GoalStatus.InProgress,
      done: GoalStatus.Completed,
    };
    if (map[body.status]) data.status = map[body.status];
  } else if (body.action === 'cycle') {
    const cur = toClientStatus(goal.status);
    data.status = CYCLE[cur];
  }

  if (body.title) data.title = body.title;
  if (body.assigneeName !== undefined) data.ownerName = body.assigneeName ?? null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.goal.update({ where: { id }, data });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    status: toClientStatus(updated.status),
    assignee: updated.ownerName ?? undefined,
    dueDate: updated.dueDate ? updated.dueDate.toISOString().split('T')[0] : undefined,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

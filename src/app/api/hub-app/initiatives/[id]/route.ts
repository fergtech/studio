import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InitiativeStatus } from '@prisma/client';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

const COLORS = ['purple', 'emerald', 'blue', 'amber'] as const;
function colorFor(id: string) {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return COLORS[n % COLORS.length];
}
function toStatus(s: InitiativeStatus): 'planning' | 'active' | 'completed' {
  if (s === 'InProgress') return 'active';
  if (s === 'Completed') return 'completed';
  return 'planning';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const ini = await prisma.initiative.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      goals: { orderBy: { createdAt: 'asc' } },
      memberships: { include: { user: { select: { name: true } } } },
      updates: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!ini) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: ini.id,
    title: ini.title,
    category: ini.goals[0]?.title ?? 'General',
    status: toStatus(ini.status),
    goal: ini.description,
    description: ini.description,
    progress: ini.progress ?? 0,
    color: colorFor(ini.id),
    imageUrl: ini.imageUrl ?? null,
    createdBy: ini.creator?.name ?? 'Unknown',
    createdAt: ini.createdAt.toISOString().split('T')[0],
    tasks: ini.goals.map(g => ({
      id: g.id,
      title: g.title,
      status: g.status === 'Completed' ? 'done' : g.status === 'InProgress' ? 'in-progress' : 'todo',
      assignee: g.ownerName ?? undefined,
      dueDate: g.dueDate ? g.dueDate.toISOString().split('T')[0] : undefined,
    })),
    members: ini.memberships.map(m => ({
      id: m.id,
      name: m.user.name ?? 'Unknown',
      role: m.role,
      contribution: m.customRole ?? '',
      joinedAt: m.createdAt.toISOString().split('T')[0],
    })),
    updates: ini.updates.map(u => ({
      id: u.id,
      author: u.user.name ?? 'Unknown',
      content: u.content,
      timestamp: u.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title) data.title = body.title;
  if (body.description) data.description = body.description;
  if (body.progress !== undefined) data.progress = body.progress;
  if (body.status) {
    const map: Record<string, InitiativeStatus> = {
      planning: InitiativeStatus.Planning,
      active: InitiativeStatus.InProgress,
      completed: InitiativeStatus.Completed,
    };
    if (map[body.status]) data.status = map[body.status];
  }

  const updated = await prisma.initiative.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, status: toStatus(updated.status), progress: updated.progress });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.initiative.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

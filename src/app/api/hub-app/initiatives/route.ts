import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InitiativeStatus, InitiativeRoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

export async function GET(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const initiatives = await prisma.initiative.findMany({
    include: {
      creator: { select: { name: true } },
      goals: { orderBy: { createdAt: 'asc' } },
      memberships: { include: { user: { select: { name: true } } } },
      updates: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = initiatives.map(ini => ({
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
  }));

  return NextResponse.json({ initiatives: data });
}

export async function POST(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, creatorEmail, creatorName } = await req.json();
  if (!title || !creatorEmail) {
    return NextResponse.json({ error: 'title and creatorEmail are required' }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email: creatorEmail } });
  if (!user) {
    const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: { email: creatorEmail, name: creatorName ?? creatorEmail.split('@')[0], passwordHash: hash },
    });
  }

  const initiative = await prisma.initiative.create({
    data: {
      title,
      description: description ?? title,
      status: InitiativeStatus.Planning,
      creatorId: user.id,
    },
    include: { creator: { select: { name: true } } },
  });

  await prisma.initiativeMembership.create({
    data: { userId: user.id, initiativeId: initiative.id, role: InitiativeRoleType.ADMIN },
  });

  return NextResponse.json({
    id: initiative.id,
    title: initiative.title,
    status: 'planning',
    color: colorFor(initiative.id),
    createdBy: initiative.creator?.name ?? 'Unknown',
    createdAt: initiative.createdAt.toISOString().split('T')[0],
    tasks: [], members: [], updates: [],
    goal: initiative.description,
    description: initiative.description,
    progress: 0,
    category: 'General',
  }, { status: 201 });
}

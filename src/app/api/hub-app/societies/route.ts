import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateUser, toHubSpace } from './_lib/helpers';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

const INCLUDE = {
  memberships: { include: { user: { select: { id: true, email: true, name: true, image: true } } } },
  creator: { select: { id: true, name: true } },
};

// GET /api/hub-app/societies — list all societies
export async function GET(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerEmail = req.headers.get('x-hub-user-email');
  const societies = await prisma.society.findMany({ include: INCLUDE, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(societies.map(s => toHubSpace(s, callerEmail)));
}

// POST /api/hub-app/societies — create society
export async function POST(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerEmail = req.headers.get('x-hub-user-email');
  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!callerEmail) return NextResponse.json({ error: 'x-hub-user-email required' }, { status: 400 });

  const user = await findOrCreateUser(callerEmail);
  const society = await prisma.society.create({
    data: { name: name.trim(), description: description ?? null, creatorId: user.id },
    include: INCLUDE,
  });

  await prisma.societyMembership.create({
    data: { userId: user.id, societyId: society.id, role: 'admin' },
  });

  const fresh = await prisma.society.findUnique({ where: { id: society.id }, include: INCLUDE });
  return NextResponse.json(toHubSpace(fresh!, callerEmail), { status: 201 });
}

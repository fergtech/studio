import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toHubSpace } from '../_lib/helpers';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

const INCLUDE = {
  memberships: { include: { user: { select: { id: true, email: true, name: true, image: true } } } },
  creator: { select: { id: true, name: true } },
};

type Ctx = { params: Promise<{ id: string }> };

// GET /api/hub-app/societies/:id
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');
  const society = await prisma.society.findUnique({ where: { id }, include: INCLUDE });
  if (!society) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toHubSpace(society, callerEmail));
}

// PATCH /api/hub-app/societies/:id — update name/description
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');
  const { name, description } = await req.json();

  const updated = await prisma.society.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
    include: INCLUDE,
  });
  return NextResponse.json(toHubSpace(updated, callerEmail));
}

// DELETE /api/hub-app/societies/:id
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');

  const society = await prisma.society.findUnique({ where: { id }, select: { creatorId: true } });
  if (!society) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (callerEmail) {
    const user = await prisma.user.findUnique({ where: { email: callerEmail }, select: { id: true } });
    if (user && society.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the creator can delete a society' }, { status: 403 });
    }
  }

  await prisma.society.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

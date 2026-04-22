import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

type Ctx = { params: Promise<{ id: string; userId: string }> };

// PATCH /api/hub-app/societies/:id/members/:userId — change role
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, userId } = await params;
  const { role } = await req.json();

  const spRole = role === 'owner' || role === 'admin' ? 'admin' : 'MEMBER';
  await prisma.societyMembership.updateMany({
    where: { societyId: id, userId },
    data: { role: spRole },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/hub-app/societies/:id/members/:userId — remove member
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, userId } = await params;

  const society = await prisma.society.findUnique({ where: { id }, select: { creatorId: true } });
  if (!society) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (society.creatorId === userId) {
    return NextResponse.json({ error: 'Cannot remove the society creator' }, { status: 400 });
  }

  await prisma.societyMembership.deleteMany({ where: { societyId: id, userId } });
  return NextResponse.json({ ok: true });
}

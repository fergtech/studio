import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');
  if (!callerEmail) return NextResponse.json({ error: 'x-hub-user-email required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: callerEmail }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const society = await prisma.society.findUnique({ where: { id }, select: { creatorId: true } });
  if (!society) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (society.creatorId === user.id) {
    return NextResponse.json({ error: 'Creator cannot leave. Delete the society instead.' }, { status: 400 });
  }

  await prisma.societyMembership.deleteMany({ where: { userId: user.id, societyId: id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateUser } from '../../_lib/helpers';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');
  if (!callerEmail) return NextResponse.json({ error: 'x-hub-user-email required' }, { status: 400 });

  const society = await prisma.society.findUnique({ where: { id } });
  if (!society) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await findOrCreateUser(callerEmail);
  await prisma.societyMembership.upsert({
    where: { userId_societyId: { userId: user.id, societyId: id } },
    update: {},
    create: { userId: user.id, societyId: id, role: 'MEMBER' },
  });

  return NextResponse.json({ status: 'active' });
}

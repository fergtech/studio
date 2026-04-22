import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toHubMember } from '../../_lib/helpers';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/hub-app/societies/:id/members
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const memberships = await prisma.societyMembership.findMany({
    where: { societyId: id },
    include: { user: { select: { id: true, email: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(memberships.map(toHubMember));
}

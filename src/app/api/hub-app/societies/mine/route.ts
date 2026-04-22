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

// GET /api/hub-app/societies/mine — societies the acting user is a member of
export async function GET(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerEmail = req.headers.get('x-hub-user-email');
  if (!callerEmail) return NextResponse.json([], { status: 200 });

  const user = await prisma.user.findUnique({ where: { email: callerEmail } });
  if (!user) return NextResponse.json([], { status: 200 });

  const memberships = await prisma.societyMembership.findMany({
    where: { userId: user.id },
    include: { society: { include: INCLUDE } },
  });

  const societies = memberships.map(m => toHubSpace(m.society, callerEmail));
  return NextResponse.json(societies);
}

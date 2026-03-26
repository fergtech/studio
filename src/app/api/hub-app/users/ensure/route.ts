import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

// Find-or-create a Society+ user by email.
// Used by hub apps to link their users to Society+ accounts.
export async function POST(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: {
        email,
        name: name ?? email.split('@')[0],
        passwordHash: hash,
      },
    });
  }

  return NextResponse.json({ userId: user.id, email: user.email, name: user.name });
}

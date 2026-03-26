import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function checkApiKey(req: NextRequest) {
  return req.headers.get('x-citinet-api-key') === process.env.CITINET_API_KEY;
}

// Ensures a Society+ user exists for a given Citinet user (matched by email).
// Returns the Society+ user ID so Citinet can store the mapping.
export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  return NextResponse.json({ societyUserId: user.id, email: user.email, name: user.name });
}

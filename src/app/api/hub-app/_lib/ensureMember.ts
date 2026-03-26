import { prisma } from '@/lib/prisma';
import { InitiativeRoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Reads x-hub-user-email from the request, finds or creates the Society+ user,
 * and ensures they are a member of the given initiative.
 * Safe to call on every write — no-ops if already a member.
 */
export async function ensureMember(
  req: Request | { headers: { get(name: string): string | null } },
  initiativeId: string,
): Promise<void> {
  const email = req.headers.get('x-hub-user-email');
  if (!email) return;

  // Find or create the user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        passwordHash: hash,
      },
    });
  }

  // Add as MEMBER if not already a member
  await prisma.initiativeMembership.upsert({
    where: { userId_initiativeId: { userId: user.id, initiativeId } },
    update: {},
    create: { userId: user.id, initiativeId, role: InitiativeRoleType.MEMBER },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: List all societies
export async function GET(req: NextRequest) {
  try {
    const societies = await prisma.society.findMany({
      include: {
        memberships: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(societies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch societies', details: error }, { status: 500 });
  }
}

// POST: Create a new society
export async function POST(req: NextRequest) {
  try {
    // Get userId from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { name, description, image } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create society and automatically add creator as a member in a transaction
    const society = await prisma.$transaction(async (tx) => {
      const newSociety = await tx.society.create({
        data: {
          name,
          description,
          image,
          creatorId: userId,
        },
      });

      // Automatically add creator as a member with admin role
      await tx.societyMembership.create({
        data: {
          userId,
          societyId: newSociety.id,
          role: 'admin',
        },
      });

      return newSociety;
    });

    console.log(`[Society Created] User ${userId} created society ${society.id} and added as admin member`);

    return NextResponse.json(society, { status: 201 });
  } catch (error) {
    console.error('[Society Creation Error]', error);
    return NextResponse.json({ error: 'Failed to create society', details: error }, { status: 500 });
  }
} 
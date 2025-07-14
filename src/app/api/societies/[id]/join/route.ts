import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const societyId = params.id;

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.societyMembership.findUnique({
      where: {
        userId_societyId: {
          userId,
          societyId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this society' }, { status: 400 });
    }

    // Create membership
    const membership = await prisma.societyMembership.create({
      data: {
        userId,
        societyId,
        role: 'MEMBER', // Default role for new members
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, membership }, { status: 201 });
  } catch (error) {
    console.error('Error joining society:', error);
    return NextResponse.json({ error: 'Failed to join society' }, { status: 500 });
  }
} 
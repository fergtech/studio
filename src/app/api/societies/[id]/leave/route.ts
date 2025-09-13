import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: societyId } = await params;

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }

    // Check if user is a member
    const membership = await prisma.societyMembership.findUnique({
      where: {
        userId_societyId: {
          userId,
          societyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this society' }, { status: 400 });
    }

    // Prevent the creator from leaving (they should delete the society instead)
    if (society.creatorId === userId) {
      return NextResponse.json({ error: 'Society creator cannot leave. Please delete the society instead.' }, { status: 400 });
    }

    // Delete membership
    await prisma.societyMembership.delete({
      where: {
        userId_societyId: {
          userId,
          societyId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving society:', error);
    return NextResponse.json({ error: 'Failed to leave society' }, { status: 500 });
  }
} 
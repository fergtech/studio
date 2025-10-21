import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if initiative exists and user is the creator
    const existingInitiative = await prisma.initiative.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingInitiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    if (existingInitiative.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own initiatives' }, { status: 403 });
    }

    // Delete the initiative (cascade will handle related records)
    await prisma.initiative.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting initiative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

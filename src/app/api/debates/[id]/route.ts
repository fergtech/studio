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

    // Check if debate exists and user is the creator
    const existingDebate = await prisma.debateTopic.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingDebate) {
      return NextResponse.json({ error: 'Debate topic not found' }, { status: 404 });
    }

    if (existingDebate.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own debate topics' }, { status: 403 });
    }

    // Delete the debate topic (cascade will handle related records)
    await prisma.debateTopic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
